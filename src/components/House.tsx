import { Object3D, Scene } from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

interface HouseInfo {
    x: number;
    y: number;
    z: number;
    gltfLoader: GLTFLoader;
    modelSrc: string;
    scene: Scene;
}

export class House {
    x: number;
    y: number;
    z: number;
    visible: boolean;
    modelMesh?: Object3D;

    constructor(info: HouseInfo) {
        this.x = info.x;
        this.y = info.y;
        this.z = info.z;

        this.visible = false;

        info.gltfLoader.load(info.modelSrc, (glb: GLTF) => {
            this.modelMesh = glb.scene.children[0];
            if (this.modelMesh) {
                this.modelMesh.castShadow = true;
                this.modelMesh.position.set(this.x, this.y, this.z);
                info.scene.add(this.modelMesh);
            }
        });
    }
}
