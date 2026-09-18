import { PerspectiveCamera, AudioListener, Vector3 } from "./three.modules";
import PointerLockControls from "./PointerLockControls";
import TouchScreenControls from "./TouchScreenControls";

export default class Avatar {

    constructor(touchMode, rat) {

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.translateByMovement = this.translateByMovement.bind(this);

        // Is in touch mode
        this.touchMode = touchMode;

        // Create perspective camera for magical 3D view
        // this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
        this.camera = new PerspectiveCamera(45, rat, 1, 500);

        // Set the controls to the pointer lock controls and the camera position/angle
        this.controls = (this.touchMode) ?
            new TouchScreenControls(this.camera) :
            new PointerLockControls(this.camera);

        // Create positional lister attached to camera (FP-player) for magical 3D audio
        this.listener = new AudioListener();
        this.camera.add(this.listener);

        this.sceneLoader = null;

        this.move = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        this.velocity = new Vector3();

        this.addEvents();

    }

    removeEvents() {

        document.removeEventListener( "keydown", this.onKeyDown, false );
        document.removeEventListener( "keyup", this.onKeyUp, false );
        this.getControls().dispose();

    }

    addEvents() {

        document.addEventListener( "keydown", this.onKeyDown, false );
        document.addEventListener( "keyup", this.onKeyUp, false );

    }

    onKeyDown(event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                this.toggleMoveForward(true);
                break;

            case 37: // left
            case 65: // a
                this.toggleMoveLeft(true);
                break;

            case 40: // down
            case 83: // s
                this.toggleMoveBackward(true);
                break;

            case 39: // right
            case 68: // d
                this.toggleMoveRight(true);
                break;

        }

    }

    onKeyUp(event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                this.toggleMoveForward(false);
                break;

            case 37: // left
            case 65: // a
                this.toggleMoveLeft(false);
                break;

            case 40: // down
            case 83: // s
                this.toggleMoveBackward(false);
                break;

            case 39: // right
            case 68: // d
                this.toggleMoveRight(false);
                break;

        }

    }

    setSceneLoader(sceneLoader) {

        this.sceneLoader = sceneLoader;

    }

    getCamera() {

        return this.camera;

    }

    getControls() {

        return this.controls;

    }

    /**
     * returns the control object
     */
    getControlObject() {

        return this.controls.getObject();

    }

    /**
     * Get listener
     * @returns {AudioListener}
     */
    getListener() {

        return this.listener;

    }

    /**
     * Update the camera aspect ratio (for resizing)
     */
    setAspect() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

    }

    getPosition() {

        return this.getControlObject().position;

    }

    /**
     * Sets the position of the camera to a certain x, z point looking in y direction
     *
     * @param x: x coordinate
     * @param y: y rotation
     * @param z: z coordinate
     */
    setPosition(x, y, z) {

        let obj = this.getControlObject();
        obj.position.x = x;
        obj.position.z = z;
        obj.rotation.y = y;

    }

    setMovement(direction, moving) {

        this.move[direction] = moving;

    }

    isTouchMode() {

        return this.touchMode;

    }

    toggleMoveForward(move) {

        this.move.forward = move;

    }

    toggleMoveBackward(move) {

        this.move.backward = move;

    }

    toggleMoveLeft(move) {

        this.move.left = move;

    }

    toggleMoveRight(move) {

        this.move.right = move;

    }

    isMovingForward() {

        return this.move.forward;

    }

    isMovingBackward() {

        return this.move.backward;

    }

    isMovingLeft() {

        return this.move.left;

    }

    isMovingRight() {

        return this.move.right;

    }

    setMovementByTouch() {

        let move = this.getControls().moveEvents;
        this.toggleMoveForward(move.forward);
        this.toggleMoveLeft(move.left);
        this.toggleMoveRight(move.right);
        this.toggleMoveBackward(move.backward);

    }

    spawn(spawnPoint) {

        this.setPosition(spawnPoint[0], spawnPoint[1], spawnPoint[2]);

    }

    update(delta) {

        this.translateByMovement(delta);

    }

    checkEvents() {

        this.sceneLoader.checkActiveSceneCollisions(this.getControlObject().position);

    }

    translateByMovement(delta) {

        if(this.touchMode)
            this.setMovementByTouch();

        this.velocity.x -= this.velocity.x * 20.0 * delta;
        this.velocity.z -= this.velocity.z * 20.0 * delta;

        if (this.isMovingForward()) { this.velocity.z -= 400.0 * delta; }
        if (this.isMovingBackward()) { this.velocity.z += 400.0 * delta; }

        if (this.isMovingLeft()) { this.velocity.x -= 400.0 * delta; }
        if (this.isMovingRight()) { this.velocity.x += 400.0 * delta; }

        this.getControlObject().translateX(this.velocity.x * delta);
        this.getControlObject().translateZ(this.velocity.z * delta);

        this.checkEvents();

    }

}