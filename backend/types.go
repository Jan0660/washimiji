package main

// types for communication with other parts of the project

type ChracterMakerConfig struct {
	Characters *[]*CharacterMakeInfo `json:"characters"`
}

type CharacterMakeInfo struct {
	Name  string                `json:"name" bson:"name"`
	Parts *[]*CharacterMakePart `json:"parts" bson:"parts"`
	Code  *string               `json:"code,omitempty" bson:"code,omitempty"`
}

type CharacterMakePart struct {
	Type      string                `json:"type" bson:"type"`
	Parts     *[]*CharacterMakePart `json:"parts,omitempty" bson:"parts,omitempty"`
	Character *string               `json:"character,omitempty" bson:"character,omitempty"`
	// todo: will these be fine with just float64?
	Move     *[]float64 `json:"move,omitempty" bson:"move,omitempty"`
	Multiply *[]float64 `json:"multiply,omitempty" bson:"multiply,omitempty"`
}

type Report struct {
	MadeCharacters   map[string]string `json:"madeCharacters"`
	FailedCharacters []string          `json:"failedCharacters"`
}

type MutilationFile struct {
	Substitutions *map[string]string     `json:"substitutions,omitempty"`
	Mutilations   []MutilationDefinition `json:"mutilations"`
	SvgPrefix     string                 `json:"svgPrefix"`
	SvgSuffix     string                 `json:"svgSuffix"`
	ViewBox       ViewBox                `json:"viewBox"`
}

type MutilationDefinition struct {
	Name          string       `json:"name"`
	BaseCharacter *string      `json:"baseCharacter,omitempty"`
	PartCount     int32        `json:"partCount"`
	Parts         []Mutilation `json:"parts"`
}

type Mutilation struct {
	XMove        *float64 `json:"xmove"`
	YMove        *float64 `json:"ymove"`
	XMultiply    *float64 `json:"xmultiply"`
	YMultiply    *float64 `json:"ymultiply"`
	InsertSvg    *string  `json:"insertSvg"`
	AbsoluteMove *bool    `json:"absoluteMove"`
}

type ViewBox struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

// database types

type Character struct {
	Id       string            `json:"_id" bson:"_id"`
	MakeInfo CharacterMakeInfo `json:"makeInfo" bson:"makeInfo"`
}

type Word struct {
	Id         string   `json:"_id" bson:"_id"`
	Characters []string `json:"characters" bson:"characters"`
	Words      []string `json:"words" bson:"words"`
}

// API types

type WordWithText struct {
	Word
	Text string `json:"text"`
}
