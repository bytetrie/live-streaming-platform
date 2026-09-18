start without effects plugin system, just make it work with multichannel and
updated host/input.

---

output experiments

- interface -> websocket -> osc
- osc -> pyo -> audio effect -> output
- load plugins from dirs
- generate interface from plugin data
- create plugin chain from api
- background sample library fetch tool
- send audio into plugin system, receive output

would jack be useful for the connections between the audio file, the applied
effects and the output loop?

get audio -> send to plugin system -> apply effects -> output to "looper" ->
output to channel

looper should play the output of the effects x times (length determined by a
completion of one playback after effects are applied), then tell the audio
"getter" to retrieve the next audio from the sample library

---

how output works

- we will always need to have files to play from
- we always loop over a file for each channel
- at the end of a loop another file is sought
- we ideally don't want a channel to wait for another file
- we want to be able to apply effects from custom plugins
  - custom plugins exposed via api
    - http://ajaxsoundstudio.com/pyodoc/api/classes/opensndctrl.html
  - plugin dir, each plugin has own dir
    - requires a py file that defines the effect
    - the plugin receives an input and sends an output
  - interfaces are designed separately and are called via a decorator
    - each interface makes a function receive and send values via websockets
      - https://websockets.readthedocs.io/en/stable/intro.html
  - plugin chains are controlled via web app / api
  - user controls one plugin per channel at a time
    - web app will allow you to select a channel and plugin to control

- the file selection and playback loop run independent of the effects system
  - the amount of files to choose from and whether or not it will push out old
    ones at maximum is customisable
    - if there are no fresh (unplayed) samples, a random one from the list is
      server
  - max length is capped at 10 seconds, min is 1 second
  - repeats are capped at 9 times, min is 0

---

thoughts

- could the web app be used to set up another external physical interface and
  assign what each physical interface item does (as in, what it changes in the
  effects)
