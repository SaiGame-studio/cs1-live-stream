import { _decorator, Component, Node, director, instantiate, Vec3 } from 'cc';
import { RoadBlockCtrl } from './RoadBlockCtrl';
import { PlayerMoving } from '../../_Data/Player/Scripts/PlayerMoving';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('RoadBlockManager')
@executeInEditMode
export class RoadBlockManager extends Component {
    @property([RoadBlockCtrl])
    roadBlocks: RoadBlockCtrl[] = [];

    @property([Node])
    spawnPoints: Node[] = [];

    @property(PlayerMoving)
    playerMoving: PlayerMoving = null;

    @property(Node)
    blockerHolder: Node = null;

    @property
    spawnThreshold: number = 0.7; // 70% tốc độ tối đa

    @property
    spawnInterval: number = 1.5; // Thời gian giữa các lần spawn (giây)

    private isSpawning: boolean = false;
    private spawnTimer: number = 0;
    private spawnedBlocks: Node[] = [];

    start() {

    }

    update(deltaTime: number) {
        this.checkAndSpawn(deltaTime);
    }

    private checkAndSpawn(deltaTime: number) {
        if (!this.playerMoving) return;

        const currentSpeed = this.playerMoving['currentSpeed'];
        const maxSpeed = this.playerMoving.maxSpeed;
        const speedRatio = currentSpeed / maxSpeed;

        if (speedRatio >= this.spawnThreshold) {
            if (!this.isSpawning) {
                this.isSpawning = true;
                this.spawnTimer = 0;
            }

            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnRandomRoadBlock();
            }
        } else {
            this.isSpawning = false;
            this.spawnTimer = 0;
        }
    }

    private spawnRandomRoadBlock() {
        if (this.roadBlocks.length === 0 || this.spawnPoints.length === 0) return;

        // Random chọn RoadBlockCtrl từ array
        const randomBlockIndex = Math.floor(Math.random() * this.roadBlocks.length);
        const roadBlockPrefab = this.roadBlocks[randomBlockIndex];

        // Random chọn vị trí spawn từ array
        const randomPointIndex = Math.floor(Math.random() * this.spawnPoints.length);
        const spawnPoint = this.spawnPoints[randomPointIndex];

        // Clone roadblock và đặt vào vị trí spawn
        const newRoadBlock = instantiate(roadBlockPrefab.node);
        newRoadBlock.setParent(this.blockerHolder || this.node);
        
        // Đặt vị trí spawn (cùng x với spawnPoint, y phía trước player)
        const playerPos = this.playerMoving.node.position;
        const spawnPos = new Vec3(
            spawnPoint.position.x,
            playerPos.y + 20, // Spawn phía trước player
            spawnPoint.position.z
        );
        newRoadBlock.setPosition(spawnPos);
        newRoadBlock.active = true;

        // Thêm vào array spawnedBlocks
        this.spawnedBlocks.push(newRoadBlock);
    }

    resetInEditor() {
        this.loadRoadBlocks();
        this.loadSpawnPoints();
        this.loadPlayerMoving();
        this.loadBlockerHolder();
    }

    private loadRoadBlocks() {
        this.roadBlocks = this.getComponentsInChildren(RoadBlockCtrl);
        // Disable tất cả các block sau khi load
        for (const block of this.roadBlocks) {
            block.node.active = false;
        }
    }

    private loadSpawnPoints() {
        const spawnPointsParent = this.node.getChildByName('SpawnPoints');
        if (spawnPointsParent) {
            this.spawnPoints = [...spawnPointsParent.children];
        }
    }

    private loadPlayerMoving() {
        const scene = director.getScene();
        if (scene) {
            this.playerMoving = this.findComponentInScene(scene, PlayerMoving);
        }
    }

    private loadBlockerHolder() {
        const scene = director.getScene();
        if (scene) {
            this.blockerHolder = scene.getChildByName('BlockerHolder');
        }
    }

    private findComponentInScene<T extends Component>(node: Node, componentClass: new () => T): T | null {
        const component = node.getComponent(componentClass);
        if (component) {
            return component;
        }

        for (const child of node.children) {
            const found = this.findComponentInScene(child, componentClass);
            if (found) {
                return found;
            }
        }

        return null;
    }
}


