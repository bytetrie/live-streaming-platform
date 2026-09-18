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
