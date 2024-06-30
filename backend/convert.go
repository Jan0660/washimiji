package main

import (
	"context"
	"strings"
)

func isAlphabetical(char byte) bool {
	return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}

func nextNonAlphabeticalCharacter(text string, start int) int {
	for i := start; i < len(text); i++ {
		if !isAlphabetical(text[i]) {
			return i
		}
	}
	return -1
}

func ToWashimiji(text string, context context.Context) (string, error) {
	words, err := GetAllWordsWithTextCached(context)
	if err != nil {
		return "", err
	}
	output := strings.Builder{}
	output.Grow(len(text))
	i := 0
	lastWasWashimiji := false
	for {
		if i >= len(text) {
			break
		}
		// this could maybe be a problem when processing text that contains UTF8 chars in two bytes
		// because this just checks a single byte, ignoring if it is part of a multi-byte character
		if !isAlphabetical(text[i]) {
			if lastWasWashimiji && text[i] == ' ' {
				i++
				continue
			}
			_ = output.WriteByte(text[i])
			lastWasWashimiji = false
			i++
			continue
		}
		// try to match a word
		var longestMatch *WordWithText
		longestMatchLength := 0
		for _, word := range words {
			for _, wordForm := range word.Words {
				if len(wordForm) > longestMatchLength && i+len(wordForm) <= len(text) && strings.EqualFold(text[i:i+len(wordForm)], wordForm) {
					longestMatch = &word
					longestMatchLength = len(wordForm)
				}
			}
		}
		if longestMatchLength != 0 {
			_, _ = output.WriteString(longestMatch.Text)
			i += longestMatchLength
			lastWasWashimiji = true
		} else {
			nextSpace := nextNonAlphabeticalCharacter(text, i)
			if nextSpace == -1 {
				nextSpace = len(text)
			}
			written, _ := output.WriteString(text[i:nextSpace])
			i += written
			lastWasWashimiji = false
		}
		if context.Err() != nil {
			return "", context.Err()
		}
	}
	return output.String(), nil
}

func FromWashimiji(text string, context context.Context) (string, error) {
	words, err := GetAllWordsWithTextCached(context)
	if err != nil {
		return "", err
	}
	output := strings.Builder{}
	output.Grow(len(text))
	i := 0
	for {
		if i >= len(text) {
			break
		}
		// try to match a word
		var longestMatch *WordWithText
		longestMatchLength := 0
		for _, word := range words {
			if len(word.Text) > longestMatchLength && i+len(word.Text) <= len(text) && strings.EqualFold(text[i:i+len(word.Text)], word.Text) {
				longestMatch = &word
				longestMatchLength = len(word.Text)
			}
		}
		if longestMatchLength != 0 {
			_, _ = output.WriteString(longestMatch.Words[0])
			i += longestMatchLength
		} else {
			nextSpace := strings.IndexRune(text[i:], ' ')
			if nextSpace == -1 {
				nextSpace = len(text) - i
			} else if nextSpace == 0 {
				nextSpace = 1
			}
			written, _ := output.WriteString(text[i : i+nextSpace])
			i += written
		}
		if context.Err() != nil {
			return "", context.Err()
		}
	}
	return output.String(), nil
}
