export default function initPointerLock(touchMode, resize, controlToggle) {

    const scope = this;

    const havePointerLock = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;

    this.touchMode = touchMode;

    const element = document.body;

    let pointerlockchange = function () {

        if (document.pointerLockElement === element ||
            document.mozPointerLockElement === element ||
            document.webkitPointerLockElement === element) {

            controlToggle(true);

        } else {

            controlToggle(false);

        }

    };

    let pointerlockerror = function () {

        console.log("Couldn't pointer lock for the life of me!");

    };

    let fullscreenchange = function () {

        resize();

        if (document.fullscreenElement === element ||
            document.mozFullscreenElement === element ||
            document.mozFullScreenElement === element) {

            document.removeEventListener('fullscreenchange', fullscreenchange);
            document.removeEventListener('mozfullscreenchange', fullscreenchange);

            if(!scope.touchMode)
                element.requestPointerLock();

        }

    };

    this.toggleFullScreen = function() {

        document.addEventListener('fullscreenchange', fullscreenchange, false);
        document.addEventListener('mozfullscreenchange', fullscreenchange, false);

        element.requestFullscreen = element.requestFullscreen ||
            element.mozRequestFullscreen ||
            element.mozRequestFullScreen ||
            element.webkitRequestFullscreen;

        element.requestFullscreen();

        // If desktop mode, ask the browser to lock the pointer
        if(!scope.touchMode) {

            element.requestPointerLock = element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;
            element.requestPointerLock();

        }

    };

    if (this.touchMode || havePointerLock) {

        // Hook pointer lock state change events
        if(this.touchMode) {

            controlToggle(true);

        } else {

            document.addEventListener('pointerlockchange', pointerlockchange, false);
            document.addEventListener('mozpointerlockchange', pointerlockchange, false);
            document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

            document.addEventListener('pointerlockerror', pointerlockerror, false);
            document.addEventListener('mozpointerlockerror', pointerlockerror, false);
            document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

            document.body.addEventListener('click', this.toggleFullScreen, false);

        }

        this.toggleFullScreen();

    }

    this.dispose = function() {

        if(!scope.touchMode) {

            document.removeEventListener('pointerlockchange', pointerlockchange, false);
            document.removeEventListener('mozpointerlockchange', pointerlockchange, false);
            document.removeEventListener('webkitpointerlockchange', pointerlockchange, false);

            document.removeEventListener('pointerlockerror', pointerlockerror, false);
            document.removeEventListener('mozpointerlockerror', pointerlockerror, false);
            document.removeEventListener('webkitpointerlockerror', pointerlockerror, false);

            document.body.removeEventListener('click', this.toggleFullScreen, false);

        }

        document.removeEventListener('fullscreenchange', fullscreenchange);
        document.removeEventListener('mozfullscreenchange', fullscreenchange);

    }

}