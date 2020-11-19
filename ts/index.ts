document.addEventListener("DOMContentLoaded", () => {
  // const input = document.querySelector("#formula")
  // ((3 * 2) * 5) + 4
  // evalMathsExpression("3 * 2 + 4");
  const expr = compileMathsExpression("n1 + n2 * n3");
  const result = expr.eval({
    n1: 2,
    n2: 3,
    n3: 4,
  });
  console.log(result);

  // 3 + (2 * 4)
});
