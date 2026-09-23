/**
 * M3 Expressive のモーションで使うスプリング。
 * stiffness / damping は M3 のモーショントークン（spatial）に合わせた値を渡す。
 */
export class Spring {
  private velocity = 0;
  private target: number;
  private frame = 0;
  private last = 0;

  constructor(
    private value: number,
    private readonly onUpdate: (value: number) => void,
  ) {
    this.target = value;
  }

  to(target: number, stiffness: number, dampingRatio: number): void {
    this.target = target;
    const damping = 2 * dampingRatio * Math.sqrt(stiffness);
    cancelAnimationFrame(this.frame);
    this.last = performance.now();
    const step = (now: number) => {
      // 大きなフレーム落ちで発散しないよう刻み幅を制限する
      const dt = Math.min((now - this.last) / 1000, 1 / 30);
      this.last = now;
      const force = -stiffness * (this.value - this.target) - damping * this.velocity;
      this.velocity += force * dt;
      this.value += this.velocity * dt;
      if (Math.abs(this.velocity) < 0.001 && Math.abs(this.value - this.target) < 0.001) {
        this.value = this.target;
        this.velocity = 0;
        this.onUpdate(this.value);
        return;
      }
      this.onUpdate(this.value);
      this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }
}
