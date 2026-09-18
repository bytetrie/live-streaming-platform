import flask
import random
from flask import request

app = flask.Flask(__name__)
#app.config["DEBUG"] = True

# Dictionary of available streaming IPs
ips = {}
# View on the dictionary's values
ip_values = ips.values()
# List for copying the values to
ip_list = []


@app.route('/', methods=['GET', 'POST', 'DELETE'])
def respond():
    global ips
    global ip_list
    global ip_values
    # GET serves a URL from the list
    if request.method == 'GET':
        # Return 204 if there's no URL
        if not ip_list:
            return '', 204
        # We just want a random URL
        return random.choice(ip_list)
    # POST adds the request's IP to the list
    elif request.method == 'POST':
        # URL is referenced by its hash
        h = hash(request.remote_addr)
        # If it's not in the dictionary, add it
        if h not in ips:
            ips[h] = request.remote_addr
            # Add it to the list as well
            ip_list.append(request.remote_addr)
        return 'IP Added'
    # DELETE removes the request's IP from the list
    elif request.method == 'DELETE':
        # URL is referenced by its hash
        h = hash(request.remote_addr)
        # If it's in the dictionary, remove it
        if h in ips:
            del ips[h]
            # Rebuild the list
            ip_list = list(ip_values)
        return 'IP Removed'
    # Anything else, return 404
    else:
        abort(404)


# This line is required for uwsgi
if __name__ == '__main__':
    app.run()
