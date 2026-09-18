#!/usr/bin/awk BEGIN{a=ARGV[1];b="";for(i=1;i<ARGC;i++){b=b"\t"ARGV[i];}sub(/[a-z_.\-]+$/,"~/.noisecrypt/v2/venv/bin/python",a);system(a""b)}

import argparse
import textwrap
from pyo import *
from input.input import InputNoisecrypt
from output.output import OutputNoisecrypt
import jack.jack as jack
from logging import exception
from time import sleep


def get_help_text():
    """
    Defines help text for program
    :return: string
    """

    return textwrap.dedent("""\
    ---

    More information:

    --host          Multiple hosts can be provided, 
                    e.g. 
                        --host 123.456.789.0:8080
                        --host host.server.net

    --samples       Omitting --samples or passing 0 allows the library to have unlimited samples.


    Example commands:

    Having a single host and a maximum of 100 samples:

    python run.py --host 123.456.789.0:1234 --samples 100

    Multiple hosts and unlimited samples:

    python run.py --host host.server.net --host wow.example.com
    """)


def main():

    # TODO: should this file be available from command line as noisecrypt?

    # create arg parser
    parser = argparse.ArgumentParser(
        description='Run _noisecrypt output.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=get_help_text())

    # TODO: what to pass to indicate that this server is a host?

    # arg: hosts

    parser.add_argument(
        '--host',
        nargs='+',
        help='a URL/IP and PORT of a host server',
        action="extend",
        type=str,
        required=True)

    # arg: maximum samples in library
    parser.add_argument(
        '--samples',
        help='max samples to fetch',
        type=int,
        default=0)

    # arg: number of input capture channels
    parser.add_argument(
        '--inputs',
        help='input channel count',
        type=int,
        default=0)

    # arg: number of output playback channels
    parser.add_argument(
        '--outputs',
        help='output channel count',
        type=int,
        default=0)

    parser.add_argument(
        '-v',
        '--version',
        action='version',
        version='_noisecrypt_v2')

    args = parser.parse_args()

    # also get chan count for input (and open "picker" if jack chan count > channels provided)
    # same above with output

    # run app from this script
    # receive hosts list, max sample library size, (and perhaps host/input request location)

    # if input, set duplex to 1
    # ensure jack is running
    # create server and get class instances for sub apps

    # TODO: get OS to pass to child functions

    # arg: number of channels
    # run jack
    jack.start()
    sleep(1)

    if not jack.is_jack_running():

        exception("No channels for output, exiting.")
        return

    channels = jack.get_channel_count()

    # TODO: adjust for input/output settings
    s = Server(duplex=1, nchnls=8, audio='jack', ichnls=2, sr=48000, buffersize=8192)
    s.boot()
    s.start()

    input = InputNoisecrypt(2)
    output = OutputNoisecrypt(8)

    s.shutdown()


if __name__ == "__main__":

    main()
