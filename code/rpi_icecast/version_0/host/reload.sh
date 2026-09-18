#!/bin/bash

#############################################################
#                                                           #
#   Simple noisecrypt system   (host reload)                #
#   date: 2020-01-06                                        #
#                                                           #
#############################################################

# Prevent running in case of failures
set -euf -o pipefail

# Reload nginx service
sudo service nginx restart

# Restart noisecrypt service
sudo systemctl restart noisecrypt_server
