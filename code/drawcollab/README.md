## Setup

- install nginx, redis, go, node
- add `127.0.0.1 drawcollab.local` to `/etc/hosts`
- symlink path to nginx conf file with correct path from nginx's serve dir
- install go deps
- activate nginx and redis servers
- from the `web/server` directory, run: `go run *.go`
- open browser to `drawcollab.local`
- view the visual output with `./build/main` from the `visuals` dir
- export data using `node redisdump.js` from `data` dir

### Compile 
```bash
g++ -std=c++17 \
-lGLEW \
-lSOIL \
-lhiredis \
-framework \
OpenGL \
-DGLEW_STATIC \
-lSDL2 \
./visuals/src/dataManager/dataManager.cpp \
./visuals/src/renderer/shaders/shaders.cpp \
./visuals/src/renderer/renderer.cpp \
./visuals/src/context/context.cpp \
./visuals/src/app/app.cpp \
./visuals/src/main.cpp \
-o \
./visuals/build/main
```

## TODO

- send timestamp of input event -> websocket send event -> server receive event -> db insert event -> db first retreive event
- script to restart everything

- comments
- docs
- test

### Web

- script setup for nginx install and symlinking + paths etc.
- restart nginx on change of config file
- possibly change this system to use [go webrtc](https://github.com/pions/webrtc)
- send data as bin not json
- setup `/etc/hosts` with appropriate URL

### Visuals

- get framerate
- first render not occuring until interaction/focus on window (ie moving the window)?
- use interfaces/classes and better structure
- vectors?
- why is "close" taking so long to occur? Check event loop system... (data manager is blocking it)
- iterate through different users, draw methods/styles, drawing animation/time lapse

### Data

- interface for viewing data
- ML modeling

