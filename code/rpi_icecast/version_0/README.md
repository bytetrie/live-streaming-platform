# noisecrypt-v0.0.1 (alpha -> still in development, not widely tested)

This repo contains scripts and applications to run for participants of the
`_noisecrypt` system. As this is the first version, there is likely to be some
instability. It's not recommended to use this within any large public
infrastructure or anything that needs strict security. No liability will be
taken for anything bad that might happen if you use it, so please try to read
and understand the code before you do.

First time users should try getting the individual components working on a local
network before attempting to run them remotely.

### Prerequisites

- Some kind of linux system (this project is optimised for a raspberry pi)
- Network access
- Audio interface and equipment
- Read this README and have at least one of each Host, Input and Output
  participants
- This repo on your system
- Set up the the network in the order: Host, Input, Output

## Host

The Host participants provide a server to other participants to discover each
other on the network. The IP/URL of the Host is then used when setting up the
system of input and output participants, so it is required to be running first.

### Requirements

- Ensure your device is able to be accessed through your network
- Run `./install.sh` and enter `y` when prompted to install for "Host"

### Set up

- `cd host`
- `./setup.sh`

### Notes

- If you make a changes to the files or need to reload, try running
  `./reload.sh`
- If you need to remove the files, services and start over, try running
  `./remove.sh`

## Input

The Input participants provide a stream of audio generally from a microphone.
The microphone is expected to be listening to ambient sounds generated from a
combination of the participant's own sound-creations, the participant's
environment and concurrent "Output" from the system.

### Requirements

- An existing Host participant, and their IP or URL
- Ensure the audio input device is connected to your raspberry pi
- Run `./install.sh` and enter `y` when prompted to install for "Input"

### Set up

- `cd input`
- `./start.sh`

### Notes

- To quit the running process, press `Ctrl-C`.

## Output

The Output participants stream the audio from Input participants.

### Requirements

- An existing Host participant, and their IP or URL
- An existing Input participant
- Ensure the audio output device is connected to your raspberry pi
- Run `./install.sh` and enter `y` when prompted to install for "Output"

### Set up

- `cd output`
- `./start.sh`

### Notes

- To quit the running process, press `Ctrl-C`.

## Troubleshooting

- If you are finding that the audio is too quiet, raspberry pi can increase this
  somewhat:
  - Run: `alsamixer`
    - Set values to max
      - Change devices with F6
      - Switch between modes with left and right arrows
      - Esc to exit
