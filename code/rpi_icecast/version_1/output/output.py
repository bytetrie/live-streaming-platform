from typing import List, Deque, Dict, Union, Callable
from collections import deque
from logging import exception, warning, info
from random import randrange, shuffle, randint
from multiprocessing import Process, SimpleQueue
from time import sleep
from threading import Thread
from requests import exceptions, get
import uuid
from tinytag import TinyTag
from pyo import *
import atexit
import jack.jack as jack
from pathlib import Path


# Types
FreshSample = Dict[("sample_path", str), ("host_url", str),
                   ("input_url", str), ("length", float)]

UnplayedSampleLib = Deque[int]

Sample = Dict[("sample_path", str), ("host_url", str), ("input_url", str),
              ("length", float), ("played", int)]

SampleLib = List[Sample]


def play_channel(channel_num: int, get_sample: Callable[[], Union[Sample, None]]):
    """
    Play audio loops on a channel, via the sample library
    """

    playing = True
    sf = SfPlayer('')

    def run():
        """
        Run the looper
        """

        sf.setSpeed(1)
        sf.setLoop(True)

        while playing:
            # get sample from library
            sample = get_sample()
            if sample is None:

                info("Got no sample for channel {}".format(channel_num))
                continue
            # random timer
            loops = randint(1, 5)
            play_length = sample['length'] * loops
            # play on pyo server channel until loop finished
            sf.setPath(sample['sample_path'])

            if sf.isOutputting() is False:

                sf.out(channel_num)

            if sf.isPlaying() is False:

                sf.play()

            # log info
            log_info = ('Channel {} is now playing sample '
                        'from input {} '
                        'from host server {} '
                        'for at least {} loops, '
                        'length is {}, '
                        'played count is {}.\n'
                        .format(
                            channel_num, sample['sample_path'], sample['input_url'],
                            sample['host_url'], loops, sample['length'],
                            sample['played']))
            info(log_info)
            sleep(play_length)
            # repeat until killed

    def kill():
        """
        Kill the looper
        """

        nonlocal playing
        playing = False

        if sf.isPlaying():

            sf.stop()

    return run, kill


def playback(channels: int, get_sample: Callable[[], Union[Sample, None]]):
    """
    Setup pyo and threading for channel loop playback
    """

    # channel thread run and kill lists
    run_list = []
    kill_list = []
    thread_list = []

    # begin pyo sample <-> channel loops
    pyo_server = Server(
        nchnls=channels, buffersize=1024, duplex=0, audio='jack', ichnls=0).boot()
    pyo_server.start()

    # create a thread for each channel
    for chan in range(channels):

        run_chan,  kill_chan = play_channel(chan, get_sample)
        run_list.append(run_chan)
        kill_list.append(kill_chan)

    def run():
        """
        Run threads for playback loops
        """
        # create thread for channel as daemon
        for run_fn in run_list:

            thread = Thread(target=run_fn)
            thread.daemon = True
            thread_list.append(thread)
            thread.start()

    def kill():
        """
        Kill playback loops, join threads
        """

        for kill_fn in kill_list:

            kill_fn()

        for thread in thread_list:

            thread.join()

    return run, kill


def build_library(q: SimpleQueue, hosts: List[str], samples: int, app_path: Path):
    """
    Add samples to library
    """

    host_list = hosts.copy()
    # create temp dir
    hash_dir = uuid.uuid4()
    lib_dir = Path.joinpath(app_path, "library", str(hash_dir))

    # clear temp dir
    @atexit.register
    def clean_dir():

        lib_dir.rmdir()

    Path(lib_dir).mkdir(parents=True, exist_ok=True)

    sleep_len = 5
    total_req = 0

    # start req loop
    run_loop = True

    while run_loop:
        #   shuffle host list, loop until list empty
        for host_url in shuffle(host_list):

            if total_req >= samples:
                run_loop = False
                break
            if not q.empty():
                sleep(sleep_len)
                continue

            try:
                # request sample endpoint
                input_url = get(host_url, timeout=1).text

            except exceptions.RequestException:
                # if fail, sleep 5, go to next endpoint
                sleep(sleep_len)
                continue

            if input_url is None:

                sleep(sleep_len)
                continue

            audio_data = None

            try:
                # request sample
                # TODO: endpoints won't be handled like this
                audio_data = get("{}/noisecrypt.opus".format(input_url), stream=True)

            except exceptions.ConnectionError or exceptions.HTTPError:
                # an error probably not fault of input
                warning("There was an error while fetching audio data.")
                pass

            except exceptions.RequestException:
                # Input url returned something strange
                warning("The input url provided a bad response.")
                pass

            if audio_data is None:

                sleep(sleep_len)
                continue

            # save to file in temp dir
            file_name = "{}.opus".format(uuid.uuid4().hex)
            file_loc = str(Path.joinpath(lib_dir, file_name))
            with open(file_loc, "wb+") as f:

                f.write(bytes(audio_data.content))
                f.close()

            # get sample length
            tag = TinyTag.get(file_loc)
            #       add sample to list (q.put())
            sample_info: FreshSample = {
                "sample_path": file_loc,
                "host_url": host_url,
                "input_url": input_url,
                "length": tag.duration,
            }

            q.put(sample_info)
            total_req = total_req + 1

            sleep(sleep_len)

    q.put(None)


