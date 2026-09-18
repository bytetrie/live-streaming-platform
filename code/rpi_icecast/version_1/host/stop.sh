#!/bin/bash

# Prevent running in case of failures
set -euf -o pipefail

# Destroy noisecrypt nginx conf and restart nginx
NGINX_FILE="/etc/nginx/sites-enabled/noisecrypt_server_nginx.conf"
if test -f "$NGINX_FILE"; then
    sudo rm "$NGINX_FILE"
fi

sudo service nginx restart

# Stop and destroy noisecrypt system service
SERVICE_FILE="/etc/systemd/system/noisecrypt_server.service"
if test -f "$SERVICE_FILE"; then
    sudo systemctl stop noisecrypt_server
    sudo systemctl disable noisecrypt_server
    sudo rm "$SERVICE_FILE"
fi

sudo systemctl daemon-reload
sudo systemctl reset-failed

# Remove virtualenv
if test -d "venv"; then
    rm -rf "venv"
fi
