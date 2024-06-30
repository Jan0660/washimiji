package main

import (
	"context"
	"strconv"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
)

// I don't like this but I believe getting stuff out of MongoDB each time a translate request is made is worse

var charactersCache []Character = nil
var wordsCache []Word = nil
var wordsWithTextCache []WordWithText = nil
var CharactersModified bool = false
var WordsModified bool = false

func GetAllCharactersCached(context context.Context) ([]Character, error) {
	if charactersCache != nil && !CharactersModified {
		return charactersCache, nil
	}
	return GetAllCharacters(context)
}

func GetAllWordsCached(context context.Context) ([]Word, error) {
	if wordsCache != nil && !WordsModified {
		return wordsCache, nil
	}
	return GetAllWords(context)
}

func GetWordText(word Word, characters []Character) string {
	text := ""
	for i := 0; i < len(word.Characters); i++ {
		char := word.Characters[i]
		if strings.HasPrefix(char, "n:") {
			name := char[2:]
			for _, character := range characters {
				if character.MakeInfo.Name == name {
					if character.MakeInfo.Code == nil {
						continue
					}
					characterCode, _ := strconv.ParseInt(*character.MakeInfo.Code, 16, 32)
					text += string(rune(characterCode))
				}
			}
		} else if strings.HasPrefix(char, "t:") {
			text += char[2:]
		}
	}
	return text
}

func GetAllWordsWithTextCached(context context.Context) ([]WordWithText, error) {
	if wordsWithTextCache != nil {
		return wordsWithTextCache, nil
	}
	words, err := GetAllWordsCached(context)
	if err != nil {
		return nil, err
	}
	characters, err := GetAllCharactersCached(context)
	if err != nil {
		return nil, err
	}
	wordsWithText := make([]WordWithText, 0, len(words))
	for _, word := range words {
		text := GetWordText(word, characters)
		wordsWithText = append(wordsWithText, WordWithText{
			Word: word,
			Text: text,
		})
	}
	return wordsWithText, nil
}

func GetAllCharacters(context context.Context) ([]Character, error) {
	res, err := CharCol.Find(context, bson.M{})
	if err != nil {
		return nil, err
	}
	var characters []Character
	err = res.All(context, &characters)
	if err == nil {
		charactersCache = characters
		CharactersModified = false
	}
	return characters, err
}

func GetAllWords(context context.Context) ([]Word, error) {
	res, err := WordCol.Find(context, bson.M{})
	if err != nil {
		return nil, err
	}
	var words []Word
	err = res.All(context, &words)
	if err == nil {
		wordsCache = words
		wordsWithTextCache = nil
		WordsModified = false
	}
	return words, err
}
