how to enforce br, hz and encoding?

---

object xml -> https://www.npmjs.com/package/o2xml

---

max listeners: 50 max total listeners: 250 max active streams on server: 50
stream br: 64kbps max listener duration: 10s

---

- GET / new mount button
- POST (generate new mount point) w/ body hosts: [location]
  - <uuid> mount point value (<port>/<uuid>)
  - redirect UI to /<uuid>
- GET /<uuid> mount info (and delete btn)
- DELETE /<uuid> removes mount
- GET /<uuid>/file.ogg downloads the file (valid for 1 hour after stream ends)

Later:

- PUT /<uuid> & allow: [ip] &/or deny [ip] (from provided host URLs)
  - this can only be done at the server level, so it would be a "total black
    list", it's actually mostly used for black listing but also only allowing
    slaves for relaying

---

- setup and run icecast with base config
  - need specific port for icecast
- add mountpoints via ui
  - random mount path
  - custom config
  - on connect/disconnect event scripts
    - add/rm from list of hosts
  - random strong password
- timeout for mount
  - kill with pidfile number after 4 hours
- allow closing of stream manually, or after 30 minutes of inactivity
- receive allow/disallow ips from registered IP addresses
- return special value for available mount points from querying hosts
- send HUP signal when new mount point generated
  - mount points are generated, and go into a queue
  - HUP is called by timer every 10 seconds if config changes
- provide listening element
  - if possible and made, provide streaming tool
- js 2 xml for config: https://www.npmjs.com/package/object-to-xml
- ensure icecast is installed
- log dir locations + proper logging

---

## Icecast server w/ mount point manager

2. set up the icecast server (similar to above), a web app allows them to
   generate "mount points" with a password and provides the correct
   url/port/path to use. This could also be offered by low.show (for windows of
   time), also provide host paths to send connect calls on mount
   connect/disconnect -> this is just a generic icecast server with the ability
   to add/remove mountpoints dynamically and send connect/disconnect signals to
   a list of endpoints (and provide a validation endpoint if necessary)

in this case, input people need to just provide the icecast mount info (perhaps
they need to "generate" a mount path and password?) and run the audio
recording/jack streaming/darkice part on their machine - the icecast service
will also need to be able to dynamically add/rem mountpoints (with password etc)
to the config file, then a HUP signal needs to be sent to icecast (which makes a
re-read of config without affecting source connections) see:
https://icecast.imux.net/viewtopic.php?t=6901 see:
https://icecast.xiph.narkive.com/TRk19T50/dynamic-mountpoint-stream-creation

Useful config options:

- server-id -> possible naming mount
- max-listeners
- max-listener-duration
- dump-file
- hidden
- stream-url
- authentication
- on-connect
- on-disconnect path
- pidfile
- allow-ip -> need to check if this can be updated and used without updating
  server
- deny-ip
