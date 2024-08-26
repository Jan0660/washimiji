package main

import (
	"math/rand"
	"slices"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/oklog/ulid/v2"
)

var entropy = ulid.Monotonic(rand.New(rand.NewSource(int64(ulid.Now()))), 0)

func NewUlid() string {
	return ulid.MustNew(ulid.Now(), entropy).String()
}

func Error(err error) gin.H {
	return gin.H{"error": err.Error()}
}

func ErrorStr(str string) gin.H {
	return gin.H{"error": str}
}

func ArrayIs(a []string, b []string) bool {
	slices.Sort(a)
	slices.Sort(b)
	return slices.Equal(a, b)
}

func DerivationName(tags []string) string {
	var derivationName string
	if ArrayIs(tags, []string{"present", "singular", "third-person"}) {
		derivationName = "third"
	} else if ArrayIs(tags, []string{"participle", "present"}) {
		derivationName = "gerund"
	} else if ArrayIs(tags, []string{"possessive", "pronoun", "without-noun"}) {
		derivationName = "independent-possessive"
	} else if ArrayIs(tags, []string{"possessive", "determiner"}) {
		derivationName = "possessive"
	} else if ArrayIs(tags, []string{"singular", "reflexive"}) {
		derivationName = "reflexive"
	} else {
		slices.Reverse(tags)
		derivationName = strings.Join(tags, "-")
	}
	return derivationName
}
