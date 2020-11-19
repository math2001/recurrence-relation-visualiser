function testMathsExpressionsNumbers() {
  let table: [string, number][] = [
    ["1+2*3", 7],
    ["2*3+4", 10],
    ["1+2+3+4", 10],
    ["4*3*2+3", 27],
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
}
function testMathsExpressionsVariables() {
  let table: [string, { [key: string]: number }, number][] = [
    ["a+b", { a: 1, b: 2 }, 3],
    ["a[n]+a[i]", { "a[n]": 2, "a[i]": 3 }, 5],
  ];
  for (let row of table) {
    const expr = compileMathsExpression(row[0]);
    const actual = expr.eval(row[1]);
    if (actual != row[2]) {
      console.error(expr);
      console.error("actual", actual, "expected", row[1]);
      throw new Error("fail");
    }
  }
}

testMathsExpressionsNumbers();
testMathsExpressionsVariables();
console.log("tests passed");
