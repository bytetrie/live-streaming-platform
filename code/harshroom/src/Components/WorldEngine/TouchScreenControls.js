import { Object3D, Vector3, Euler } from './three.modules';


export default function TouchScreenControls( camera ) {

    const scope = this;

    camera.rotation.set( 0, 0, 0 );

    let pitchObject = new Object3D();
    pitchObject.add( camera );

    let yawObject = new Object3D();
    yawObject.add( pitchObject );

    const PI_2 = Math.PI / 2;

    this.ongoingTouches = [];

    this.moveEvents = {

        forward: false,
        backward: false,
        left: false,
        right: false

    };

    const ongoingTouchIndexById = function (idToFind) {

        for (let i = 0; i < scope.ongoingTouches.length; i++) {

            let id = scope.ongoingTouches[i].identifier;

            if (id == idToFind) {

                return i;

            }

        }

        return -1;    // not found

    };

    const copyTouch = function (touch) {

        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };

    };

    const touchButton = function (target) {

        let button = {
            touch: false,
            key: ""
        };

        switch(target.id) {
            case "forward":
                button.touch = true;
                break;
            case "backward":
                button.touch = true;
                break;
            case "left":
                button.touch = true;
                break;
            case "right":
                button.touch = true;
                break;
            default:
                break;
        }

        if(button.touch)
            button.key = target.id;

        return button;

    };

    const toggleMoveEvent = function (key, setting) {

        scope.moveEvents[key] = setting;

    };

    const onTouchStart = function ( event ) {

        event.preventDefault();

        let touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {

            scope.ongoingTouches.push(copyTouch(touches[i]));

            let button = touchButton(touches[i].target);
            if(button.touch)
                toggleMoveEvent(button.key, true);

        }

    };

    const onTouchMove = function ( event ) {

        if ( scope.enabled === false ) return;

        event.preventDefault();

        let touches = event.changedTouches;
        let movementX = 0;
        let movementY = 0;

        for (let i = 0; i < touches.length; i++) {

            if(touchButton(touches[i].target).touch)
                continue;

            let index = ongoingTouchIndexById(touches[i].identifier);

            if (index >= 0) {

                movementX = touches[i].pageX - scope.ongoingTouches[index].pageX;
                movementY = touches[i].pageY - scope.ongoingTouches[index].pageY;

                scope.ongoingTouches.splice(index, 1, copyTouch(touches[i]));  // swap in the new touch record

            }

        }

        yawObject.rotation.y -= movementX * 0.006;
        pitchObject.rotation.x -= movementY * 0.006;
        pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

    };

    const onTouchEnd = function ( event ) {

        event.preventDefault();

        let touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {

            let button = touchButton(touches[i].target);
            if(button.touch)
                toggleMoveEvent(button.key, false);

            scope.ongoingTouches.splice(i, 1);  // remove it; we're done

        }

    };

    this.dispose = function() {

        document.removeEventListener( "touchstart", onTouchStart, false );
        document.removeEventListener( "touchmove", onTouchMove, false );
        document.removeEventListener( "touchend", onTouchEnd, false );
        document.removeEventListener( "touchcancel", onTouchEnd, false );

    };

    document.addEventListener( "touchstart", onTouchStart, false );
    document.addEventListener( "touchmove", onTouchMove, false );
    document.addEventListener( "touchend", onTouchEnd, false );
    document.addEventListener( "touchcancel", onTouchEnd, false );

    this.enabled = false;

    this.getObject = function () {

        return yawObject;

    };

    this.getDirection = function() {

        // assumes the camera itself is not rotated

        let direction = new Vector3( 0, 0, - 1 );
        let rotation = new Euler( 0, 0, 0, "YXZ" );

        return function( v ) {

            rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

            v.copy( direction ).applyEuler( rotation );

            return v;

        };

    }();

};