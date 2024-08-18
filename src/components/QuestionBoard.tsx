import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { Scene, Camera, Group, Mesh, Vector2, Raycaster, Plane, Vector3 } from 'three';

interface QuestionBoardInfo {
    scene: Scene;
    camera: Camera;
}

export class QuestionBoard {
    private board: Group;
    private slideKnob: Mesh;
    private percentageText: Mesh;
    private font: THREE.Font | null = null;
    private isDragging = false;
    private scene: Scene;
    private camera: Camera;

    constructor(info: QuestionBoardInfo) {
        this.scene = info.scene;
        this.camera = info.camera;
        this.board = new Group();
        this.slideKnob = new Mesh();
        this.percentageText = new Mesh();
        
        this.createBoard();
        this.loadFont();
    }

    private createBoard() {
        const boardBackground = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 4),
            new THREE.MeshBasicMaterial({ color: 'white', transparent: true, opacity: 0.8 })
        );
        this.board.add(boardBackground);

        const slideBar = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: 'gray' })
        );
        slideBar.position.set(0, -1, 0.1);
        this.board.add(slideBar);

        this.slideKnob = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ color: 'red' })
        );
        this.slideKnob.position.set(-2, -1, 0.2);
        this.board.add(this.slideKnob);

        this.percentageText = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 0.5),
            new THREE.MeshBasicMaterial({ color: 'black' })
        );
        this.percentageText.position.set(2.2, -1, 0.1);
        this.board.add(this.percentageText);

        this.board.position.set(0, 0, -5);
        this.board.visible = false;
        this.scene.add(this.board);
    }

    private loadFont() {
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.font = font;
            this.updateQuestionText();
            this.updatePercentageText(0);
        });
    }

    private updateQuestionText() {
        if (!this.font) return;

        const questionText = new THREE.Mesh(
            new TextGeometry('Here is my question, select amount of money.', {
                font: this.font,
                size: 0.2,
                height: 0.1,
            }),
            new THREE.MeshBasicMaterial({ color: 'black' })
        );
        questionText.position.set(-2.5, 1, 0.1);
        this.board.add(questionText);
    }

    private updatePercentageText(percentage: number) {
        if (!this.font) return;

        const text = `${percentage}%`;
        const textGeometry = new TextGeometry(text, {
            font: this.font,
            size: 0.2,
            height: 0.1,
        });

        this.percentageText.geometry.dispose();
        this.percentageText.geometry = textGeometry;
    }

    public show() {
        this.board.visible = true;
    }

    public hide() {
        this.board.visible = false;
    }

    public update() {
        if (this.board.visible) {
            this.board.position.copy(this.camera.position);
            this.board.position.y -= 1;
            this.board.position.z -= 5;
            this.board.lookAt(this.camera.position);
        }
    }

    public onMouseDown(event: MouseEvent | Touch) {
        if (!this.board.visible) return;

        const raycaster = new Raycaster();
        const mouse = new Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObject(this.slideKnob);
        if (intersects.length > 0) {
            this.isDragging = true;
        }
    }

    public onMouseUp() {
        this.isDragging = false;
    }

    public onMouseMove(event: MouseEvent | Touch) {
        if (!this.isDragging || !this.board.visible) return;

        const raycaster = new Raycaster();
        const mouse = new Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);

        const plane = new Plane();
        plane.setFromNormalAndCoplanarPoint(
            this.camera.getWorldDirection(new Vector3()),
            this.board.position
        );

        const intersectionPoint = new Vector3();
        raycaster.ray.intersectPlane(plane, intersectionPoint);

        const localPoint = this.board.worldToLocal(intersectionPoint);
        const newX = THREE.MathUtils.clamp(localPoint.x, -2, 2);

        this.slideKnob.position.x = newX;

        const percentage = Math.round(((newX + 2) / 4) * 100);
        this.updatePercentageText(percentage);
    }
}