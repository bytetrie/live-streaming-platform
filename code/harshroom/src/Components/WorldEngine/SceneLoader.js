import RoomArea from "./RoomArea";
import HallwayArea from "./HallwayArea";


export default class SceneLoader {

    constructor(avatar) {

        this.getActiveScene = this.getActiveScene.bind(this);
        this.changeScene = this.changeScene.bind(this);

        this.avatar = avatar;
        this.avatar.setSceneLoader(this);

        this.scenes = {};
        this.changeSceneLock = null;
        this.changeSceneTimer = null;

        // Create the hallway scene
        let scene1 = new HallwayArea();
        let s1ID = this.activeScene = scene1.getID();
        this.scenes[s1ID] = scene1;
        this.scenes[this.activeScene].giveControls(this.avatar.getControlObject());

        // Create the alt scene (aka room)
        let scene2 = new RoomArea( "1.m4a", "grey.png" );
        let s2ID = scene2.getID();
        this.scenes[s2ID] = scene2;

        this.scenes[s1ID].addExitPoint(70, 80, -10, 10, s2ID, 0);
        this.scenes[s2ID].addExitPoint(-10, 10, 140, 150, s1ID, 0);

    }

    getActiveSceneObject() {

        return this.scenes[this.activeScene];

    }

    getActiveScene() {

        return this.scenes[this.activeScene].getScene();

    }

    checkActiveSceneBoundaries(position) {

        this.getActiveSceneObject().checkBoundaries(position);

    }

    checkActiveSceneExitPoints(position) {

        return this.getActiveSceneObject().checkExitPoints(position);

    }

    checkActiveSceneCollisions(position) {

        this.checkActiveSceneBoundaries(position);
        let xp = this.checkActiveSceneExitPoints(position);
        if(xp)
            this.changeScene(xp);

    }

    // TODO: + router
    changeScene(xp) {

        if (this.changeSceneLock)
            return;

        let time = performance.now();
        if (this.changeSceneTimer !== 0 && time - this.changeSceneTimer < 2000)
            return;

        this.changeSceneLock = true;

        this.getActiveSceneObject().exitRoom();

        this.activeScene = this.scenes[xp[0]].getID();
        this.getActiveSceneObject().setActiveSpawnPoint(xp[1]);

        let sp = this.getActiveSceneObject().getActiveSpawnPoint();
        this.getActiveSceneObject().enterRoom(this.avatar.getControlObject(), this.avatar.getListener());
        this.avatar.spawn(sp);

        this.changeSceneTimer = time;
        this.changeSceneLock = false;

    }


    update(delta) {

        this.getActiveSceneObject().update(delta);

    }


}