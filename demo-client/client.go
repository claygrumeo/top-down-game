/*
	This is a test client for the game server.
	Run the client and press keys on the keyboard to send them
	to the server.

	Press Ctrl-C to exit the running client.
*/

package main

import (
	"bytes"
	"fmt"
	"log"
	"time"

	"github.com/eiannone/keyboard"
	"golang.org/x/net/websocket"
)

// Maximum length of channel buffer before the input starts
// to overflow the buffer and updates are lost.
const MAX_BUF = 32

// Updates from client are sent every x milliseconds
const CLIENT_TICK = 30

func main() {
	ws, err := websocket.Dial("ws://localhost:3025/ws", "", "http://localhost/")
	if err != nil {
		log.Fatal("Cannot connect to ws:", err)
	}

	keyboard.Open()
	defer keyboard.Close()

	// Make the channel small and compact
	clientTickChan := make(chan uint8, MAX_BUF)

	go sendUpdate(clientTickChan, ws)
	log.Println("Accepting key input... (Ctrl-C to exit)")

	// Listen for key events from the keyboard.
	for {

		char, key, err := keyboard.GetKey()
		if err != nil {
			log.Fatal("Error reading key")
		}

		fmt.Println(char)
		if key == keyboard.KeyCtrlC {
			break
		}
		// Send the characters over a channel
		clientTickChan <- uint8(char)
	}

}

func sendUpdate(clientTickChan chan uint8, ws *websocket.Conn) {
	ticker := time.NewTicker(CLIENT_TICK * time.Millisecond)
	var buffer []byte
	buf := bytes.NewBuffer(buffer)
	for {
		select {
		case <-ticker.C: //  Every CLIENT_TICK milliseconds, write the buffer to the socket
			ws.Write(buf.Bytes())
			buf.Reset() // Reset the buffer after every write
		default:
			select {
			case x := <-clientTickChan: // Read the character channel and store it into a write buffer
				buf.Write([]byte{x})
			default: // If nothing, continue
				continue
			}

		}
	}
}
