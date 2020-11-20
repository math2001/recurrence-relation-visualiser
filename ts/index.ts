document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("#canvas");
  if (!canvas) throw new Error("no canvas");
  const origin = { x: -0.6, y: 0 };
  const scale = { x: 32, y: 32 };
  plot(canvas as HTMLCanvasElement, origin, scale, (x) => (x * x * x) / 50);
});
