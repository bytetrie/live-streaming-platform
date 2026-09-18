It's not possible to stream from the browser. The tech required is using a
"ReadableStream" via a PUT request, but this is not implemented anywhere.
- http://w3c-test.org/fetch/api/basic/request-upload.any.html
- https://github.com/whatwg/fetch/pull/425

---

Generate js docs, look into code surfer for running through code, explain system
in parts

---

possible other tech: 
- https://github.com/chuabingquan/pxy
- https://github.com/orbitdb/orbit-db
- https://github.com/swimos/swim

---

requirements:

- icecast server running on a server that has ports exposed to public internet
  and a "consistent-enough" IP address while it is running
- a computer receiving audio that can feed it to jack, the same computer
  listening to jack and pushing it to an icecast server mount point
- a way to send connect/disconnect events to a host server
- a host server connected to the public internet with an good hostname/ip
  address, hosts should be able to be isolated from one another
- an output needs to be able to connect to the hosts/inputs and feed the audio
  to jack

---

- save a file with info that will allow for killing/ ending services when the
  programs are killed, to allow not requiring node to keep running
  - save PIDs of darkice?
- use shebang in files that run as binary/ directly called scripts (and chmod)
- replace interfaces to other software with node c/c++ interface
  - https://www.npmjs.com/package/jack-connector
  - https://nodejs.org/docs/latest-v12.x/api/addons.html
- code comments
- tests
- single exe?
  - https://github.com/nexe/nexe
- install script
- possibily add symlink to create shell executable (/usr/local/bin)
  - is this part of
- use system scheduler for sample library

- realising the python script was massive % due to non-sleeping endless loop...
- csound is good, might be worth looking into in future, but it doesn't provide
  much performance beyond pyo and the package itself is massive (>500mb)
-

* need a routing tool so values for hosts/inputs locations play nicely with
  firewalls

- nginx reverse proxy shouldn't be used for icecast streams see:
  https://wiki.xiph.org/index.php?title=Icecast_Server/known_reverse_proxy_restrictions
  - therefore port-forwarding needs to go directly to icecast port
  - therefore if it isn't set up beforehand, when the host verifies, it will
    block
  - need to know ports before mounting, and this should only be necessary if
    this is going to be a "public" set up or "local"
  - if public, show port numbers (or ask for specific ones?) and confirm that
    port-forwarding is active (test?)
- need to check if when status page is requested from some host/port other than
  usual one it aliases it
  - it doesn't, hostname must be exact... use IP for now?
  - need for user to specify:
    - port
    - IP
    - maybe contact email?

* allow ability to mount icecast remotely?

- need to create a script that updates data (on mount connect) such that if a
  host makes a query to a given path it will return some positive indicator that
  the query for the mount is valid (and removes it on the mount disconnect)

  - hide mount data from icecast status page

- might need a disclaimer for unintended streaming of content that may be
  considered illegal in your jurisdiction and advising people only join hubs
  that are managed by and involve people that you know and trust

- is it possible to monitor (maybe in admin priviledges) stream listener info
  such that a web app can be used to tell authenticated services whether or not
  an icecast url is willing to take more listeners?

---

- import jack functions where needed
  - https://chrisyeh96.github.io/2017/08/08/definitive-guide-python-imports.html
- ensure config file for jack allows capture
  - https://www.alsa-project.org/wiki/Asoundrc
- setup input in python
  - parse icecast template in python
  - manage icecast process from python
  - use PUT with request to push data from pyo:
    - https://stackoverflow.com/a/48037101/3531152
  - Handle input via pyo
    - http://ajaxsoundstudio.com/pyodoc/api/classes/generators.html#pyo.Input
- if you can't use temp files or load files in project place a dot dir in home
  dir
- break output py into modules
  - update with jack imports
- prompt user on exit to kill jack
- don't use default port or /noisecrypt.opus endpoint for requests, just use
  whatever user provides
- use nginx for both input and host, move its setup etc to it's own module

- remove stuff related to multiplexing usb devices
- separate concerns related to setting up jack (or some other pyo compatible
  device)
  - create notes/ systems for creating asoundrc for multiplexing
  - create notes for setting up with mac (maybe windows too)
- assume jack is running
  - how to select capture ports etc?
    - naming?
  - provide helper functions for jack
- move "multiple sound cards" to future release
- https://github.com/spatialaudio/jackclient-python
- how-to use alsamixer or apple midi sound to boost/control in/out volume
- pyo mac:
  - brew install liblo libsndfile portaudio portmidi
  - python setup.py install --use-jack --use-double

---

running input/output simultaneously

- should there be a root "app" that can setup all projects?
- how to manage whether and which input goes to channel
  - ask which inputs to use and which should go to the output
  - randomly select output channel for routing
  - blacklist these channels from being used in output

