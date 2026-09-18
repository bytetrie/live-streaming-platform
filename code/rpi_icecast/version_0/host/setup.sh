#!/bin/bash

#############################################################
#                                                           #
#   Simple noisecrypt system   (host setup)                 #
#   date: 2020-01-06                                        #
#                                                           #
#############################################################

# Prevent running in case of failures
set -euf -o pipefail

# Check for already existing setup files
if test -f "/etc/nginx/sites-enabled/noisecrypt_server_nginx.conf" \
    || test -f "/etc/systemd/system/noisecrypt_server.service" \
    || test -d "venv"; then
    echo "Please run remove.sh before continuing"
    exit 1
fi

# Create virtual environment
virtualenv venv
if test -d venv; then
    # shellcheck disable=SC1091
    source "venv/bin/activate"
else
    echo "Virtual environment was not created."
    exit 1
fi

# Install required web app dependencies
pip install flask uwsgi
# Close virtual environment
deactivate

# Get current path for running the app service
CURR_PATH=$(pwd)

# From the example file make a local version of 
# `noisecrypt_server_nginx.conf`
# Change `{{path}}` to the output of `pwd`
# The `@` delimiter is used to avoid issues with pathnames
sed "s@{{path}}@$CURR_PATH@g" \
    noisecrypt_server_nginx.conf.example > noisecrypt_server_nginx.conf

# From the example file make a local copy of 
# `noisecrypt_server.service` 
# Change `{{path}}` to the output of `pwd`
# The `@` delimiter is used to avoid issues with pathnames
sed -e "s@{{path}}@$CURR_PATH@g" \
    noisecrypt_server.service.example > noisecrypt_server.service

# Symlink the nginx conf file
sudo ln -s "$CURR_PATH/noisecrypt_server_nginx.conf" \
    "/etc/nginx/sites-enabled/"

# Restart nginx to enable conf file
sudo service nginx restart

# Create a system entry for the service
sudo cp "$CURR_PATH/noisecrypt_server.service" \
    "/etc/systemd/system/noisecrypt_server.service"

# Run the service
sudo systemctl start noisecrypt_server
sudo systemctl enable noisecrypt_server
