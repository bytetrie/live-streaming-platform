import { AudioLoader, PositionalAudio } from './three.modules';

/**
 * StereoSoundSplitter uses a threejs audio loader
 */
export default class StereoSoundSplitter {

    constructor(file, speakers) {

        this.file = file;
        this.sounds = [];
        this.speakers = speakers;

    }

    playSounds(listener) {

        let sounds = this.sounds;
        let speakers = this.speakers;
        let file = this.file;
        let audioLoader = new AudioLoader();
        audioLoader.load(file, function (buffer) {
            speakers.map(function (s, i) {
                let sound = new PositionalAudio(listener);
                sound.setBuffer(buffer);
                sound.setRefDistance(20);
                sound.setDistanceModel('exponential');
                sound.setRolloffFactor(1.5);
                sound.setLoop(true);
                sound.play();
                let ac = listener.context;
                let splitter = ac.createChannelSplitter(2);
                let merger = ac.createChannelMerger(1);
                splitter.connect(merger, i);
                sound.disconnect();
                sound.source.connect(splitter);
                merger.connect(sound.getOutput());

                s.add(sound);
                sounds.push(sound);
            });
        });

    }

    stopSounds() {

        this.sounds.map(function (s) {
            s.pause();
        });

    }

}