import subprocess
from time import sleep
from logging import exception, warning, info
import platform
import os
import re


def is_jack_running() -> bool:
    """
    Uses jack process listing to retrieve an error code.
    :return: boolean
    """

    command = 'jack_lsp 1>/dev/null 2>&1'

    status = subprocess.getstatusoutput(command)

    return status[0] == 0


def get_channel_count() -> (int, int):
    """
    Uses configuration file to retrieve channel count.
    :return: channels (input, output) count integers
    """

    command = 'jack_lsp'

    status_out = subprocess.getstatusoutput(command)

    if status_out[0] != 0:

        return 0, 0

    inputs = 0
    outputs = 0

    for line in status_out[1]:

        if "system:capture" in line:

            inputs += 1

        elif "system:playback" in line:

            outputs += 1

    return inputs, outputs


def kill():
    """
    Kills the jack server if it is running.
    """

    if not is_jack_running():

        warning("Jack is not running.")
        return

    subprocess.getstatusoutput("killall jackd")


def start():
    """
    Start's the jack server if it isn't running.
    Uses channel count from configuration file.
    """

    if is_jack_running():

        warning("Jack is already running.")
        return

    channels = get_channel_count()

    if channels[0] is 0 and channels[1] is 0:

        exception("No channels.")
        return

    sys = platform.system()

    if sys == 'Linux':

        # check distro
        f = open("/etc/os-release", "r").read()
        distro = re.compile('ID_LIKE=(\w+)').search(f).group(1)

        if distro != 'debian':

            exception("Distro not supported")
            return

        os.environ["JACK_NO_AUDIO_RESERVATION"] = 1
        os.environ["PA_ALSA_PLUGHW"] = 1

        device = '-dalsa -dhw:1'

    elif sys == 'Darwin':

        device = '-dcoreaudio'

    else:

        exception("OS not supported")
        return

    subprocess.getstatusoutput(
        'jackd {} -r48000 -p8192 -n3 1>/dev/null 2>&1 &'.format(device))


def speaker_test():
    """
    Runs a speaker test on each channel if jack server is running.
    """

    if not is_jack_running():

        exception("Jack is not running.")
        return

    channels = get_channel_count()

    if channels[1] is 0:

        exception("No output channels.")
        return

    # start metronome
    subprocess.getstatusoutput("jack_metro - b60 &")

    info("A beeping sound will be emitted by each channel individually.")

    # Test each speaker channel
    for channel in range(channels[1]):

        info("Testing channel {}".format(channel))
        subprocess.getstatusoutput(
            "jack_connect metro:60_bpm system:playback_{}".format(channel))
        sleep(3)
        subprocess.getstatusoutput(
            "jack_disconnect metro:60_bpm system:playback_{}".format(channel))
        info("End testing channel {}".format(channel))
        sleep(1)

    # Kill process
    subprocess.getstatusoutput("pkill -9 jack_metro")


# TODO: capture test
