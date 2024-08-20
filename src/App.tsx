import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Player } from './components/Player';
import { House } from './components/House';
import { QuestionBoard } from './components/QuestionBoard';
import gsap from 'gsap';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Texture
        const textureLoader = new THREE.TextureLoader();
        const floorTexture = textureLoader.load('/grid.png');
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(10, 10);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.OrthographicCamera(
            -(window.innerWidth / window.innerHeight),
            window.innerWidth / window.innerHeight,
            1,
            -1,
            -1000,
            1000
        );

        const cameraPosition = new THREE.Vector3(1, 5, 5);
        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        camera.zoom = 0.2;
        camera.updateProjectionMatrix();
        scene.add(camera);

        // Light
        const ambientLight = new THREE.AmbientLight('white', 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight('white', 0.5);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;

        directionalLight.shadow.mapSize.set(2048, 2048);
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.camera.near = -100;
        directionalLight.shadow.camera.far = 100;
        scene.add(directionalLight);

        // Mesh
        const meshes: THREE.Object3D[] = [];
        const floorMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ map: floorTexture })
        );
        floorMesh.name = 'floor';
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        scene.add(floorMesh);
        meshes.push(floorMesh);

        const pointerMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ color: 'crimson', transparent: true, opacity: 0.5 })
        );
        pointerMesh.rotation.x = -Math.PI / 2;
        pointerMesh.position.y = 0.01;
        pointerMesh.receiveShadow = true;
        scene.add(pointerMesh);

        const spotMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            new THREE.MeshStandardMaterial({ color: 'yellow', transparent: true, opacity: 0.5 })
        );
        spotMesh.position.set(5, 0.005, 5);
        spotMesh.rotation.x = -Math.PI / 2;
        spotMesh.receiveShadow = true;
        scene.add(spotMesh);

        // New question area
        const questionSpotMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            new THREE.MeshStandardMaterial({ color: 'blue', transparent: true, opacity: 0.5 })
        );
        questionSpotMesh.position.set(-5, 0.005, 5);
        questionSpotMesh.rotation.x = -Math.PI / 2;
        questionSpotMesh.receiveShadow = true;
        scene.add(questionSpotMesh);

        const gltfLoader = new GLTFLoader();

        const house = new House({
            gltfLoader,
            scene,
            modelSrc: '/model/house.glb',
            x: 5,
            y: -1.3,
            z: 2,
        });

        const player = new Player({
            scene,
            meshes,
            gltfLoader,
            modelSrc: '/model/ilbuni.glb',
        });

        const questionBoard = new QuestionBoard(scene, camera);

        const raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();
        let destinationPoint = new THREE.Vector3();
        let angle = 0;
        let isPressed = false;
        let isQuestionBoardVisible = false;

        // 그리기
        const clock = new THREE.Clock();

        function draw() {
            const delta = clock.getDelta();

            if (player.mixer) player.mixer.update(delta);

            if (player.modelMesh) {
                camera.lookAt(player.modelMesh.position);
            }

            if (player.modelMesh) {
                if (isPressed) {
                    raycasting();
                }

                if (player.moving) {
                    angle = Math.atan2(
                        destinationPoint.z - player.modelMesh.position.z,
                        destinationPoint.x - player.modelMesh.position.x
                    );
                    player.modelMesh.position.x += Math.cos(angle) * 0.05;
                    player.modelMesh.position.z += Math.sin(angle) * 0.05;

                    camera.position.x = cameraPosition.x + player.modelMesh.position.x;
                    camera.position.z = cameraPosition.z + player.modelMesh.position.z;

                    player.actions[0].stop();
                    player.actions[1].play();

                    if (
                        Math.abs(destinationPoint.x - player.modelMesh.position.x) < 0.03 &&
                        Math.abs(destinationPoint.z - player.modelMesh.position.z) < 0.03
                    ) {
                        player.moving = false;
                        console.log('멈춤');
                    }

                    if (
                        Math.abs(spotMesh.position.x - player.modelMesh.position.x) < 1.5 &&
                        Math.abs(spotMesh.position.z - player.modelMesh.position.z) < 1.5
                    ) {
                        if (!house.visible) {
                            console.log('나와');
                            house.visible = true;
                            spotMesh.material.color.set('seagreen');
                            if(house.modelMesh) {
                                gsap.to(house.modelMesh.position, {
                                    duration: 1,
                                    y: 1,
                                    ease: 'Bounce.easeOut',
                                });
                                gsap.to(camera.position, {
                                    duration: 1,
                                    y: 3,
                                });
                            }
                        }
                    } else if (house.visible) {
                        console.log('들어가');
                        house.visible = false;
                        spotMesh.material.color.set('yellow');
                        if(house.modelMesh) {
                            gsap.to(house.modelMesh.position, {
                                duration: 0.5,
                                y: -1.3,
                            });
                            gsap.to(camera.position, {
                                duration: 1,
                                y: 5,
                            });
                        }
                    }

                    // Check if player is in question area
                    if (
                        Math.abs(questionSpotMesh.position.x - player.modelMesh.position.x) < 1.5 &&
                        Math.abs(questionSpotMesh.position.z - player.modelMesh.position.z) < 1.5
                    ) {
                        questionSpotMesh.material.color.set('green');
                        if (!isQuestionBoardVisible) {
                            isQuestionBoardVisible = true;
                            questionBoard.show();
                            gsap.to(camera.position, {
                                duration: 1,
                                y: 7,
                                z: camera.position.z + 2,
                            });
                        }
                    } else {
                        questionSpotMesh.material.color.set('blue');
                        if (isQuestionBoardVisible) {
                            isQuestionBoardVisible = false;
                            questionBoard.hide();
                            gsap.to(camera.position, {
                                duration: 1,
                                y: 5,
                                z: cameraPosition.z + player.modelMesh.position.z,
                            });
                        }
                    }
                } else {
                    player.actions[1].stop();
                    player.actions[0].play();
                }
            }

            questionBoard.update();

            renderer.render(scene, camera);
            renderer.setAnimationLoop(draw);
        }

        function checkIntersects() {
            const intersects = raycaster.intersectObjects(meshes);
            for (const item of intersects) {
                if (item.object.name === 'floor') {
                    destinationPoint.set(item.point.x, 0.3, item.point.z);
                    if (player.modelMesh) {
                        player.modelMesh.lookAt(destinationPoint);
                        player.moving = true;

                        pointerMesh.position.set(destinationPoint.x, pointerMesh.position.y, destinationPoint.z);
                    }
                    break;
                }
            }
        }

        function setSize() {
            camera.left = -(window.innerWidth / window.innerHeight);
            camera.right = window.innerWidth / window.innerHeight;
            camera.top = 1;
            camera.bottom = -1;

            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.render(scene, camera);
        }

        // 이벤트
        window.addEventListener('resize', setSize);

        function calculateMousePosition(e: MouseEvent | Touch) {
            mouse.set((e.clientX / canvasRef.current!.clientWidth) * 2 - 1, -(e.clientY / canvasRef.current!.clientHeight) * 2 + 1);
        }

        function raycasting() {
            raycaster.setFromCamera(mouse, camera);
            checkIntersects();
        }

        canvasRef.current.addEventListener('mousedown', (e) => {
            isPressed = true;
            calculateMousePosition(e);
            questionBoard.onMouseDown(e);
        });
        canvasRef.current.addEventListener('mouseup', () => {
            isPressed = false;
            questionBoard.onMouseUp();
        });
        canvasRef.current.addEventListener('mousemove', (e) => {
            if (isPressed) {
                calculateMousePosition(e);
                questionBoard.onMouseMove(e);
            }
        });

        canvasRef.current.addEventListener('touchstart', (e) => {
            isPressed = true;
            calculateMousePosition(e.touches[0]);
            questionBoard.onMouseDown(e.touches[0]);
        });
        canvasRef.current.addEventListener('touchend', () => {
            isPressed = false;
            questionBoard.onMouseUp();
        });
        canvasRef.current.addEventListener('touchmove', (e) => {
            if (isPressed) {
                calculateMousePosition(e.touches[0]);
                questionBoard.onMouseMove(e.touches[0]);
            }
        });

        draw();

        return () => {
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} id="three-canvas" />;
};

export default App;