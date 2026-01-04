import { _decorator, Component, Node, Vec3, math } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraMoving')
export class CameraMoving extends Component {
    @property(Node)
    target: Node = null;

    @property({ type: Number, min: 0, max: 20, slide: true })
    speed: number = 5;

    private offset: Vec3 = new Vec3();

    start() {
        if (this.target) {
            Vec3.subtract(this.offset, this.node.worldPosition, this.target.worldPosition);
        }
    }

    update(deltaTime: number) {
        if (!this.target) {
            return;
        }

        this.followTarget(deltaTime);
    }

    private calculateDesiredPosition(): Vec3 {
        const targetPos = this.target.worldPosition;
        return new Vec3(
            targetPos.x + this.offset.x,
            targetPos.y + this.offset.y,
            this.node.worldPosition.z
        );
    }

    private calculateSmoothedPosition(desiredPos: Vec3, deltaTime: number): Vec3 {
        const cameraPos = this.node.worldPosition;
        const lerpFactor = this.speed * deltaTime;

        return new Vec3(
            math.lerp(cameraPos.x, desiredPos.x, lerpFactor),
            math.lerp(cameraPos.y, desiredPos.y, lerpFactor),
            cameraPos.z
        );
    }

    private followTarget(deltaTime: number) {
        const desiredPos = this.calculateDesiredPosition();
        const smoothedPos = this.calculateSmoothedPosition(desiredPos, deltaTime);
        this.node.setWorldPosition(smoothedPos);
    }
}


