import { Scene, MeshLambertMaterial, Mesh, CubeGeometry,
    RepeatWrapping, BackSide, PointLight, Vector3 } from './three.modules';
import ThreeBSP from './threecsg';
import loadTexture from './loadTexture';
import uuid from '../../utils/uuid';
import DoorwayPortal from './DoorwayPortal';

/**
 * Generic Scene base class
 * For holding similar properties and methods
 * across scenes (such as room and hallway)
 */
export default class GenericArea {

    constructor() {

        this.id = uuid();
        this.spawnPoints = [];
        this.activeSpawnPoint = null;
        this.exitPoints = [];
        this.scene = new Scene();
        this.textures = {};
        this.active = false;
        this.areaTexture = 'concrete.png';
        this.dimensions = [100, 100, 100];
        this.verts = 0.2;
        this.areaMeshes = [];
        this.doorwayBoundaries = [];
        this.setAreaBounds();

    }

    getID() {

        return this.id;

    }

    getScene() {

        return this.scene;

    }

    setScene(scene) {

        this.scene = scene;

    }

    getDimensions() {

        return this.dimensions;

    }

    setDimensions(x, y, z) {

        this.dimensions = [x, y, z];
        this.setAreaBounds();

    }

    getAreaBounds() {

        return this.areaBounds;

    }

    setAreaBounds() {

        let d = this.getDimensions();
        let xBound = d[0] * 0.5 - 4;
        let zBound = d[2] * 0.5 - 4;
        this.areaBounds = [ -xBound, xBound, -zBound, zBound ];

    }

    getAreaMaterial(done) {

        loadTexture(this.areaTexture, texture => {

            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.repeat.set(12, 3);
            done(new MeshLambertMaterial({ map: texture, side: BackSide }));

        })

    }

    getMesh() {

        let d = this.getDimensions();
        let v = this.verts;
        let mesh = new Mesh(new CubeGeometry(d[0], d[1], d[2], d[0] * v, d[1] * v, d[2] * v));
        mesh.position.y = d[1] / 2 - 20;
        return mesh;

    }

    buildAreaMesh() {

        this.getAreaMaterial(material => {

            let combinedBSP = new ThreeBSP(this.getMesh());
            this.areaMeshes.map(mesh => {

                combinedBSP = combinedBSP.union(new ThreeBSP(mesh));

            });
            let totalMesh = combinedBSP.toMesh(material);
            this.scene.add(totalMesh);

        });

    }

    addDoorwayPortal(x, y, z, r, oppositeWall) {

        let doorway = new DoorwayPortal([x, y, z], r);
        this.areaMeshes.push(doorway.getMesh());
        let sp = doorway.getCenter();
        this.addSpawnPoint(sp.x, r, sp.z);
        let bb1 = doorway.getBoundBox();
        let bb2 = bb1.clone();
        bb1.expandByVector(new Vector3(4, 4, 4));
        bb2.expandByPoint(oppositeWall);
        let c = bb2.getCenter();
        let d = bb2.getSize();
        let minXBound = c.x - (d.x * 0.5) + 4;
        let maxXBound = c.x + (d.x * 0.5) - 4;
        let minZBound = c.z - (d.z * 0.5) + 4;
        let maxZBound = c.z + (d.z * 0.5) - 4;
        // TODO: Create/return/reference exit point "area" from bounding box

        this.doorwayBoundaries.push([
            bb1,
            [minXBound, maxXBound, minZBound, maxZBound],
            [sp.x - 10, sp.x + 10, sp.z - 10, sp.z + 10]
        ]);



    }

    addSpawnPoint(spawnX, lookY, spawnZ) {

        this.spawnPoints.push([spawnX, lookY, spawnZ]);
        return this.spawnPoints.length - 1;

    }

    getActiveSpawnPoint() {

        return this.spawnPoints[this.activeSpawnPoint];

    }

    setActiveSpawnPoint(index) {

        this.activeSpawnPoint = index;

    }

    giveControls(controls) {

        this.scene.add(controls);

    }

    enterRoom(controls) {

        this.giveControls(controls);

    }

    exitRoom() {}

    addExitPoint(xMin, xMax, zMin, zMax, sceneTo, spawnPoint) {

        let xp = [xMin, xMax, zMin, zMax, sceneTo, spawnPoint];
        this.exitPoints.push(xp);

    }

    addLight(position) {

        let light = new PointLight(0xffffff, 6, 110, 1.2);
        light.position.set(position[0], position[1], position[2]);
        this.scene.add(light);

    }

    checkExitPoints(position) {

        let x = position.x;
        let z = position.z;

        for(let i = 0; i < this.exitPoints.length; i++) {

            let xp = this.exitPoints[i];

            if(x > xp[0] && x < xp[1] && z > xp[2] && z < xp[3])
                return [xp[4], xp[5]];

        }

        return null;

    }

    checkBoundaries(position) {

        if(!this.checkDoorwayBoundaries( position ))
            this.checkAreaBoundaries( position );

    }

    checkDoorwayBoundaries(position) {

        for(let i = 0; i < this.doorwayBoundaries.length; i++) {

            if(this.doorwayBoundaries[i][0].containsPoint(position)) {

                let doorway = this.doorwayBoundaries[i][1];
                this.clampPositionToBounds( position, doorway[0], doorway[1], doorway[2], doorway[3] );
                return true;

            }

        }

        return false;

    }

    checkAreaBoundaries(position) {

        let b = this.getAreaBounds();
        this.clampPositionToBounds( position, b[0], b[1], b[2], b[3] );

    }

    clampPositionToBounds(position, minXBound, maxXBound, minZBound, maxZBound) {

        let x = position.x;
        let z = position.z;
        position.x = (x > maxXBound) ? maxXBound : (x < minXBound) ? minXBound : x;
        position.z = (z > maxZBound) ? maxZBound : (z < minZBound) ? minZBound : z;

    }

    // For use by derived classes
    update() {}

}