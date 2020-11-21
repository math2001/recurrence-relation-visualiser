interface Point {
  readonly x: number;
  readonly y: number;
}

interface MPoint {
  x: number;
  y: number;
}

enum Axis {
  vertical,
  horizontal,
}

const Zero = { x: 0, y: 0 };

class Plot {
  canvas: HTMLCanvasElement;
  zoom: MPoint;
  scale: MPoint;
  origin: MPoint;
  context: CanvasRenderingContext2D;
  func: ((x: number) => number | null) | null;
  pressdown: Point | null;
  measures: TextMetrics;
  mouse: Point | null;

  hoveredAxis: Axis | null;

  constructor(canvas: HTMLCanvasElement, unitaryOrigin: Point, zoom: MPoint) {
    this.func = null;
    this.pressdown = null;
    this.mouse = null;

    this.canvas = canvas;
    const context = this.canvas.getContext("2d");
    if (context === null) throw new Error("null context for canvas");
    this.context = context;

    this.measures = this.context.measureText("A");
    this.hoveredAxis = null;

    this.zoom = zoom;
    this.scale = { x: 1, y: 1 };
    this._computeScale();

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

    this.canvas.addEventListener("mousemove", (e) => {
      this.mouse = {
        x: e.offsetX,
        y: e.offsetY,
      };
      this._checkHoveringAxis(e.shiftKey);
    });

    document.addEventListener("keydown", (e) => {
      this._checkHoveringAxis(e.key == "Shift");
    });
    document.addEventListener("keyup", (e) => {
      this._checkHoveringAxis(false);
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.mouse = null;
      this._checkHoveringAxis(false);
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

    this.canvas.addEventListener("wheel", (e) => {
      if (e.deltaY === 0) return;
      if (e.shiftKey && this._isHoveringAxis(Axis.vertical)) {
        this.zoom.y -= e.deltaY / Math.abs(e.deltaY);
      } else if (e.shiftKey && this._isHoveringAxis(Axis.horizontal)) {
        this.zoom.x -= e.deltaY / Math.abs(e.deltaY);
      } else {
        this.zoom.y -= e.deltaY / Math.abs(e.deltaY);
        this.zoom.x -= e.deltaY / Math.abs(e.deltaY);
      }
      this._computeScale();
      this.render();
    });
  }

  render() {
    if (this.func === null) return;
    const start = performance.now();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._renderAxis();

    const left = Math.round((0 - this.origin.x) / this.scale.x);
    const right = Math.round(
      (this.canvas.width - this.origin.x) / this.scale.x
    );

    const radius = 4;
    this.context.fillStyle = "#2c3e50";
    for (let x = left; x <= right; x++) {
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

    this.context.textAlign = "right";
    this.context.textBaseline = "bottom";
    this.context.fillText(
      performance.now() - start + " ms",
      this.canvas.width,
      this.canvas.height
    );
  }

  _renderAxis() {
    const baseColor = "black";
    const hoverColor = "red";

    // horizontal axis
    this.context.beginPath();
    this.context.strokeStyle =
      this.hoveredAxis === Axis.horizontal ? hoverColor : baseColor;

    this.context.moveTo(0, this.origin.y);
    this.context.lineTo(this.canvas.width, this.origin.y);
    this.context.stroke();

    // vertical axis
    this.context.beginPath();
    this.context.strokeStyle =
      this.hoveredAxis === Axis.vertical ? hoverColor : baseColor;
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

    const tickWidth =
      this.measures.width *
      max(left.toString().length, right.toString().length);
    let markEvery = Math.floor((3 * tickWidth) / this.scale.x) || 1;
    if (markEvery > 5) {
      markEvery = Math.round(markEvery / 5) * 5;
    }

    for (let x = left; x <= right; x++) {
      if (x % markEvery != 0) continue;
      this.context.fillText(
        `${x}`,
        this.origin.x + x * this.scale.x,
        this.origin.y + 20
      );
    }

    const tickHeight =
      this.measures.actualBoundingBoxAscent +
      this.measures.actualBoundingBoxDescent;

    markEvery = Math.floor((8 * tickHeight) / this.scale.y) || 1;
    if (markEvery > 5) {
      markEvery = Math.round(markEvery / 5) * 5;
    }
    this.context.textAlign = "right";
    this.context.textBaseline = "middle";
    for (let y = top; y <= bottom; y++) {
      if (y % markEvery != 0) continue;
      this.context.fillText(
        `${-y}`,
        this.origin.x - 4,
        this.origin.y + y * this.scale.y
      );
    }
  }

  _computeScale() {
    this.scale.x = Math.pow(1.2, this.zoom.x);
    this.scale.y = Math.pow(1.2, this.zoom.y);
  }

  _isHoveringAxis(axis: Axis): boolean {
    if (this.mouse === null) return false;
    const highlightingDistance = 20;
    if (axis === Axis.horizontal) {
      return Math.abs(this.mouse.y - this.origin.y) < highlightingDistance;
    }
    if (axis === Axis.vertical) {
      return Math.abs(this.mouse.x - this.origin.x) < highlightingDistance;
    }
    throw new Error("invalid axis");
  }

  _checkHoveringAxis(shiftKey: boolean) {
    const prev = this.hoveredAxis;

    if (shiftKey && this._isHoveringAxis(Axis.horizontal)) {
      this.hoveredAxis = Axis.horizontal;
    } else if (shiftKey && this._isHoveringAxis(Axis.vertical)) {
      this.hoveredAxis = Axis.vertical;
    } else {
      this.hoveredAxis = null;
    }

    // console.log(this.hoveredAxis);
    if (this.hoveredAxis !== prev) {
      this.render();
    }
  }
}

function max(...nums: number[]): number {
  let max = nums[0];
  for (let num of nums) {
    if (num > max) max = num;
  }
  return max;
}
