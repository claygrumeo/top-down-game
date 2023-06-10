package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"golang.org/x/net/websocket"
)

const MAX_BUF = 1024

const TICK_RATE = 30

type Server struct {
	conns sync.Map // Use concurrent Maps
}

func NewServer() *Server {
	return &Server{}
}

// Handle all new client connection requests and store them in a Global thread-safe Map
func (s *Server) handleWS(ws *websocket.Conn) {
	log.Println("New incoming connection from client:", ws.RemoteAddr())
	var initPos = []int{-350, -350, 115}
	s.conns.Store(ws, initPos)
	go s.readLoop(ws)
	s.updateLoop()

}

// Put each client inside a read loop
func (s *Server) readLoop(ws *websocket.Conn) {
	buf := make([]byte, MAX_BUF)
	for {
		n, err := ws.Read(buf)
		if err != nil {
			if err == io.EOF {
				log.Println("Connection closed by client")
				s.clientDisconnect(ws)
				break
			}
			log.Println("Cannot read msg:", err)
			continue
		}

		msg := buf[:n]
		var intPos []int
		err = json.Unmarshal(msg, &intPos)
		if err != nil {
			log.Println("Unable to read pos:", err)
		}
		fmt.Println("msg:", intPos)
		ws.Write([]byte("Message received"))
	}
}

// Gracefully remove client after disconnect
func (s *Server) clientDisconnect(ws *websocket.Conn) {
	s.conns.Delete(ws)
}

// Perform necessary calculations after combining inputs from all clients
func calculatePos() {

}

// Broadcast the updates to all connected clients according to the server tickrate
func (s *Server) updateLoop() {

	ticker := time.NewTicker(TICK_RATE * time.Millisecond)

	for {
		select {
		case t := <-ticker.C:
			// Combine locations from all Map keys
			fmt.Println("Tick at:", t)
			buf := make([]int, MAX_BUF)
			s.conns.Range(func(key, value any) bool {
				for _, val := range value.([]int) {
					buf = append(buf, val)
				}
				buf = append(buf, 0)
				return true
			})
			// Broadcast message to all clients
			s.conns.Range(func(key, value any) bool {
				b, err := json.Marshal(buf)
				if err != nil {
					fmt.Println("Cannot convert []int to []byte:", err)
					return false
				}
				key.(*websocket.Conn).Write(b)
				return true
			})
		default:
			continue
		}
	}

}

func main() {
	server := NewServer()
	http.Handle("/ws", websocket.Handler(server.handleWS))
	log.Println("Listening on port 3025")
	http.ListenAndServe(":3025", nil)
}
