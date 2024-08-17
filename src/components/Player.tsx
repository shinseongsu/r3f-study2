import { AnimationMixer, Object3D, Scene, Mesh } from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

interface PlayerInfo {
    scene: Scene;
    meshes: Object3D[];
    gltfLoader: GLTFLoader;
    modelSrc: string;
}

export class Player {
    moving: boolean;
    modelMesh?: Object3D;
    mixer?: AnimationMixer;
    actions: any[];

    constructor(info: PlayerInfo) {
        this.moving = false;
        this.actions = [];

        info.gltfLoader.load(info.modelSrc, (glb: GLTF) => {
            glb.scene.traverse((child) => {
                if (child instanceof Mesh) {
                    child.castShadow = true;
                }
            });

            this.modelMesh = glb.scene.children[0];
            if (this.modelMesh) {
                this.modelMesh.position.y = 0.3;
                this.modelMesh.name = 'ilbuni';
                info.scene.add(this.modelMesh);
                info.meshes.push(this.modelMesh);

                this.mixer = new AnimationMixer(this.modelMesh);
                this.actions[0] = this.mixer.clipAction(glb.animations[0]);
                this.actions[1] = this.mixer.clipAction(glb.animations[1]);
                this.actions[0].play();
            }
        });
    }
}
