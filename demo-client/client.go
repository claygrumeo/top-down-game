/*
	This is a test client for the game server.
	Run the client and press keys on the keyboard to send them
	to the server.

	Press Ctrl-C to exit the running client.
*/

package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
	"unsafe"

	"github.com/eiannone/keyboard"
	"golang.org/x/net/websocket"
)

// Maximum length of channel buffer before the input starts
// to overflow the buffer and updates are lost.

type Client struct {
	MAX_BUF      int64
	MAX_BUF_RECV int64
	CLIENT_TICK  int64
	CLIENT_ID    int64
	conn         *websocket.Conn
}

const ACK = 1
const STEP_SIZE = 3

// Updates from client are sent every x milliseconds

func NewClient() *Client {
	return &Client{}
}

func main() {

	client := NewClient()
	client.MAX_BUF = 32
	client.MAX_BUF_RECV = 200
	client.CLIENT_TICK = 30

	// Connect with the server
	ws, err := websocket.Dial("ws://localhost:3025/ws", "", "http://localhost/")
	if err != nil {
		log.Fatal("Cannot connect to ws:", err.Error())
	}

	client.conn = ws

	// The first message received from the server will be the ID assigned to this client.
	// Read it and write an ack (which is just a 1) to the server
	var cidbuf = make([]byte, unsafe.Sizeof(int64(10000)))
	_, err = ws.Read(cidbuf)

	if err != nil {
		log.Fatal("Error while receiving client ID from server:", err.Error())
		os.Exit(1)
	}

	_, err = ws.Write([]byte{ACK})
	if err != nil {
		log.Fatal("Cannot write ack to server:", err.Error())
	}

	var clientid = binary.LittleEndian.Uint64(cidbuf)
	client.CLIENT_ID = int64(clientid)

	// Set client's init spawn position
	var pos = []int64{int64(clientid), -700, -350, 115}

	keyboard.Open()
	defer keyboard.Close()

	// Try to make the channel small and compact
	clientTickChan := make(chan int64, client.MAX_BUF)

	go client.sendUpdate(clientTickChan)
	go client.recvUpdate()
	log.Println("Accepting key input... (Ctrl-C to exit)")

	// Listen for key events from the keyboard.
	// Convert them to map coordinates
	for {

		char, key, err := keyboard.GetKey()
		if err != nil {
			log.Fatal("Error reading key")
		}

		if key == keyboard.KeyCtrlC {
			break
		}

		// The following is basically:
		// if w, add to ypos
		// if a, add to xpos
		// if s, sub from ypos
		// if d, sub from xpos
		if char == 'w' {
			pos[2] += STEP_SIZE
			pos[3] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
			clientTickChan <- pos[3]
		} else if char == 'a' {
			pos[1] += STEP_SIZE
			pos[3] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
			clientTickChan <- pos[3]
		} else if char == 's' {
			pos[2] -= STEP_SIZE
			pos[3] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
			clientTickChan <- pos[3]
		} else if char == 'd' {
			pos[1] -= STEP_SIZE
			pos[3] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
			clientTickChan <- pos[3]
		}

	}

}

/*
This function sends the position information to the server by first buffering it
into a buffer on the client side and then sending the buffer at every client tick.
*/
func (cl *Client) sendUpdate(clientTickChan chan int64) {
	ticker := time.NewTicker(time.Duration(cl.CLIENT_TICK) * time.Millisecond)
	var buffer = []int64{}

	for {
		select {
		case <-ticker.C: //  Every CLIENT_TICK milliseconds, write the buffer to the socket
			b, _ := json.Marshal(buffer)
			cl.conn.Write(b)
			buffer = []int64{} // Reset the buffer after every write
		default:
			select {
			case x := <-clientTickChan: // Read the character channel and store it into a write buffer
				buffer = append(buffer, x)
			default: // If nothing, continue
				continue
			}

		}
	}
}

/*
The updates are delivered in the form of and array of coordinates of all players on the map.
Each player's clientid, xpos, ypos, and lastkey will be sent in the array.
For example, If there are three players, A, B, and C, and their current position is

A: cid = 5, xpos = -200, ypos = -300, lastkey = w
B: cid = 6, xpos = -250, ypos = -640, lastkey = a
C: cid = 7, xpos = -500, ypos = -250, lastkey = w,

The values in buf would be:
buf = [5, -200, -300, 119, 0, 6, -250, -640, 97, 0, 7, -500, -250, 119, 0]
Here, zero (0) separates the inputs of one player from another.
The lastkey is converted to ascii decimal. This format makes it easier to transport data
when there are ~50 clients connected at the same time.

The updates are received at the rate of the server's tickrate.
*/
func (cl *Client) recvUpdate() {

	for {
		var buf = make([]byte, cl.MAX_BUF_RECV)
		_, err := cl.conn.Read(buf)
		if err != nil {
			log.Println("Unable to read update:", err)
			continue
		}

		// Parse the buffer as you like and render each player on the map accordingly.
		fmt.Println(string(buf))
	}
}
