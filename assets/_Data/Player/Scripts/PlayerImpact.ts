import { _decorator, Component, Node, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, tween, Vec3 } from 'cc';
import { PlayerMoving } from './PlayerMoving';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('PlayerImpact')
@executeInEditMode
export class PlayerImpact extends Component {
    
    @property(Collider2D)
    collider: Collider2D | null = null;

    @property(PlayerMoving)
    playerMoving: PlayerMoving | null = null;

    @property(Node)
    model: Node | null = null;

    @property
    holeSpinSpeed: number = 180; // Tốc độ quay (độ/giây)

    @property
    holeSlowDownDuration: number = 2; // Thời gian giảm tốc về 0 (giây)

    private isInHole: boolean = false;
    private originalModelRotation: Vec3 = new Vec3();

    start() {
        console.log('🚗 PlayerImpact: Script đã khởi động!');
        
        if (this.collider) {
            console.log('✅ PlayerImpact: Đã tìm thấy Collider2D!');
            // Đăng ký sự kiện va chạm
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
            console.log('✅ PlayerImpact: Đã đăng ký sự kiện va chạm!');
        } else {
            console.warn('❌ PlayerImpact: Không tìm thấy Collider2D trên node này!');
        }
    }

    resetInEditor() {
        this.collider = this.getComponent(Collider2D);
        this.playerMoving = this.getComponent(PlayerMoving);
        this.model = this.node.getChildByName('Model');
    }

    onDestroy() {
        // Hủy đăng ký sự kiện khi component bị hủy
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            this.collider.off(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
    }

    /**
     * Được gọi khi bắt đầu va chạm
     */
    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        const otherNode = otherCollider.node;
        console.log(`Player va chạm với: ${otherNode.name}`);
        
        // Xử lý tùy theo loại vật cản
        switch (otherNode.name) {
            case 'Barrier':
                this.onHitBarrier(otherNode);
                break;
            case 'Hole':
                this.onHitHole(otherNode);
                break;
            case 'Water':
                this.onHitWater(otherNode);
                break;
            default:
                console.log(`Va chạm với object không xác định: ${otherNode.name}`);
                break;
        }
    }

    /**
     * Được gọi khi kết thúc va chạm
     */
    onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        const otherNode = otherCollider.node;
        console.log(`Player kết thúc va chạm với: ${otherNode.name}`);
    }

    /**
     * Xử lý khi va chạm với Barrier (rào chắn)
     */
    private onHitBarrier(barrierNode: Node) {
        console.log('💥 Player đâm vào rào chắn!');
        // TODO: Thêm logic xử lý khi đâm vào rào chắn
        // Ví dụ: giảm máu, dừng xe, hiệu ứng...
    }

    /**
     * Xử lý khi va chạm với Hold (hố)
     */
    private onHitHole(holdNode: Node) {
        if (this.isInHole) return; // Tránh trigger nhiều lần
        
        console.log('🕳️ Player rơi vào hố!');
        this.isInHole = true;

        // Lưu góc quay ban đầu của model
        if (this.model) {
            this.originalModelRotation = this.model.eulerAngles.clone();
        }

        // Tắt điều khiển player
        if (this.playerMoving) {
            this.playerMoving.setControlEnabled(false);
            this.playerMoving.reduceSpeed(0.8);
        }

        // Tính số vòng quay dựa trên thời gian và tốc độ
        const totalRotation = this.holeSpinSpeed * this.holeSlowDownDuration;

        // Quay model và giảm tốc cùng lúc
        if (this.model) {
            tween(this.model)
                .to(this.holeSlowDownDuration, 
                    { eulerAngles: new Vec3(0, 0, this.originalModelRotation.z - totalRotation) },
                    { easing: 'quadOut' }
                )
                .call(() => {
                    this.onHoleEffectComplete();
                })
                .start();
        }

        // Giảm tốc độ về 0
        if (this.playerMoving) {
            tween(this.playerMoving)
                .to(this.holeSlowDownDuration, {}, {
                    onUpdate: (target: PlayerMoving, ratio: number) => {
                        target.reduceSpeed(0.95); // Giảm dần mượt hơn
                    }
                })
                .call(() => {
                    this.playerMoving?.setSpeed(0);
                })
                .start();
        }
    }

    /**
     * Khi hiệu ứng rơi hố kết thúc
     */
    private onHoleEffectComplete() {
        console.log('✅ Hiệu ứng rơi hố kết thúc!');
        
        // Reset góc quay model về ban đầu
        if (this.model) {
            this.model.setRotationFromEuler(this.originalModelRotation);
        }

        // Bật lại điều khiển
        if (this.playerMoving) {
            this.playerMoving.setControlEnabled(true);
        }

        this.isInHole = false;
    }

    /**
     * Xử lý khi va chạm với Water (nước)
     */
    private onHitWater(waterNode: Node) {
        console.log('💧 Player lao vào nước!');
        // Giảm tốc độ xuống 50%
        if (this.playerMoving) {
            this.playerMoving.reduceSpeed(0.5);
        }
    }
}


