from pyo import *
from logging import info
from random import randint
from threading import Thread
import atexit
import argparse
from time import sleep, time
import sqlite3


# TODO: finish doc
def play_channel(channel, get_sample):
    """
    Play audio loops on a channel, via the sample library
    """

    playing = True

    def run():
        """
        Run the loop
        """

        osc = Osc(table='')

        while playing:
            # get sample from library
            sample = get_sample()
            if sample['length'] == 0:

                info("Got no sample for channel {}".format(channel))
                continue

            # random timer
            loops = randint(1, 5)
            play_length = sample['length'] * loops

            tab = SndTable(sample['path'])
            freq = tab.getRate()
            osc.setTable(tab)
            osc.setFreq(freq)

            if osc.isOutputting() is False:

                osc.out(channel)

            # log info
            log_info = ('Channel {} is playing sample {} '
                        'from input {} '
                        '(from host server {}) '
                        'repeating {} times, '
                        'length is {}, '
                        'played count is {}.\n'
                        .format(
                            channel, sample['path'], sample['input'],
                            sample['host'], loops, sample['length'],
                            sample['count']))
            info(log_info)
            sleep(play_length)
            # repeat until killed

    def kill():
        """
        Kill the loop
        """

        nonlocal playing
        playing = False

    return run, kill


# TODO: finish doc
def playback(channels, get_sample):
    """
    Setup pyo and threading for channel loop playback
    """

    # channel thread run and kill lists
    run_list = []
    kill_list = []
    thread_list = []

    # begin pyo sample <-> channel loops
    pyo_server = Server(
        nchnls=len(channels), 
        sr=44100, 
        buffersize=8192, 
        duplex=0, 
        audio='jack', 
        ichnls=0).boot()
    pyo_server.start()

    # create a thread for each channel
    for chan in channels:

        run_chan, kill_chan = play_channel(chan, get_sample)
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


# TODO: finish doc
def sample_obj(path=None, host=None, input_url=None, length=None, count=None):

    return {
        'path': path or '',
        'host': host or '',
        'input': input_url or '',
        'length': length or 0,
        'count': count or 0
    }


# TODO: finish doc
def connect_db(db_path):

    db = sqlite3.connect(db_path)
    db_cursor = db.cursor()

    def get_sample():

        db_cursor.execute("SELECT rowid, * FROM samples ORDER BY RANDOM() LIMIT 1")
        row = db_cursor.fetchone()
        if not row:

            return sample_obj()

        rowid, path, host, input_url, length, count = row

        new_count = count + 1
        updated = int(round(time() * 1000))
        db_cursor.execute("UPDATE samples SET count = {}, updated = {}".format(new_count, updated))
        db.commit()

        return sample_obj(path, host, input_url, length, count)

    return get_sample


# TODO: finish doc
def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--port',
        nargs='+',
        action="extend",
        type=int,
        required=True)

    parser.add_argument(
        '--db',
        type=str,
        required=True)

    args = parser.parse_args()

    db, get_sample = connect_db(args.db)

    playback_run, playback_kill = playback(
        channels=args.port, get_sample=get_sample)

    atexit.register(playback_kill)

    playback_run()

    while True:

        sleep(100)


if __name__ == "__main__":

    main()
