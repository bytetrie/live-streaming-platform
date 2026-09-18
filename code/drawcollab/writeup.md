- starting with web interface for cross platform compatibility, going to have
  touch interface on device, send drawing area size + touch location and event
  type (start, move, end) with timestamp to server via websockets
- normalise the touch value, and draw all touch points to new texture
- need nginx to both serve the interface(s) and handle the inputs [1]
- upon install of nginx via brew, output says:

```
Docroot is: /usr/local/var/www

The default port has been set in /usr/local/etc/nginx/nginx.conf to 8080 so that
nginx can run without sudo.

nginx will load all files in /usr/local/etc/nginx/servers/.

To have launchd start nginx now and restart at login:
  brew services start nginx
Or, if you don't want/need a background service you can just run:
  nginx
```

- going to localhost:8080 displays the nginx welcome screen, we want to direct
  all traffic on the local network that heads to drawcollab.local to the nginx
  server at 8080 [2]
- going to use "go" for the server side web sockets implementation, which will
  require the gorilla/websockets library via go get [3]
- web sockets using go is a little touchy but some working with the docs made it
  clear [4]
- need to do general checking for URL consistency in ngninx/go
- needed to add a proxy timeout of 1 day in nginx to prevent it from closing the
  web socket connection
- struct properties in go need to be capitalised >:(
- redis will need to be installed via brew and can be started with:
  `brew services start redis` and can be tested (in a new window) with
  `redis-cli` and typing "ping" to get a "PONG" response [5]
- the go->redis connector is provided by a library [6]
- the normal vector is sent to the go server, which then sends it onto a redis
  server
- the redis server values can be viewed with either redis-cli monitor or getting
  the LRANGE for the key from the redis-cli interface
-

References: 
- [1] https://coderwall.com/p/dgwwuq/installing-nginx-in-mac-os-x-maverick-with-homebrew
- [2] https://superuser.com/questions/152146/how-to-alias-a-hostname-on-mac-osx
- [3] https://gowebexamples.com/websockets/
- [4] https://godoc.org/github.com/gorilla/websocket
- [5] https://medium.com/@djamaldg/install-use-redis-on-macos-sierra-432ab426640e
- [6] github.com/go-redis/redis
