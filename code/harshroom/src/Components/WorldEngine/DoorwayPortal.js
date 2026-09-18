import { Mesh, CubeGeometry, Box3 } from './three.modules';


export default class DoorwayPortal {

    constructor(position, rotation) {

        this.position = position;
        this.rotation = rotation;

        this.width = 20;
        this.height = 40;
        this.depth = 70;

        this.verts = 0.2;

        this.center = null;

        this.boundBox = null;

    }

    getMesh() {

        let mesh = new Mesh(

            new CubeGeometry(

                this.width, this.height, this.depth,
                this.width * this.verts, this.height * this.verts, this.depth * this.verts

            )

        );

        mesh.position.x = this.position[0];
        mesh.position.y = this.position[1];
        mesh.position.z = this.position[2];

        mesh.rotation.y = this.rotation;

        this.center = mesh.getWorldPosition();

        this.boundBox = new Box3().setFromObject(mesh);

        return mesh;

    }

    getCenter() {

        return this.center;

    }

    getBoundBox() {

        return this.boundBox;

    }

}