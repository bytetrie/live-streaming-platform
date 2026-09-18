# \_noisecrypt_v2 (alpha -> still in development, not widely tested)

This repo contains scripts and applications to run for participants of the
`_noisecrypt` system.

## Dependencies

- `git`: downloading and building pyo
- `opus-tools`: encoding and decoding opus file format (used for its low latency
  and low file size, with high quality)
- `jack2` (and deps): connecting software to audio hardware
- `pyo`: play audio through jack ports and apply effects
- `nginx`: provide access to flask web server
- `virtualenv`: provide an environment for python
