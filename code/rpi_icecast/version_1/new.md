## General

-   [ ] add version to request api to prevent mixing of systems (header)
-   [ ] allow audio to be requested every 5 seconds

## Output

-   [x] setting up multiple usb devices, jack
-   [x] arg: set multiple hosts (allow editing while active)
-   [x] arg: allow setting of maximum samples to request
-   [x] create "file" server system to get new files
-   [x] use pyo to playback audio files
-   [x] safely handle failed requests
-   [x] log info about playback addresses and sound/etc

## Input

-   [x] setting up multiple usb devics, jack
-   [ ] get input from jack, encode and send to icecast
-   [x] setup/kill icecast correctly
-   [x] freely set port (actually, will set a random free port)
-   [ ] log requests
-   [x] customise servers and ports (allow multiple hosts)
-   [x] send each input channel to a file
-   [x] kill connections after x time

## Host

-   [ ] make popping list of randomised urls to ensure consistency
-   [ ] log everything
-   [ ] custom port, set request URLS and address (config file etc)

## Possibly v3 features

### Output

-   [ ] control playback and effects from web app api
    -   [ ] plugins
    -   move to v3 as this is a complex feature
-   [ ] pass values as args/ config file (or interactive) + quiet mode
    -   move to v3 as it seems unnecessary
-   [ ] arg: send each output channel to a file (optional)
    -   moved to v3 as it seems unnecessary
-   [ ] arg: allow setting of maximum samples to store
    -   moved to v3 as it seems unnecessary
-   [ ] if request fail, report failure
    -   moved to v3 due to complexity

### Input

-   [ ] throttle amount of simultaneous requests and maximum data
    -   moved to v3 as it seems unnecessary
-   [ ] automatically kill hanging connections
    -   [ ] report connections that hang
    -   moved to v3 as it seems unnecessary
-   [ ] report requests from IP addresses without permissions
    -   moved to v3 due to complexity
    
### Host

-   [ ] create permission issuing system
    -   [ ] allow certain time/amount of data
    -   [ ] ensure input allows the request
    -   [ ] maintain list of bad connections (5 reports creates ban)
        -   [ ] block requests from bad outputters (too many hangs)
        -   [ ] output can only request every 5 seconds min
    -   moved to v3 due to complexity
