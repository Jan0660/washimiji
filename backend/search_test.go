package main

import (
	"slices"
	"testing"
)

func TestParseSearchQuery(t *testing.T) {
	var tests = []struct {
		q    string
		want SearchQuery
	}{
		{" \t\n\r ", SearchQuery{"", []string{}, []string{}, ""}},
		{"hello", SearchQuery{"hello", []string{}, []string{}, ""}},
		{"text1 #tag #TAG2 text2", SearchQuery{"text1 text2", []string{"tag", "tag2"}, []string{}, ""}},
		{"#" + DerivationNames[0], SearchQuery{"", []string{}, []string{DerivationNames[0]}, ""}},
		{"#derivedfrom:id", SearchQuery{"", []string{}, []string{}, "ID"}},
		{"#derivedfrom:ID", SearchQuery{"", []string{}, []string{}, "ID"}},
	}

	for _, tt := range tests {
		t.Run(tt.q, func(t *testing.T) {
			parsedQuery := ParseSearchQuery(tt.q)
			if tt.want.Text != parsedQuery.Text ||
				tt.want.DerivedFrom != parsedQuery.DerivedFrom ||
				!slices.Equal(tt.want.Tags, parsedQuery.Tags) ||
				!slices.Equal(tt.want.DerivedNames, parsedQuery.DerivedNames) {
				t.Errorf("got %s, want %s", parsedQuery, tt.want)
			}
		})
	}
}
