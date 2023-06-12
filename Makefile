client:
	go build -o demo-client/client demo-client/client.go

server:
	go build -o srv/server srv/server.go

clean:
	rm -rf srv/server
	rm -rf demo-client/client
	go clean -modcache

all: client server