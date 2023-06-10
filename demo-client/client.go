/*
	This is a test client for the game server.
	Run the client and press keys on the keyboard to send them
	to the server.

	Press Ctrl-C to exit the running client.
*/

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/eiannone/keyboard"
	"golang.org/x/net/websocket"
)

// Maximum length of channel buffer before the input starts
// to overflow the buffer and updates are lost.
const MAX_BUF = 32

const MAX_BUF_RECV = 200

// Updates from client are sent every x milliseconds
const CLIENT_TICK = 30

var pos = []int64{-350, -350, 115}

func main() {
	ws, err := websocket.Dial("ws://localhost:3025/ws", "", "http://localhost/")
	if err != nil {
		log.Fatal("Cannot connect to ws:", err)
	}

	keyboard.Open()
	defer keyboard.Close()

	// Try to make the channel small and compact
	clientTickChan := make(chan int64, MAX_BUF)

	go sendUpdate(clientTickChan, ws)
	go recvUpdate(ws)
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
		if char == 'w' {
			pos[1] += 3
			pos[2] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
		} else if char == 'a' {
			pos[0] += 3
			pos[2] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
		} else if char == 's' {
			pos[1] -= 3
			pos[2] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
		} else if char == 'd' {
			pos[0] -= 3
			pos[2] = int64(char)
			clientTickChan <- pos[0]
			clientTickChan <- pos[1]
			clientTickChan <- pos[2]
		}

	}

}

/*
This function sends the position information to the server by first buffering it
into a buffer on the client side and then sending the buffer at every client tick.
*/
func sendUpdate(clientTickChan chan int64, ws *websocket.Conn) {
	ticker := time.NewTicker(CLIENT_TICK * time.Millisecond)
	var buffer = []int64{}

	for {
		select {
		case <-ticker.C: //  Every CLIENT_TICK milliseconds, write the buffer to the socket
			b, _ := json.Marshal(buffer)
			ws.Write(b)
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
Each player's xpos, ypos, and lastkey will be sent in the array.
For example, If there are three players, A, B, and C, and their current position is

A: xpos = -200, ypos = -300, lastkey = w
B: xpos = -250, ypos = -640, lastkey = a
C: xpos = -500, ypos = -250, lastkey = w,

The values in buf would be:
buf = [-200, -300, 119, 0, -250, -640, 97, 0, -500, -250, 119, 0]
Here, zero (0) separates the inputs of one player from another.
The lastkey is converted to ascii decimal. This format makes it easier to transport data
when there are ~50 clients connected at the same time (in which case the size of this arr would be around 200).

The updates are received at the rate of the server's tickrate.
*/
func recvUpdate(ws *websocket.Conn) {

	for {
		var buf = make([]byte, MAX_BUF_RECV)
		_, err := ws.Read(buf)
		if err != nil {
			log.Println("Unable to read update:", err)
			continue
		}

		// Parse the buffer as you like and render each player on the map accordingly.
		fmt.Println(string(buf))
		// var intPos []int
		// err = json.Unmarshal(buf, &intPos)
		// if err != nil {
		// 	log.Println("Unable to parse update:", err)
		// 	continue
		// }

		// if len(intPos) != 0 {
		// 	fmt.Println(intPos)
		// }
	}
}
