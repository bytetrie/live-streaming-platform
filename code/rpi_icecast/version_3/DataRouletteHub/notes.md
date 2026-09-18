- complete docs
- write tests
- complete handler plugin system (+ plugin validator)
- create install/setup script (+ ensure valid location for db file)
- create system timer for auto-deactivate
- create request handler to mitigate potential DoS'ing
- complete icecast checker
- test with icecast manager
- test on remote server, mac/pi local, mac/pi public port-forwarded
- setup with nginx on low.show server
- create/setup proper logging system
- create black-listing and permission issuing mechanisms
- ensure unique content (hash)

---

// Run host service // - [ ] make popping list of randomised urls to ensure
consistency // - [ ] log everything // - [ ] custom port, set request URLS and
address (config file etc) // server users sqlite3 // use native server modules
// if required, use unix socket

- we can use redirects
- only valid for URL data types
- create way to register a hub
- every 15 minutes have system timer run a script to kill old hubs
- plugins could be used to
  - decide what to do with request after data retrieved
  - validate input data

---

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
