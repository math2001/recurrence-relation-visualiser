interface Point {
  readonly x: number;
  readonly y: number;
}

interface MPoint {
  x: number;
  y: number;
}

const Zero = { x: 0, y: 0 };

class Plot {
  canvas: HTMLCanvasElement;
  scale: Point;
  origin: MPoint;
  context: CanvasRenderingContext2D;
  func: ((x: number) => number | null) | null;
  pressdown: Point | null;

  constructor(canvas: HTMLCanvasElement, unitaryOrigin: Point, scale: Point) {
    this.func = null;
    this.pressdown = null;

    this.canvas = canvas;
    const context = this.canvas.getContext("2d");
    if (context === null) throw new Error("null context for canvas");
    this.context = context;

    this.scale = scale;
    if (this.scale.x <= 0 || this.scale.y <= 0)
      throw new Error("null or negative scale");

    this.origin = {
      x: (unitaryOrigin.x * canvas.width) / 2 + canvas.width / 2,
      y: (unitaryOrigin.y * canvas.height) / 2 + canvas.height / 2,
    };

    this.canvas.addEventListener("mousedown", (e) => {
      this.pressdown = {
        x: this.origin.x - e.pageX,
        y: this.origin.y - e.pageY,
      };
    });

    document.addEventListener("mousemove", (e) => {
      if (this.pressdown !== null) {
        this.origin = {
          x: e.pageX + this.pressdown.x,
          y: e.pageY + this.pressdown.y,
        };
        this.render();
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (this.pressdown !== null) {
        this.pressdown = null;
      }
    });
  }

  render() {
    if (this.func === null) return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._renderAxis();

    const left = Math.round((0 - this.origin.x) / this.scale.x);
    const right = Math.round(
      (this.canvas.width - this.origin.x) / this.scale.x
    );

    const radius = 4;
    this.context.fillStyle = "#2c3e50";
    for (let x = left; x < right; x++) {
      this.context.beginPath();
      const y = this.func(x);
      if (y === null) continue;
      this.context.ellipse(
        x * this.scale.x + this.origin.x,
        -y * this.scale.y + this.origin.y,
        radius,
        radius,
        0,
        0,
        2 * Math.PI
      );
      this.context.fill();
    }
  }

  _renderAxis() {
    this.context.strokeStyle = "black";
    this.context.beginPath();

    // horizontal axis
    this.context.moveTo(0, this.origin.y);
    this.context.lineTo(this.canvas.width, this.origin.y);

    // vertical axis
    this.context.moveTo(this.origin.x, 0);
    this.context.lineTo(this.origin.x, this.canvas.height);

    this.context.stroke();

    const left = Math.round((0 - this.origin.x) / this.scale.x);
    const right = Math.round(
      (this.canvas.width - this.origin.x) / this.scale.x
    );
    const top = Math.round((0 - this.origin.y) / this.scale.y);
    const bottom = Math.round(
      (this.canvas.height - this.origin.y) / this.scale.y
    );

    this.context.font = "12px Roboto Mono";
    this.context.textAlign = "center";

    for (let x = left; x <= right; x++) {
      this.context.fillText(
        `${x}`,
        this.origin.x + x * this.scale.x,
        this.origin.y + 20
      );
    }

    this.context.textAlign = "right";
    this.context.textBaseline = "middle";
    for (let y = top; y <= bottom; y++) {
      this.context.fillText(
        `${-y}`,
        this.origin.x - 4,
        this.origin.y + y * this.scale.y
      );
    }
  }
}
