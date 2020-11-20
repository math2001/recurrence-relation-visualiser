document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) throw new Error("no canvas");
  const origin = { x: -0.6, y: 0 };
  const scale = { x: 32, y: 32 };

  const plot = new Plot(canvas, origin, scale);
  plot.func = (x) => (x * x * x) / 30;
  plot.render();
});
