#!/bin/bash

#############################################################
#                                                           #
#   Simple noisecrypt system   (output)                     #
#   date: 2020-01-06                                        #
#                                                           #
#############################################################

# Prevent running in case of failures
set -euf -o pipefail

# Dep check flag

HAS_DEPS=1
hasDep() {
    if ! type "$1" > /dev/null; then
        echo "$1 not found."
        HAS_DEPS=0
    fi
}

# Check if all deps are on the machine

echo "Checking dependencies..."

# cURL is required for fetching stream URLs and downloading from them
hasDep "curl"
# SoX is used to add processing and playback effects
hasDep "sox"
# opusdec from opus-tools is used to conver the stream to wav
hasDep "opusdec"

if test "$HAS_DEPS" -eq 0; then exit 1; fi

echo "All dependencies are available."

# Get Host 

read -rp "What is your Host's IP address or URL? " HOST

if test "$HOST" = ""; then
    echo "You need a valid host."
    exit 1
fi

RUNNING="true"

exit_script() {
    printf "killing"
    trap - EXIT ERR INT TERM # clear the trap
    RUNNING="false"
    kill "$DL_PID"
    if test -f "$TEMPFILE"; then
        rm "$TEMPFILE"
    fi
}

trap exit_script EXIT ERR INT TERM

# Get a random integer [1, (1 + value in first arg)]
# Usage e.g. randInt 9 (returns 1 - 10)
randInt() {
    LIMIT=$1
    echo $(( $(openssl rand 1 | cksum | cut -f1 -d " ") % LIMIT + 1 ))
}

PORT="5482"
TEMPDIR=$(mktemp -d)
TEMPFILE="$TEMPDIR/test.wav"
HOSTPORT="8080"

# Check if file isn't ready for playback
# true if no file or the file duration is not at our length
checkFileNotReady() {
    if ! test -f "$TEMPFILE"; then
        return 0
    fi
    if test $(( $(wc -c < TEMPFILE) * 8 / 2 / 16 / 44100 )) -lt "$1"; then
        return 0
    else
        return 1
    fi
}

# Start play loop
while test "$RUNNING" = "true"; do
    # remove existing temp file
    if test -f "$TEMPFILE"; then
        rm "$TEMPFILE"
    fi
    # Ensure we have a stream URL
    while true; do
        # Get random URL from server
        URL=$(curl -s "$HOST:$HOSTPORT")
        if test "$URL" = ""; then
            echo "Could not get stream URL"
            echo "Trying again in 5 seconds..."
            sleep 5
        else
            break
        fi
    done
    # Listen for a random few seconds
    LENGTH=$(randInt 9)
    # it will also repeat a random number of times
    REPEAT=$(randInt 9)
    # start fetch stream and decode
    curl -s "$URL:$PORT/noisecrypt.opus" \
        | opusdec --force-wav - "$TEMPFILE" --quiet &
    DL_PID=$!
    # wait a moment for the stream to connect and start downloading
    sleep 1
    COUNT=0
    # if file not ready, wait
    while checkFileNotReady "$LENGTH"; do
        sleep 1
        ++COUNT
        # We don't want to go on forever...
        if test "$COUNT" -gt 19; then break; fi
    done
    # End the download process
    kill "$DL_PID"
    # Play/repeat random times
    sox -V0 -q "$TEMPFILE" -t wav - repeat "$REPEAT" gain 20 \
        | aplay -q -D plughw:1,0
done
