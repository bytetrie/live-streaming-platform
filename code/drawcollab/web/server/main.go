package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		// TODO: Change to allow only given URL, hint: origin := r.Header["Origin"]
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	// TODO: fix concurrency model with read/write from client list (mutex?)
	clients   = make(map[*websocket.Conn]int) // connected clients
	broadcast = make(chan Message)            // broadcast channel
	id        = 0
)

// Message is the message type
type Message struct {
	X  float64
	Y  float64
	ID int
}

func handleConnections(w http.ResponseWriter, r *http.Request, ds *DataStore) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	// Make sure we close the connection when the function returns
	defer ws.Close()

	// Register our new client
	clients[ws] = id
	id++
	ds.incr <- id

	for {
		var msg Message
		// Read in a new message as JSON and map it to a Message object

		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error 0: %v", err)
			delete(clients, ws)
			break
		}
		// log.Printf("Got message: %#v\n", msg)
		msg.ID = clients[ws]
		// log.Printf("Got message w/ ID: %#v\n", msg)
		// Send the newly received message to the broadcast channel
		broadcast <- msg
	}
}

func handleMessages(ds *DataStore) {
	for {
		msg := <-broadcast
		ds.push <- msg
	}
}

func main() {
	ds := newDataStore()
	go ds.run()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		handleConnections(w, r, ds)
	})
	go handleMessages(ds)

	err := http.ListenAndServe(":1337", nil)

	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
