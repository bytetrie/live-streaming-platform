#!/bin/bash

# Prevent running in case of failures
set -euf -o pipefail

# Check for already existing setup files
if test -f "/etc/nginx/sites-enabled/noisecrypt_server_nginx.conf" \
    || test -f "/etc/systemd/system/noisecrypt_server.service" \
    || test -d "venv"; then
    echo "Please run ./stop.sh before continuing"
    exit 1
fi

# Ensure the port is free

PORT="2845"

while true; do
    if ! netstat -an | grep "$PORT" &> /dev/null; then
        break
    fi

    echo "Port $PORT is currently in use"
    echo "Please free this port in a separate shell then press ENTER."
    echo "Or press q then ENTER to quit."
    read -r CONFIRM

    if test "$CONFIRM" = "q"; then
        exit 0
    fi
done

# Create virtual environment
virtualenv -q venv
if test -d "venv"; then
    # shellcheck disable=SC1091
    source "venv/bin/activate"
else
    echo "Virtual environment was not created."
    exit 1
fi

# Install required web app dependencies
pip install flask uwsgi -q
# Close virtual environment
deactivate

# Get current path for running the app service
CURR_PATH=$(pwd)

# Get IP address on local network
HOSTNAME="$(hostname -I | cut -f1 -d ' ')"

echo "You can allow remote requests to this server."
echo "This requires external configuration (advanced users only)."
echo "Provide any IP addresses or URLs to be forwarded to the server."
echo "Separate each entry with a single space."
echo "Or press ENTER to skip."
read -r ADDITIONAL_HOSTNAMES

# From the example file make a local version of 
# `noisecrypt_server_nginx.conf`
# Change `{{path}}` to the output of `pwd`
# The `@` delimiter is used to avoid issues with pathnames
sed -e "s@{{port}}@$PORT@g" \
    -e "s@{{server_name}}@$HOSTNAME $ADDITIONAL_HOSTNAMES@g" \
    -e "s@{{path}}@$CURR_PATH@g" \
    noisecrypt_server_nginx.conf.example > noisecrypt_server_nginx.conf

# From the example file make a local copy of 
# `noisecrypt_server.service` 
# Change `{{path}}` to the output of `pwd`
# The `@` delimiter is used to avoid issues with pathnames
USER="$(whoami)"
sed -e "s@{{user}}@$USER@g" \
    -e "s@{{path}}@$CURR_PATH@g" \
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

printf "Your web server is available on your local network at:\n%s" "$HOSTNAME"
printf "\nDo not use 127.0.0.1 or 0.0.0.0 or localhost to access your server.\n"

if test "$ADDITIONAL_HOSTNAMES" != ""; then
    echo "You have also provided these additional hostnames:"
    echo "$ADDITIONAL_HOSTNAMES" | tr -s " " "\012"
fi
