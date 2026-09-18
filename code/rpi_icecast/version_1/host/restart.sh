#!/bin/bash

# Prevent running in case of failures
set -euf -o pipefail

# Reload nginx service
sudo service nginx restart

# Restart noisecrypt service
sudo systemctl restart noisecrypt_server
