package main

import (
	"slices"
	"strings"
)

type SearchQuery struct {
	Text         string
	Tags         []string
	DerivedNames []string
	DerivedFrom  string
}

func ParseSearchQuery(q string) SearchQuery {
	text := ""
	tags := []string{}
	derivedNames := []string{}
	derivedFrom := ""
	for _, word := range strings.FieldsFunc(q, func(ch rune) bool { return ch == ' ' || ch == '　' }) {
		if strings.TrimSpace(word) == "" {
			continue
		}
		if strings.HasPrefix(word, "#") {
			tag := strings.ToLower(word[1:])
			if slices.Contains(DerivationNames, tag) {
				derivedNames = append(derivedNames, tag)
			} else {
				if v, found := strings.CutPrefix(tag, "derivedfrom:"); found {
					derivedFrom = strings.ToUpper(v)
				} else {
					tags = append(tags, tag)
				}
			}
		} else {
			if text != "" {
				text += " " + word
			} else {
				text = word
			}
		}
	}
	return SearchQuery{text, tags, derivedNames, derivedFrom}
}
