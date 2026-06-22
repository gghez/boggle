/** Simple 1Hz countdown with tick and end callbacks. */
export class Countdown {
  private _remaining: number;
  private handle: ReturnType<typeof setInterval> | null = null;
  constructor(
    seconds: number,
    private onTick: (remaining: number) => void,
    private onEnd: () => void,
  ) {
    this._remaining = seconds;
  }

  start(): void {
    if (this.handle) return;
    this.handle = setInterval(() => {
      this._remaining -= 1;
      this.onTick(this._remaining);
      if (this._remaining <= 0) {
        this.stop();
        this.onEnd();
      }
    }, 1000);
  }

  stop(): void {
    if (this.handle) {
      clearInterval(this.handle);
      this.handle = null;
    }
  }

  get remaining(): number {
    return this._remaining;
  }
}
