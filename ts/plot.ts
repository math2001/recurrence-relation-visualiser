interface Point {
  readonly x: number;
  readonly y: number;
}

function plot(
  canvas: HTMLCanvasElement,
  unitaryorigin: Point,
  scale: Point,
  f: (x: number) => number
) {
  const c = canvas.getContext("2d");
  if (!c) {
    throw new Error("no context");
  }

  const origin = {
    x: (unitaryorigin.x * canvas.width) / 2 + canvas.width / 2,
    y: (unitaryorigin.y * canvas.height) / 2 + canvas.height / 2,
  };

  if (scale.x < 0 || scale.y < 0) {
    throw new Error("negative scale");
  }

  renderAxis(canvas, c, origin, scale);

  const left = Math.round((0 - origin.x) / scale.x);
  const right = Math.round((canvas.width - origin.x) / scale.x);

  const RADIUS = 4;
  c.fillStyle = "#2c3e50";
  for (let x = left; x < right; x++) {
    c.beginPath();
    const y = f(x);
    const p = project(origin, scale, { x, y });
    c.ellipse(p.x, p.y, RADIUS, RADIUS, 0, 0, 2 * Math.PI);
    c.fill();
  }
}

function assertIntegers(...nums: number[]) {
  for (let num of nums) {
    if (Math.floor(num) != num) {
      throw new Error("not integer");
    }
  }
}

// flip vertically, then scales, then translates to origin, in this order
function project(origin: Point, scale: Point, p: Point): Point {
  // maths does the opposite of what programers do
  return {
    x: p.x * scale.x + origin.x,
    y: -p.y * scale.y + origin.y,
  };
}

function renderAxis(
  canvas: HTMLCanvasElement,
  c: CanvasRenderingContext2D,
  origin: Point,
  scale: Point
) {
  c.beginPath();
  c.strokeStyle = "black";
  // horizontal axis
  c.moveTo(0, origin.y);
  c.lineTo(canvas.width, origin.y);
  // vertical axis
  c.moveTo(origin.x, 0);
  c.lineTo(origin.x, canvas.height);
  c.stroke();

  const left = Math.round((0 - origin.x) / scale.x);
  const right = Math.round((canvas.width - origin.x) / scale.x);
  const top = Math.round((0 - origin.y) / scale.y);
  const bottom = Math.round((canvas.height - origin.y) / 2);

  c.font = "12px Roboto Mono";
  c.textAlign = "center";
  for (let x = left; x < right; x++) {
    c.fillText(`${x}`, origin.x + x * scale.x, origin.y + 20);
  }

  c.textAlign = "right";
  c.textBaseline = "middle";
  for (let y = top; y < bottom; y++) {
    c.fillText(`${-y}`, origin.x - 4, origin.y + y * scale.y);
  }
}
