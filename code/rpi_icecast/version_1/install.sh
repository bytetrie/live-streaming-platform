#!/bin/bash

# Prevent running in case of failures
set -euf -o pipefail

# Install OS dependencies for OS (or quit)
if [[ "$OSTYPE" == "linux-gnu" ]]; then

    DIST=$(grep -oP "ID_LIKE=\K\w+" "/etc/os-release")

    if [[ $DIST != "debian" ]]; then

        echo "Distro not supported."
        exit 1

    fi

    # Ensure system and packages are up to date
    sudo apt-get update -yq
    sudo apt-get upgrade -yq

    # Remove unnecessary files
    sudo apt autoremove -yq

    # Install dependencies
    sudo DEBIAN_FRONTEND=noninteractive apt-get install \
        jackd2 libsndfile1-dev libshout3-dev libshout3 \
        portaudio19-dev python-pyaudio python3-pyaudio \
        libjack-jackd2-dev libportmidi-dev liblo-dev \
        python3-pip nginx icecast2 curl -yq

elif [[ "$OSTYPE" == "darwin"* ]]; then

    if command -v brew; then
        # Install Homebrew
        ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    brew install liblo libsndfile portaudio portmidi jack icecast libshout

else

    echo "OS not supported."
    exit 1

fi

# Add extra binaries to path
# shellcheck disable=SC1090
echo "export PATH=\$PATH:\$HOME/.local/bin:" >> ~/.profile
# shellcheck disable=SC1090
source ~/.profile

# setup .noisecrypt
NC="$HOME/.noisecrypt/v2"
if ! test -d "$NC"; then

    mkdir -p "$NC"

fi

# Install venv
pip3 install virtualenv -q

# Create virtual environment
VENV="$NC/venv"
virtualenv -q "$VENV"
if test -d "$VENV"; then

    # shellcheck disable=SC1090
    source "$VENV/bin/activate"

else

    echo "Virtual environment was not created."
    exit 1

fi

# If no pyo, clone, if pyo, remove build
PYO="$NC/pyo"
if ! test -d "$PYO"; then

    PYO_TAR="$NC/pyo.tar.gz"
    curl -L https://api.github.com/repos/belangeo/pyo/tarball > "$PYO_TAR"
    tar -xzvf "$PYO_TAR" -C  --strip-components 1
    rm "$PYO_TAR"

else

    rm -rf "$PYO/build"

fi

# Build pyo
python "$PYO/setup.py" install --use-jack --use-double

# Install python dependencies
pip install requests tinytag flask uwsgi

# exit venv
deactivate
