package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"slices"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Config Configuration
var MongoClient *mongo.Client
var CharCol *mongo.Collection
var WordCol *mongo.Collection

func main() {
	{
		bytes, err := os.ReadFile("./config.json")
		if err != nil {
			log.Fatalln(err)
		}
		err = json.Unmarshal(bytes, &Config)
		if err != nil {
			log.Fatalln(err)
		}
		Config.Paths.CustomCharacters = PathAbs(Config.Paths.CustomCharacters)
		Config.Paths.CharacterMakerOutput = PathAbs(Config.Paths.CharacterMakerOutput)
		Config.Paths.StaticServe = PathAbs(Config.Paths.StaticServe)
		Config.Paths.MakeFontConfig = PathAbs(Config.Paths.MakeFontConfig)
	}
	{
		var err error
		MongoClient, err = mongo.Connect(context.TODO(), options.Client().ApplyURI(Config.MongoUrl))
		if err != nil {
			log.Fatalln(err)
		}
		db := MongoClient.Database(Config.MongoDatabase)
		_ = db.CreateCollection(context.TODO(), "characters")
		CharCol = db.Collection("characters")
		_ = db.CreateCollection(context.TODO(), "words")
		WordCol = db.Collection("words")
	}

	r := gin.Default()
	r.Use(func(c *gin.Context) {
		if Config.AccessControlAllowOrigin != nil {
			acao := Config.AccessControlAllowOrigin
			if len(acao) == 1 {
				c.Header("Access-Control-Allow-Origin", acao[0])
			} else {
				c.Header("Vary", "Origin")
				origin := c.GetHeader("Origin")
				if origin != "" {
					for _, allowedOrigin := range acao {
						if origin == allowedOrigin {
							c.Header("Access-Control-Allow-Origin", origin)
							break
						}
					}
				}
			}
		}
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, x-session-token, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	authed := r.Group("/", func(c *gin.Context) {
		if !slices.Contains(Config.Tokens, c.GetHeader("x-session-token")) {
			c.Status(401)
			c.Abort()
			return
		}
		c.Next()
	})
	// todo: paginate
	r.GET("/characters", func(c *gin.Context) {
		res, err := CharCol.Find(context.TODO(), bson.M{})
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		var characters []Character
		err = res.All(context.TODO(), &characters)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.JSON(200, &characters)
	})
	r.GET("/characters/:id", func(c *gin.Context) {
		id := c.Param("id")
		var character Character
		res := CharCol.FindOne(context.TODO(), bson.M{"_id": id})
		err := res.Decode(&character)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.JSON(200, character)
	})
	authed.POST("/characters", func(c *gin.Context) {
		CharactersModified = true
		WordsModified = true
		var character Character
		err := c.BindJSON(&character)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		character.Id = NewUlid()
		// todo: validation (incl. checking makeInfo.name is not already used)
		_, err = CharCol.InsertOne(context.TODO(), character)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		c.JSON(200, character)
	})
	authed.PATCH("/characters", func(c *gin.Context) {
		CharactersModified = true
		WordsModified = true
		var character Character
		err := c.BindJSON(&character)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		// todo: validation
		_, err = CharCol.ReplaceOne(context.TODO(), bson.M{"_id": character.Id}, character)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		c.Status(200)
	})
	// todo: paginate
	r.GET("/words", func(c *gin.Context) {
		res, err := WordCol.Find(context.TODO(), bson.M{})
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		var words []Word
		err = res.All(context.TODO(), &words)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.JSON(200, &words)
	})
	r.GET("/words/:id", func(c *gin.Context) {
		id := c.Param("id")
		var word Word
		res := WordCol.FindOne(context.TODO(), bson.M{"_id": id})
		err := res.Decode(&word)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.JSON(200, word)
	})
	authed.POST("/words", func(c *gin.Context) {
		WordsModified = true
		var word Word
		err := c.BindJSON(&word)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		word.Id = NewUlid()
		// todo: validation
		_, err = WordCol.InsertOne(context.TODO(), word)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		c.JSON(200, word)
	})
	authed.PATCH("/words", func(c *gin.Context) {
		WordsModified = true
		var word Word
		err := c.BindJSON(&word)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		// todo: validation
		_, err = WordCol.ReplaceOne(context.TODO(), bson.M{"_id": word.Id}, word)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.Status(200)
	})
	r.GET("/words/:id/withText", func(c *gin.Context) {
		id := c.Param("id")
		var word Word
		res := WordCol.FindOne(context.TODO(), bson.M{"_id": id})
		err := res.Decode(&word)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		characters, err := GetAllCharactersCached(context.TODO())
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.JSON(200, WordWithText{
			Word: word,
			Text: GetWordText(word, characters),
		})
	})
	r.GET("/words/withText", func(c *gin.Context) {
		wordsWithText, err := GetAllWordsWithTextCached(context.TODO())
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		c.JSON(200, wordsWithText)
	})
	authed.GET("/make-font", func(c *gin.Context) {
		err := MakeFont(context.TODO())
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.Status(200)
	})
	convert := r.Group("/convert", func(c *gin.Context) {
		if c.Request.ContentLength > int64(Config.ConvertBodyLimit) {
			c.AbortWithStatusJSON(400, ErrorStr(fmt.Sprintf("Convert request body must not be larger than %d", Config.ConvertBodyLimit)))
			return
		}
		c.Next()
	})
	convert.POST("/to", func(c *gin.Context) {
		type Request struct {
			Text string `json:"text"`
		}
		var req Request
		err := c.BindJSON(&req)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		defer cancel()
		output, err := ToWashimiji(req.Text, ctx)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.JSON(200, Request{Text: output})
	})
	convert.POST("/from", func(c *gin.Context) {
		type Request struct {
			Text string `json:"text"`
		}
		var req Request
		err := c.BindJSON(&req)
		if err != nil {
			c.JSON(400, Error(err))
			return
		}
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		defer cancel()
		output, err := FromWashimiji(req.Text, ctx)
		if err != nil {
			c.JSON(500, Error(err))
			return
		}
		c.JSON(200, Request{Text: output})
	})
	if _, err := os.Stat(Config.Paths.StaticServe); os.IsNotExist(err) {
		os.Mkdir(Config.Paths.StaticServe, 0750)
	}
	r.StaticFS("/static", gin.Dir(Config.Paths.StaticServe, true))
	r.Run(Config.Address)
}

// Makes fonts, copies and writes data to the static file server
func MakeFont(context context.Context) error {
	// todo: Mutex/whatever this so this can't be running more than once
	// write custom-characters.json
	characters, err := GetAllCharacters(context)
	if err != nil {
		return err
	}
	{
		buf, err := json.Marshal(characters)
		if err != nil {
			return err
		}
		err = os.WriteFile(path.Join(Config.Paths.StaticServe, "characters.json"), buf, 0644)
		if err != nil {
			return err
		}
	}
	err = WriteCustomCharactersFile(&characters, Config.Paths.CustomCharacters)
	if err != nil {
		return err
	}
	err = CopyFile(Config.Paths.CustomCharacters, path.Join(Config.Paths.StaticServe, "custom-characters.json"))
	if err != nil {
		return err
	}
	// run character-maker
	cmd := exec.Command(Config.Paths.MakeCharacters, "generate")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		return err
	}
	// read report, assign character codes not assigned yet
	reportPath := path.Join(path.Join(Config.Paths.CharacterMakerOutput, "report.json"))
	err = CopyFile(reportPath, path.Join(Config.Paths.StaticServe, "report.json"))
	if err != nil {
		return err
	}
	buf, err := os.ReadFile(reportPath)
	if err != nil {
		return err
	}
	var report Report
	err = json.Unmarshal(buf, &report)
	if err != nil {
		return err
	}
	for _, char := range characters {
		if char.MakeInfo.Code == nil {
			if code, ok := report.MadeCharacters[char.Id]; ok {
				// todo: would be nice if multiple updates could go on at a time instead of waiting for response each time
				CharCol.UpdateOne(context, bson.M{"_id": char.Id}, bson.M{
					"$set": bson.M{
						"makeInfo.code": code,
					},
				})
			}
		}
	}
	// make font
	cmd = exec.Command(Config.Paths.MakeFont,
		path.Join(Config.Paths.CharacterMakerOutput, "glyphs"),
		path.Join(Config.Paths.StaticServe, "font.ttf"),
		Config.Paths.MakeFontConfig)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		return err
	}
	// write words.json
	words, err := GetAllWords(context)
	if err != nil {
		return err
	}
	buf, err = json.Marshal(words)
	if err != nil {
		return err
	}
	err = os.WriteFile(path.Join(Config.Paths.StaticServe, "words.json"), buf, 0644)
	if err != nil {
		return err
	}
	return nil
}

