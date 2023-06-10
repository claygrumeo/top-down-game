package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"

	"golang.org/x/net/websocket"
)

const MAX_BUF = 1024

type Server struct {
	conns sync.Map // Use concurrent Maps
}

func NewServer() *Server {
	return &Server{}
}

// Handle all new client connection requests and store them in a Global thread-safe Map
func (s *Server) handleWS(ws *websocket.Conn) {
	log.Println("New incoming connection from client:", ws.RemoteAddr())
	s.conns.Store(ws, true)
	s.readLoop(ws)

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
		fmt.Println("msg:", string(msg))
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

}

func main() {
	server := NewServer()
	http.Handle("/ws", websocket.Handler(server.handleWS))
	log.Println("Listening on port 3025")
	http.ListenAndServe(":3025", nil)
}
