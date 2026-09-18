import grp
from flask import Flask, Response
import requests
from sys import getsizeof
from random import randint
import subprocess
import atexit
import getpass
import socket
import secrets
from pathlib import Path
from pyo import *
import shout
import time


class StreamHandler(object):

    def __init__(self, path):

        self.path = path  # 'http://127.0.0.1:1234/noisecrypt'

    def __call__(self):

        r = requests.get(self.path, stream=True)

        def generate():

            total_size = 0
            # we offset by 1 because 1 seconds were failing
            # (presumably due to some encoding data)
            seconds = randint(2, 11)
            # at 64kbps it's 8 KB per second
            max_size = 1024 * 8 * seconds
            for chunk in r.iter_content(chunk_size=1024):

                if chunk:

                    chunk_size = getsizeof(chunk)
                    total_size = total_size + chunk_size
                    yield chunk

                if total_size >= max_size:

                    break

        excluded_headers = [
            'content-encoding', 'content-length', 'transfer-encoding', 'connection']

        headers = [
            (name, value) for (name, value) in r.raw.headers.items()
            if name.lower() not in excluded_headers]

        return Response(generate(), r.status_code, headers)


class InputNoisecrypt(object):

    def __init__(self, channels: int):

        self.channels = channels

        # use args to set icecast config
        self.user = getpass.getuser()
        self.group = grp.getgrgid(os.getgid())[0]
        self.hostname = socket.gethostname()
        self.admin_pass = secrets.token_hex(32)
        self.source_pass = secrets.token_hex(32)

        # TODO: change to root dir
        self.home_dir = Path.home()
        self.input_dir = Path.joinpath(self.home_dir, ".noisecrypt", "v2", "input")
        self.log_dir = Path.joinpath(self.input_dir, "logs")

        self.make_dirs()

        self.config_path = Path.joinpath(self.input_dir, "icecast.xml")

        # TODO: get OS

        self.create_icecast_config()

        self.run_icecast()

        # Run flask web server
        self.app = Flask(__name__)
        # for each channel?
        # TODO: select which channel to stream from? arg?
        self.app.add_url_rule('/', "path", StreamHandler('http://127.0.0.1:1234/noisecrypt'))
        self.app.run(threaded=True)

        # TODO: get random free ports

        # get input streams (via jack?) -> select the channels to use?
        # encode stream(s), forward to icecast
        # send files to dotfile location
        # set host(s) and send open request to host
        # log requests
        # TODO: send version header with requests

    def make_dirs(self):

        self.input_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def send_audio_to_icecast(self):

        s = shout.Shout()

        # TODO: get data from class vars
        s.host = '127.0.0.1'
        s.port = 1234
        s.user = 'source'
        s.password = 'password'
        s.mount = "/pyshout"

        s.open()

        # TODO: pyo server should already be running

        filename = 'test.ogg'

        a = Input(0)
        rec = Record(a, filename=filename, fileformat=7, buffering=2, quality=0.1)
        rec.out()

        total = 0
        st = time.time()

        # print("opening file %s" % fa
        f = open(filename, 'rb')
        s.set_metadata({'song': filename})

        time.sleep(5)

        # TODO: run in a separate thread/process

        nbuf = f.read(4096)
        while 1:
            buf = nbuf
            nbuf = f.read(4096)
            total = total + len(buf)
            if len(buf) == 0:
                time.sleep(1)
                continue
            s.send(buf)
            s.sync()
        f.close()

        et = time.time()
        br = total * 0.008 / (et - st)
        print("Sent %d bytes in %d seconds (%f kbps)" % (total, et - st, br))

        s.close()

    def run_icecast(self):


        # TODO: set icecast name based on OS (i.e icecast2 or icecast)
        # kill icecast, streams (and server?) on end (close file writing)
        @atexit.register
        def kill():
            subprocess.getstatusoutput('killall icecast2')

        # Start icecast (set port)
        subprocess.getstatusoutput('icecast2 -b -c {}'.format(str(self.config_path)))

    def create_icecast_config(self):
        """
        Returns icecast config text
        """

        # TODO: set log path based on OS

        config = """
        <icecast>
            <limits>
                <clients>100</clients>
                <sources>1</sources>
                <source-timeout>10</source-timeout>
            </limits>

            <authentication>
                <source-password>{}</source-password>
                <admin-user>admin</admin-user>
                <admin-password>{}</admin-password>
            </authentication>

            <hostname>{}</hostname>
            <listen-socket>
                <port>{}</port>
            </listen-socket>

            <location>Noisecrypt</location>

            <paths>
                <logdir>{}</logdir>
                <webroot>/usr/share/icecast2/web</webroot>
                <adminroot>/usr/share/icecast2/admin</adminroot>
                <alias source="/" destination="/status.xsl" />
            </paths>

            <logging>
                <accesslog>access.log</accesslog>
                <errorlog>error.log</errorlog>
                <loglevel>3</loglevel> <!-- 4 Debug, 3 Info, 2 Warn, 1 Error -->
            </logging>

            <http-headers>
                <header name="Access-Control-Allow-Origin" value="*" />
            </http-headers>

            <security>
                <chroot>0</chroot>
                <changeowner>
                    <user>{}</user>
                    <group>{}</group>
                </changeowner>
            </security>
        </icecast>
        """.format(
            self.source_pass,
            self.admin_pass,
            self.hostname,
            self.ic_port,
            self.user,
            self.group,
            str(self.log_dir))

        with open(str(self.config_path), "w") as f:
            f.write(config)
            f.close()
