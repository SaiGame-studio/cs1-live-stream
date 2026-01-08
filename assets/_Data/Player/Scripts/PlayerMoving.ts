import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerMoving')
export class PlayerMoving extends Component {
    @property
    maxSpeed: number = 16; // Tốc độ tối đa

    @property
    acceleration: number = 10; // Gia tốc khi giữ phím

    @property
    deceleration: number = 9; // Độ giảm tốc khi thả phím

    @property
    horizontalSpeed: number = 8; // Tốc độ di chuyển ngang

    @property
    horizontalLimit: number = 3.5; // Giới hạn di chuyển ngang (bắt đầu giảm tốc)

    @property
    horizontalHardLimit: number = 7; // Giới hạn cứng (chỉ được đi ngược lại)

    @property
    slowVerticalSpeed: number = 2; // Tốc độ di chuyển lên tối thiểu khi vượt giới hạn ngang

    @property
    slowDownRate: number = 16; // Tốc độ giảm dần khi vượt giới hạn ngang

    private isMovingUp: boolean = false;
    private currentVerticalSpeed: number = 0; // Tốc độ thực tế di chuyển lên
    private isMovingLeft: boolean = false;
    private isMovingRight: boolean = false;
    private currentSpeed: number = 0; // Tốc độ hiện tại
    private isControlEnabled: boolean = true; // Cho phép điều khiển hay không

    start() {
        // Đăng ký sự kiện bàn phím
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        // Hủy đăng ký sự kiện khi component bị hủy
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: EventKeyboard) {
        if (!this.isControlEnabled) return; // Không cho điều khiển khi bị disable
        
        // Kiểm tra phím W hoặc mũi tên lên
        if (event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) {
            this.isMovingUp = true;
        }
        // Kiểm tra phím A hoặc mũi tên trái
        if (event.keyCode === KeyCode.KEY_A || event.keyCode === KeyCode.ARROW_LEFT) {
            this.isMovingLeft = true;
        }
        // Kiểm tra phím D hoặc mũi tên phải
        if (event.keyCode === KeyCode.KEY_D || event.keyCode === KeyCode.ARROW_RIGHT) {
            this.isMovingRight = true;
        }
    }

    onKeyUp(event: EventKeyboard) {
        // Dừng di chuyển khi thả phím
        if (event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.ARROW_UP) {
            this.isMovingUp = false;
        }
        if (event.keyCode === KeyCode.KEY_A || event.keyCode === KeyCode.ARROW_LEFT) {
            this.isMovingLeft = false;
        }
        if (event.keyCode === KeyCode.KEY_D || event.keyCode === KeyCode.ARROW_RIGHT) {
            this.isMovingRight = false;
        }
    }

    update(deltaTime: number) {
        this.updateCurrentSpeed(deltaTime);
        this.updateVerticalSpeed(deltaTime);
        this.updatePosition(deltaTime);
    }

    private updateCurrentSpeed(deltaTime: number) {
        // Nếu đang bị disable control (ví dụ: rơi hố), không xử lý tăng/giảm tốc tự động
        // Tốc độ sẽ được điều khiển bởi tween từ PlayerImpact
        if (!this.isControlEnabled) return;

        if (this.isMovingUp) {
            this.currentSpeed += this.acceleration * deltaTime;
            if (this.currentSpeed > this.maxSpeed) {
                this.currentSpeed = this.maxSpeed;
            }
        } else {
            this.currentSpeed -= this.deceleration * deltaTime;
            if (this.currentSpeed < 0) {
                this.currentSpeed = 0;
            }
        }
    }

    private getHorizontalMove(): number {
        const pos = this.node.position;
        let horizontalMove = 0;

        if (this.isMovingLeft) {
            horizontalMove = -1;
        } else if (this.isMovingRight) {
            horizontalMove = 1;
        }

        // Kiểm tra giới hạn cứng - chỉ cho phép di chuyển ngược lại
        if (pos.x <= -this.horizontalHardLimit && horizontalMove < 0) {
            horizontalMove = 0;
        } else if (pos.x >= this.horizontalHardLimit && horizontalMove > 0) {
            horizontalMove = 0;
        }

        return horizontalMove;
    }

    private getTargetVerticalSpeed(): number {
        const pos = this.node.position;
        let targetVerticalSpeed = this.currentSpeed;

        if (Math.abs(pos.x) > this.horizontalLimit) {
            targetVerticalSpeed = Math.min(this.currentSpeed, this.slowVerticalSpeed);
        }

        return targetVerticalSpeed;
    }

    private updateVerticalSpeed(deltaTime: number) {
        const targetVerticalSpeed = this.getTargetVerticalSpeed();

        if (this.currentVerticalSpeed < targetVerticalSpeed) {
            this.currentVerticalSpeed += this.slowDownRate * deltaTime;
            if (this.currentVerticalSpeed > targetVerticalSpeed) {
                this.currentVerticalSpeed = targetVerticalSpeed;
            }
        } else if (this.currentVerticalSpeed > targetVerticalSpeed) {
            this.currentVerticalSpeed -= this.slowDownRate * deltaTime;
            if (this.currentVerticalSpeed < targetVerticalSpeed) {
                this.currentVerticalSpeed = targetVerticalSpeed;
            }
        }
    }

    private updatePosition(deltaTime: number) {
        const pos = this.node.position;
        const horizontalMove = this.getHorizontalMove();

        const finalX = pos.x + horizontalMove * this.horizontalSpeed * deltaTime;
        const finalY = pos.y + this.currentVerticalSpeed * deltaTime;

        this.node.setPosition(new Vec3(finalX, finalY, pos.z));
    }

    /**
     * Giảm tốc độ hiện tại theo tỷ lệ
     * @param ratio Tỷ lệ giảm (0.5 = giảm 50%)
     */
    public reduceSpeed(ratio: number) {
        this.currentSpeed *= ratio;
        this.currentVerticalSpeed *= ratio;
        console.log(`🔻 Tốc độ giảm xuống: ${this.currentSpeed.toFixed(2)}`);
    }

    /**
     * Đặt tốc độ về một giá trị cụ thể
     * @param speed Tốc độ mới
     */
    public setSpeed(speed: number) {
        this.currentSpeed = speed;
        this.currentVerticalSpeed = speed;
        console.log(`⏹️ Tốc độ đặt về: ${speed}`);
    }

    /**
     * Bật/tắt điều khiển player
     * @param enabled true = cho phép điều khiển, false = khóa điều khiển
     */
    public setControlEnabled(enabled: boolean) {
        this.isControlEnabled = enabled;
        if (!enabled) {
            // Reset các trạng thái di chuyển khi disable
            this.isMovingUp = false;
            this.isMovingLeft = false;
            this.isMovingRight = false;
        }
        console.log(`🎮 Điều khiển: ${enabled ? 'BẬT' : 'TẮT'}`);
    }
}


