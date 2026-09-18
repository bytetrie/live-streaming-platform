package main

import (
	"fmt"

	"github.com/go-redis/redis"
)

// DataStore is a store of data
type DataStore struct {
	db   *redis.Client
	push chan Message
	incr chan int
}

func newDataStore() *DataStore {
	redisdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	return &DataStore{
		db:   redisdb,
		push: make(chan Message),
		incr: make(chan int),
	}
}

func (ds *DataStore) run() {
	for {
		select {
		case message := <-ds.push:
			// TODO: push new key for individual clients
			ds.db.RPush(fmt.Sprintf("%d", message.ID), message.X, message.Y)
		case value := <-ds.incr:
			ds.db.Do("SET", "users", value)
		}
	}
}
