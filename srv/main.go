package main

import (
	"io"
	"log"
	"net/http"

	"golang.org/x/net/websocket"
)

const MAX_BUF = 1024

type Server struct {
	conns map[*websocket.Conn]bool
}

func NewServer() *Server {
	return &Server{
		conns: make(map[*websocket.Conn]bool),
	}
}

// NOTE: Maps aren't concurrent. Use mutex or something later.
func (s *Server) handleWS(ws *websocket.Conn) {
	log.Println("New incoming connection from client:", ws.RemoteAddr())
	s.conns[ws] = true
	s.readLoop(ws)

}

func (s *Server) readLoop(ws *websocket.Conn) {
	buf := make([]byte, MAX_BUF)
	for {
		n, err := ws.Read(buf)
		if err != nil {
			if err == io.EOF {
				log.Println("Connection closed by client")
				break
			}
			log.Println("Cannot read msg:", err)
			continue
		}

		msg := buf[:n]
		log.Println(string(msg))
		ws.Write([]byte("Message received"))
	}
}

func main() {
	server := NewServer()
	http.Handle("/ws", websocket.Handler(server.handleWS))
	http.ListenAndServe(":3025", nil)
}
