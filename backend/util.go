package main

import (
	"math/rand"

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
