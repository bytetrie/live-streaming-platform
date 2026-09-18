#!/bin/bash

#############################################################
#                                                           #
#   Simple noisecrypt system   (install)                    #
#   date: 2020-01-06                                        #
#                                                           #
#############################################################

# Prevent running in case of failures
set -euf -o pipefail

# Generic true/false question mechanism
question() {
    while true; do
        read -rp "$1" ANSWER
        case $ANSWER in
            "y"|"n") break
                ;;
            *) echo "Please answer with y or n"
                ;;
        esac
    done

    if test "$ANSWER" = "y"; then
        return 0
    else
        return 1
    fi
}

UPDATE=$(question "Perform recommended system update (y/n): ")
HOST=$(question "Install Host requirements (y/n): ")
INPUT=$(question "Install Input requirements (y/n): ")
OUTPUT=$(question "Install Output requirements (y/n): ")

if $UPDATE; then
    sudo apt-get update -qq
    sudo apt-get full-upgrade -qq
    sudo apt autoremove -qq
fi

if $HOST || $INPUT || $OUTPUT; then
    sudo apt-get install openssl opus-tools -qq
fi

if $HOST; then
    sudo apt-get install python3-pip nginx -qq
    pip3 install virtualenv
fi

if $INPUT; then
    sudo apt-get install icecast2 oggfwd -qq
fi

if $OUTPUT; then
    sudo apt-get install sox curl -qq
fi