alternatively: /usr/bin/ffmpeg -f jack -i opus -vn -acodec libopus -ar 48000 -ac
2 -ab 64k -content_type audio/ogg -f ogg
icecast://source:password@127.0.0.1:8000/opus

- running ffmpeg on mac involves install jack and opus-tools and ffmpeg, but
  ffmpeg from brew cannot be used because it doesn't build with jack. support
  for jack requires downloading ffmpeg source, building it with certain flags:

```
./configure --enable-libjack --enable-indev=jack --enable-libopus --cc=clang --extra-cflags='-fno-stack-check' --enable-static
```

- doing this involves having xcode tools installed

...libshout... the official tool for sending data to icecast...

---

setting max library size is a reference to the idea of "limited randomness"
(what is proper term?) once a certain number of random elements exist, they are
used as the primary resource pool and no new items are used

---

for broadcasting and input playback, it is better to do jack connections
directly and use darkice jackd -P95 -t2000 -dalsa -dhw:1 -r44100 -p8192 -n3 -M

use 44.1k rate

pyo should not duplex, it just needs to playback audio files, it should just do
requests, manage library, and create playback

- finish doing the basic library, playback thing in python, perhaps simplify
  - perhaps a more performant language would be better for future development
    - the main issue is working with jack, icecast, http, multithreading, async
    - languages:
      - swift (know well, usable on rpi and mac)
      - go (concurrency, easy to write)
      - haskell (functional, fast)
      - c++ (know ok, same language as other tools)
    - maybe faust is a possibility
  - there are 2 parts -> the library builder and playback mechanism
    - the playback needs to be able to play the different files simultaneously
    - the lib builder needs to be able to continually make requests in the
      background
    - these probably don't need to be the same tool/ same language/ same process
    - perhaps something here can be used for playback:
      https://jackaudio.org/applications/
    - python can still be used for fetching the audio samples?
  - maybe just using curl for now is still better? What about libcurl in c?
  - perhaps just scrap python for now, use nodejs, measure cpu load and finish
    the project...

- maybe use onconnect/ondisconnect or whatever for calling the api when
  mount/unmount

- ensure notes for why scrapping tools, languages, plans etc took place
  - note tools tested

---

- get audio device via jack (alsa - linux, aggregate - mac)
- send audio from capture to output with jack_connect
- stream audio from endpoint using icecast
- send audio from jack to icecast using darkice (in ogg)

- how to create sample lib?
  - wait interval
  - fetch seconds of ogg, convert to flac
  - provide database of file locations on (tcp?) request

  - curl -> sox works for downloading/converting
  - how to manage hosts and database?
  - sqlite for db?
    - can we run this as well on rpi0w?
  - bash for doing loop?

- how to do playback of samples?
  - request file from sample lib
  - get random loop interval count
  - play flac file as 1 channel into 1 channel jack (using buffer table)

  - python works ok when using buffer table and pyo with 6 samples of 10 seconds
    - we could possibly go lower if we can do the same thing with better
      software
    - by not using pyo/python we still need a way to do dsp in future
      - this most likely won't be possible, even with better software on rpi0w
    - we are at the absolute limit in terms of CPU, but not with mem

- how to do host?

  - need a very lightweight, fast, webserver
    - https://github.com/cesanta/mongoose
    - http://nxweb.org/
    - https://lwan.ws/
  - although all should work on 1 machine, this will likely be on another
    machine

problems so far:

- why features moved to v3?
- no opus support in many projects (darkice, sox, pyo)
- jack interfacing not correct for some projects (pyo xruns, only creates
  present number of channels mocp)
- using too much processing (mocp, pyo/python)
- libraries are way out of date (nodejs)
- zero w only has 1 core and 1ghz and 512mb ram, 4b has 4 cores and 1-4gb ram
  - future projects requiring interactivity, signal processing, realtime
    streaming, will likely not be capable of working on rpi0
  - possibly get more power with:
    https://www.raspberrypi.org/forums/viewtopic.php?t=177743 but it will void
    warranty and may cause many issues
- random port vs custom port (less user configuration)
- security stuff seems like needless effort right now, still trust based
  - perhaps figure out how to just "kill" a connection after some time (icecast
    max connection time?)
  - more priority for ssl based privacy

TODO:

- create script that launches the "input" system and calls host apis
- create script that builds the sample library and updates an sqlite db, while
  providing an api
- create a basic host to do the api stuff
- playback can be with:
  - git clone https://github.com/vifino/jack-stdout.git
  - just make and it works on rpi and mac
  - currently, pyo just works enough, but yet to test csound

Pricing:

- rpi0w = 11
- sdcard 16gb = 5
- audio device = 26
- speakers = ~2 * 4 Total (not incl. power or usb adapter): 50euro

temperature cpu=$(</sys/class/thermal/thermal_zone0/temp)
echo "$((cpu/1000)) c"

use top to see cpu performance

---

TODO: collate these notes from notes in Joplin and earlier theory notes
