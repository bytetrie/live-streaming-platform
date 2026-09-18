#!/bin/bash

#############################################################
#                                                           #
#   Simple noisecrypt system   (host remove)                #
#   date: 2020-01-06                                        #
#                                                           #
#############################################################

# Prevent running in case of failures
set -euf -o pipefail

# Destroy noisecrypt nginx conf and restart nginx
if test -f "/etc/nginx/sites-enabled/noisecrypt_server_nginx.conf"; then
    sudo rm "/etc/nginx/sites-enabled/noisecrypt_server_nginx.conf"
fi

sudo service nginx restart

# Stop and destroy noisecrypt system service
if test -f "/etc/systemd/system/noisecrypt_server.service"; then
    sudo systemctl stop noisecrypt_server
    sudo systemctl disable noisecrypt_server
    sudo rm "/etc/systemd/system/noisecrypt_server.service"
fi

sudo systemctl daemon-reload
sudo systemctl reset-failed

# Remove virtualenv
if test -d "venv"; then
    rm -rf "venv"
fi
