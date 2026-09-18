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
