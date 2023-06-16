package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sync"
	"time"

	"golang.org/x/net/websocket"
)

const RANDN = 10000

type Server struct {
	MAX_BUF   int64
	TICK_RATE int64
	conns     sync.Map // Use concurrent Maps
	wg        sync.WaitGroup
}

func NewServer() *Server {
	return &Server{}
}

// Handle all new client connection requests and store them in a Global thread-safe Map
// since the writes to kv pairs in this map are mutually exclusive but concurrent.
func (s *Server) handleWS(ws *websocket.Conn) {

	log.Println("New incoming connection from client:", ws.LocalAddr())
	// Generate a client ID
	x1 := rand.NewSource(time.Now().UnixNano())
	y1 := rand.New(x1)
	clientid := y1.Intn(RANDN)
	// cidbuf := make([]byte, unsafe.Sizeof(clientid))
	// binary.LittleEndian.PutUint64(cidbuf, uint64(clientid))

	cidbuf, _ := json.Marshal(clientid)

	// Write the ID to the client as first communication.
	ws.Write(cidbuf)
	var ack = make([]byte, 1)

	// Read the ACK response from client.
	n, err := ws.Read(ack)
	if n != 1 {
		log.Println("Cannot confirm client ack: Msg length invalid --", n)
		os.Exit(1)
	}

	if err != nil {
		log.Fatal("Error while receiving ack from client:", err.Error())
		os.Exit(1)
	}

	if ack[0] != 1 {
		log.Fatal("Client denied communication: Ack is", ack[0])
		os.Exit(1)
	}

	// Default position for a new connected client
	var initPos = []int64{int64(clientid), -700, -350, 115}
	s.conns.Store(ws, initPos)
	// Read positions from this client
	s.readLoop(ws)
}

// Put each client inside a read loop
func (s *Server) readLoop(ws *websocket.Conn) {
	buf := make([]byte, s.MAX_BUF)
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
		var intPos []int64
		err = json.Unmarshal(msg, &intPos)
		if err != nil {
			log.Println(msg)
			log.Println("Unable to read pos:", err)
		}
		if len(intPos) == 0 {
			continue
		}

		s.conns.Store(ws, intPos)
		fmt.Println("pos:", intPos)

	}
}

// Gracefully remove client after disconnect
func (s *Server) clientDisconnect(ws *websocket.Conn) {
	s.conns.Delete(ws)
}

// Broadcast the updates to all connected clients according to the server tickrate
func (s *Server) updateLoop() {
	ticker := time.NewTicker(time.Duration(s.TICK_RATE) * time.Millisecond)

	for {
		select {
		case <-ticker.C:
			// Combine locations from all Map keys
			var buf = []int64{}
			s.conns.Range(func(key, value any) bool {
				for _, val := range value.([]int64) {
					buf = append(buf, val)
				}
				buf = append(buf, 0)
				return true
			})
			// Broadcast message to all clients
			s.conns.Range(func(key, value any) bool {
				b, err := json.Marshal(buf)
				if err != nil {
					fmt.Println("Cannot convert []int64 to []byte:", err.Error())
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
	wsServer := websocket.Server{}
	wsServer.Handshake = func(c *websocket.Config, r *http.Request) (err error) {
		c.Origin, err = websocket.Origin(c, r)
		if err == nil && c.Origin == nil {
			fmt.Println("null origin")
		}
		return nil
	}

	wsServer.Handler = server.handleWS
	server.TICK_RATE = 30
	server.MAX_BUF = 1024

	// Update all clients by broadcasting the current state (position of all clients) of the game
	go server.updateLoop()
	// Handle websocket requests on /ws endpoint
	http.Handle("/ws", wsServer)
	log.Println("Listening on port 8443")
	http.ListenAndServe(":8443", nil)

}
