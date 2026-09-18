import GenericArea from './GenericArea';
import loadTexture from './loadTexture';
import { PlaneGeometry, MeshLambertMaterial, Mesh, RepeatWrapping, DoubleSide, Vector3 } from './three.modules';
import StereoSoundSplitter from './StereoSoundSplitter';

/**
 * Room scene class
 * This is the room scene where the music and images and whatever is going to be
 */
export default class RoomArea extends GenericArea {

    constructor(musicFile, imageFile) {

        super();
        
        this.musicFile = musicFile;
        this.imageFile = imageFile;
        this.speakers = [];
        this.sounds = [];
        this.soundSplitter = new StereoSoundSplitter(this.musicFile, this.speakers);

        this.setDimensions(120, 100, 200);

        this.addDoorwayPortal(0, 0 , 135, 0, new Vector3(0, 0, -100));

        this.buildAreaMesh();

        this.addRoomItems();

        for(let i = -60; i < 61; i+=120) {

            this.addLight([0, 70, i]);

        }

    }

    addRoomItems() {

        let speakers = this.speakers;
        let imageFile = this.imageFile;
        let scene = this.scene;

        // Speakers
        loadTexture('green-rust.png', texture => {

            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.repeat.set(1, 4);
            let geometry = new PlaneGeometry(5, 20, 5);
            let material = new MeshLambertMaterial({ map: texture, side: DoubleSide });

            // Left speaker
            let mesh = new Mesh(geometry, material);
            mesh.position.x = -30;
            mesh.position.z = -75;
            scene.add(mesh);

            // Right speaker
            let mesh2 = mesh.clone();
            mesh2.position.x = 30;
            scene.add(mesh2);

            // Add speakers to list for attaching sound later
            speakers.push(mesh, mesh2);

        });

        // Picture
        loadTexture(imageFile, texture => {

            let geometry = new PlaneGeometry(12, 12, 1, 1);
            let material = new MeshLambertMaterial({ map: texture });

            let mesh = new Mesh(geometry, material);
            mesh.position.z = -99.5;
            mesh.rotation.x = Math.PI * 2;
            scene.add(mesh);

        });

    }

    update(delta) {

        this.spinSpeakers(delta);

    }

    spinSpeakers(delta) {

        this.speakers.map(function (s, i) {

            let rotate = (i === 0) ? -1 : 1;
            s.rotation.y += rotate * 0.5 * delta;

        });

    }

    enterRoom(controls, listener) {

        this.giveControls(controls);
        this.soundSplitter.playSounds(listener);

    }

    exitRoom() {

        this.soundSplitter.stopSounds();

    }

}