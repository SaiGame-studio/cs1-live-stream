import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Road')
export class Road extends Component {
    @property({ type: Node, tooltip: "Node target để theo dõi" })
    target: Node = null;

    @property({ tooltip: "Ngưỡng khoảng cách Y để kích hoạt di chuyển" })
    threshold: number = 40;

    @property({ tooltip: "Số đơn vị road sẽ di chuyển lên" })
    moveAmount: number = 68;

    // Debug values - hiển thị trong Inspector
    @property({ tooltip: "Vị trí Y của Target (chỉ đọc)" })
    debugTargetY: number = 0;

    @property({ tooltip: "Vị trí Y của Road (chỉ đọc)" })
    debugRoadY: number = 0;

    @property({ tooltip: "Khoảng cách Y (Target - Road)" })
    debugDifferenceY: number = 0;

    @property({ tooltip: "Số lần road đã di chuyển" })
    debugMoveCount: number = 0;

    start() {
        this.debugMoveCount = 0;
    }

    update(deltaTime: number) {
        if (!this.target) {
            return;
        }

        const differenceY = this.calculateDifferenceY();
        this.updateDebugValues(differenceY);
        this.checkAndMoveRoad(differenceY);
    }

    private calculateDifferenceY(): number {
        const targetY = this.target.position.y;
        const roadY = this.node.position.y;
        return targetY - roadY;
    }

    private updateDebugValues(differenceY: number) {
        this.debugTargetY = this.target.position.y;
        this.debugRoadY = this.node.position.y;
        this.debugDifferenceY = differenceY;
    }

    private checkAndMoveRoad(differenceY: number) {
        if (differenceY > this.threshold) {
            this.moveRoadUp();
            this.updateDebugAfterMove();
        }
    }

    private moveRoadUp() {
        const pos = this.node.position;
        this.node.setPosition(new Vec3(pos.x, pos.y + this.moveAmount, pos.z));
        this.debugMoveCount++;
    }

    private updateDebugAfterMove() {
        this.debugRoadY = this.node.position.y;
        this.debugDifferenceY = this.target.position.y - this.node.position.y;
    }
}


