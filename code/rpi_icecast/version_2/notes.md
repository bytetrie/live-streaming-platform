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

- is it possible to monitor (maybe in admin priviledges) stream listener info
  such that a web app can be used to tell authenticated services whether or not
  an icecast url is willing to take more listeners?

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

possible complication reductions:

- provide a host creator hub
- provide an icecast server for mounting to

in this case, input people need to just provide the icecast mount info (perhaps
they need to "generate" a mount path and password?) and run the audio
recording/jack streaming/darkice part on their machine - the icecast service
will also need to be able to dynamically add/rem mountpoints (with password etc)
to the config file, then a HUP signal needs to be sent to icecast (which makes a
re-read of config without affecting source connections) see:
https://icecast.imux.net/viewtopic.php?t=6901 see:
https://icecast.xiph.narkive.com/TRk19T50/dynamic-mountpoint-stream-creation

- stream directly from browser to icecast -> no current examples?!

opus recorder: https://github.com/chris-rudmin/opus-recorder opusenc:
https://github.com/Rillke/opusenc.js stream rec:
https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
vorbis: https://github.com/higuma/ogg-vorbis-encoder-js vorbis+:
https://github.com/higuma/web-audio-recorder-js

---

# Noisecrypt "system" revisited

## Icecast audio stream URL roulette

1. set up the host server (run server app on server with dns or on a
   port-forwarded local system). From this server, they create a "hub" which
   gives them an endpoint and url etc for reference elsewhere. Otherwise they
   can create this hub on the low.show server. -> maybe calling hosts "hubs"
   makes more sense, but really all this is is a roulette url generator, you
   give it a url, it validates it, then other users spin the wheel and get a
   url, so this could be generalised for any system/stream type etc

   - initial version to focus on icecast system only
   - instead of simply returning urls, can it operate as a "redirector" instead?

## Icecast server w/ mount point manager

2. set up the icecast server (similar to above), a web app allows them to
   generate "mount points" with a password and provides the correct
   url/port/path to use. This could also be offered by low.show (for windows of
   time), also provide host paths to send connect calls on mount
   connect/disconnect -> this is just a generic icecast server with the ability
   to add/remove mountpoints dynamically and send connect/disconnect signals to
   a list of endpoints (and provide a validation endpoint if necessary)

## Source client (auto darkice, or possibly browser-based)

3. input feed runs, using jack to send input to darkice (or, if possible,
   through some kind of web app provided by the icecast service), provide
   icecast details for process (host/port/path/password) this is all basically
   source-client stuff: https://icecast.org/apps/

   - running via jack/darkice will allow for passthru from capture to playback
   - running from browser would need extra system to get simul playback (can a
     device be made to "look like" an audio device? maybe can run a little
     server to receive audio stream and pipe it to jack? how does audio get into
     the browser? this option might be best if the input is via mobile device
     directly on the icecast server site and output is on a separate system)
   - this system is just a general (audio -> icecast) system with some kind of
     middle part to allow routing the audio

## Routlette sampler library tool + random sample channel looper

4. output system runs, provide a list of hosts and max sample library size,
   select ports to output to. This is the most specific part of the whole
   system, and it works in 2 parts:
   - One is a system to build a sample library from lib size and host list, just
     runs in a loop "sampling" from "roulette" urls. This could be generalised
     as a url "stream" sampling tool -> name the format of the data and it will
     random choose a random amount of bytes (or no limit) to download. It can do
     this on a regular loop, irregular loop (within range), or just once. It can
     do this until library has reached maximum size or run forever.
     - if server can't do redirects, it will need to do requests in two stages,
       first is a get to the server and expect a URL, then second is to call
       that URL.
     - although this is currently designed with connection to mysql, it isn't
       really necessary.
   - Another part is the player. Given an arbitrary number of channels (jack
     ports) and a library (sqldb/dir/api?), for each channel, randomly pick a
     file (or choose from playlist -> webapp data?) from the library and play it
     a random number of times, or once, or a predefined amount, or indefinitely
     (perhaps wait for a signal to change? via webapp?), then on finish, get
     another file.
