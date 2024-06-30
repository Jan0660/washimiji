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