def set_interval(interval, task, *args):
    """
    Threaded interval for checking multiprocess queues
    """

    alive = True

    def run_interval():
        """
        Run interval loop
        """

        while alive:

            sleep(interval)
            task(*args)

    def kill_interval():
        """
        Kill interval loop
        """

        nonlocal alive
        alive = False

    return run_interval, kill_interval


def sample_library(hosts: List[str], samples: int, app_path: Path):
    """
    Library for downloading, storing and fetching samples
    """

    # samples is information on all downloaded samples
    # this is populated via a queue in a parallel process

    sample_lib: SampleLib = []

    unplayed: UnplayedSampleLib = deque()

    # Create queue and process

    # create an event
    # pass event to process
    # on event call fn, fn get from queue

    q = SimpleQueue()
    p = Process(target=build_library, args=(q, hosts, samples, app_path))
    _kill = None
    p.start()

    # can't "kill" here...
    def handle():
        """
        Check for and fetch samples from queue
        """

        item: Union[FreshSample, None] = q.get()

        if item is None:

            _kill()
            p.close()
            return

        # get insert index of sample in lib
        insert = len(sample_lib)
        # create sample dict
        new_item: Sample = {
            "sample_path": item['sample_path'],
            "host_url": item['host_url'],
            "input_url": item['input_url'],
            "length": item['length'],
            "played": 0,
        }
        # add sample to lib
        sample_lib.append(new_item)
        # add sample index to unplayed queue
        unplayed.append(insert)

    # thread to do queue handling off main thread
    run_interval, kill_interval = set_interval(5, handle)
    _kill = kill_interval
    t = Thread(target=run_interval)
    t.daemon = True
    t.start()

    def get_sample() -> Union[Sample, None]:
        """
        Get an unplayed or random sample
        :return: Sample, or if no sample will return None
        """

        sample: Union[Sample, None] = None

        if len(sample_lib) == 0:

            return sample

        elif len(unplayed) > 0:

            i = unplayed.popleft()
            sample = sample_lib[i]

        else:

            random_index = randrange(len(sample_lib))
            sample = sample_lib[random_index]

        sample['played'] += 1
        return sample

    return get_sample


class OutputNoisecrypt(object):

    # TODO: send version header with requests
    # TODO: move outer functions into class
    # TODO: manage processes within parent fn

    def __init__(self, channels: int, hosts: List[str], samples: int):

        self.channels = channels
        self.hosts = hosts
        self.samples = samples

        @atexit.register
        def kill():

            res = ''
            while res not in {"y", "n"}:

                res = input("Do you want to kill jack? (y/n) ").lower()

            if res is "y":

                jack.kill()

        # TODO: change to root dir
        home_dir = Path.home()
        output_dir = Path.joinpath(home_dir, ".noisecrypt", "v2", "output")
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        _kill = None

        if channels == 0:

            exception("No channels for output, exiting.")
            return

        # create the sample library
        # TODO: functions to use class data?
        get_sample = sample_library(
            hosts=hosts,
            samples=samples,
            app_path=output_dir)

        playback_run, playback_kill = playback(channels=channels, get_sample=get_sample)

        atexit.register(playback_kill)

        playback_run()

        try:

            while True:

                sleep(1)

        except KeyboardInterrupt:

            info("Exiting...")