func WriteCustomCharactersFile(characters *[]Character, filename string) error {
	characterMakeInfos := make([]CharacterMakeInfo, len(*characters))
	for i, char := range *characters {
		characterMakeInfos[i] = char.MakeInfo
		characterMakeInfos[i].Name = char.Id
	}
	buf, err := json.Marshal(&characterMakeInfos)
	if err != nil {
		return err
	}
	os.WriteFile(filename, buf, os.FileMode(0644))
	return nil
}

func CopyFile(source string, dest string) error {
	buf, err := os.ReadFile(source)
	if err != nil {
		return err
	}
	err = os.WriteFile(dest, buf, 0644)
	return err
}

func PathAbs(path string) string {
	path, _ = filepath.Abs(path)
	return path
}

type Configuration struct {
	Address                  string             `json:"address"`
	Tokens                   []string           `json:"tokens"`
	MongoUrl                 string             `json:"mongoUrl"`
	MongoDatabase            string             `json:"mongoDatabase"`
	Paths                    PathsConfiguration `json:"paths"`
	AccessControlAllowOrigin []string           `json:"accessControlAllowOrigin"`
	ConvertBodyLimit         int                `json:"convertBodyLimit"`
}

type PathsConfiguration struct {
	CustomCharacters     string `json:"customCharacters"`
	CharacterMakerOutput string `json:"characterMakerOutput"`
	StaticServe          string `json:"staticServe"`
	MakeCharacters       string `json:"makeCharacters"`
	MakeFont             string `json:"makeFont"`
	MakeFontConfig       string `json:"makeFontConfig"`
}
