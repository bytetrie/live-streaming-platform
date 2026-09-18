import GenericArea from './GenericArea';
import { Fog, Vector3 } from './three.modules';


/**
 * This is the room scene where the music and images and whatever is going to be
 */
export default class HallwayArea extends GenericArea {

    constructor() {

        super();

        this.scene.fog = new Fog( 0x000000, 0.015, 250 );

        this.setDimensions( 60, 100, 500 );

        this.addDoorwayPortal( 65, 0 ,0, Math.PI * 0.5, new Vector3(-30, 0, 0) );

        this.buildAreaMesh();

        for (let i = -150; i < 200; i += 100) {

            this.addLight( [ 0, 70, i ] );

        }

    }

}