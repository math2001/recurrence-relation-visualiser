function testMathsExpressions() {
  const table: [string, number][] = [
    // ["1+2*3", 7],
    // ["2*3+4", 10],
    // ["1+2+3+4", 10],
    // ["4*3*2+3", 27],
    ["(1 + 2) * 3", 9],
    ["(((1 + 2))) * 3", 9],
    ["3 * (2 + 4)", 18],
  ];
  for (let row of table) {
    const expr = compileMathsExpression(row[0]);
    const actual = expr.eval({});
    if (actual != row[1]) {
      console.error(expr);
      console.error("actual", actual, "expected", row[1]);
      throw new Error("fail");
    }
  }
  console.log("tests passed!");
}

testMathsExpressions();
