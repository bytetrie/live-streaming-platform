# sludge - live audio streaming server

Create streaming endpoints to receive compressed audio segments from splutter
and serve them for decoding and playback by syllid.

## What does it do?

Runs a deno server (offering systemd service and nginx proxy) that provides an
API for generating "endpoints" for sending audio segments to and retrieving them
again. It just helps distribute "live" audio recordings in very simple way.

## What problem does this solve?

### General

Because this server doesn't currently discriminate the _type_ of file being
uploaded and served (that's up to any client interacting with the API), this
server allows you to store and distribute segments of sequential data. This
specific kind of server isn't too common, so hopefully it can help with building
streaming servers.

### Non-general

This project is meant to be the server-side of the Rivalium platform, where the
client side records segments of audio, encodes them and sends them to this
server for re-distribution. The segments can be retrieved in upload-order (that
is, uploading out of order results in out of order data), for decoding and
playback, so an audio stream can be recorded and listened to live by many
listeners.

## How does it do this?

The deno server receives a request to create a new "stream endpoint", which will
create an admin URL and public URL. The admin URL is meant to be kept private
and is used to send audio segments to. The nginx server then caches serves these
files via the public URL, which is meant to be shared (as it can only be used to
retrieve segment URLs and segment files).

## How to use it?

Get instructions for interating with system

```shell
make help
```

or

```shell
deno run --unstable src/sludge.ts --help
```

Use flags outlined in --help or use makefile commands:

### Make for local dev

#### Set up config/nginx (runs as sudo on linux)

```shell
NGINX_HOST=localhost NGINX_PORT=7777 SLUDGE_PORT=7778 SLUDGE_CACHE=30 SLUDGE_DIR="<some dir>" make config-dev
```

#### Run sludge server

```shell
# NOTE: trailing slash should be included at the end of the URLs
SLUDGE_FILES="http://localhost:7777/audio/" SLUDGE_PUBLIC="http://localhost:7778/" SLUDGE_PORT="7778" SLUDGE_DIR="<some dir>" make run
```

### Make to test config output

```shell
NGINX_HOST=localhost NGINX_PORT=7777 SLUDGE_PORT=7778 SLUDGE_CACHE=30 SLUDGE_DIR="<some dir>" make tester
```

### Testing local endpoints

[cURL](https://curl.se/) can be used to test the request and response structure
of the endpoints:

Create Stream endpoint

```shell
curl -X POST http://localhost:7777/stream
```

Get admin URLs

```shell
curl http://localhost:7777/<stream admin ID>/admin
```

Get segment IDs

```shell
curl http://localhost:7777/<stream public ID>
```

Post segment file

```shell
curl -F 'audio=@<path to project>/test-upload.opus' http://localhost:7777/<stream admin ID>
```

Get list of segment files

```shell
# Segments from start
curl http://localhost:7777/<stream public ID>

# Segments from random
curl http://localhost:7777/<stream public ID>/random

# Segments latest
curl http://localhost:7777/<stream public ID>/latest

# Segments after segment
curl http://localhost:7777/<stream public ID>/<segment ID>
```

Get segment file

```shell
http://localhost:7777/audio/<stream public ID>/<segment ID>.opus
```
