import { WebGLRenderer } from "./three.modules";
import initPointerLock from "./initPointerLock";


export default class SceneRenderer {

    constructor(container, avatar, sceneLoader, w, h) {

        this.resize = this.resize.bind(this);

        this.avatar = avatar;
        this.sceneLoader = sceneLoader;
        this.container = container
        let renderer = this.renderer = new WebGLRenderer();
        renderer.setClearColor(0x000000);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        this.container.appendChild(renderer.domElement);

        this.pointerLock = new initPointerLock(this.avatar.isTouchMode(), this.resize, function (toggle) {

            avatar.getControls().enabled = toggle;

        });

        this.addEvents();

    }

    removeEvents() {

        this.pointerLock.dispose();
        window.removeEventListener( "resize", this.resize, false );
        this.renderer.dispose();

    }

    addEvents() {

        window.addEventListener( "resize", this.resize, false );

    }

    resize() {

        this.container = container
        const {width, height} = container.getBoundingClientRect()
        this.avatar.setAspect();
        this.renderer.setSize(width * 0.25, height * 0.25);

    }

    update() {

        this.renderer.render(this.sceneLoader.getActiveScene(), this.avatar.getCamera());

    }

}