interface Formula {
  eval: (vars: { [key: string]: number }) => number;
  requiredVariables: string[];
}

enum TokenType {
  variable,
  operator,
  number,
}

interface Token {
  value: string | number;
  type: TokenType;
}

type Leaf = number | string;

interface ENode {
  left: ENode | Leaf;
  right: ENode | Leaf;
  operator: string;
}

function evalMathsExpression(expression: string): Formula {
  // I don't what is the best way to get typescript to see that a string can
  // also be considered an array of strings (characters)
  const tokenstream = tokenize(new Stream((expression as unknown) as string[]));
  const tree = parse(tokenstream);
  console.log(tree);
  return {
    eval: function (vars: { [key: string]: number }): number {
      return 0;
    },
    requiredVariables: [],
  };
}

function tokenize(charStream: Stream<string>): Stream<Token> {
  const tokens: Token[] = [];
  while (!charStream.eof()) {
    const char = charStream.consume();
    if (isdigit(char)) {
      const buf = [char];
      let hasDot = false;
      while (
        !charStream.eof() &&
        (isdigit(charStream.peek()) || (!hasDot && charStream.peek() == "."))
      ) {
        buf.push(charStream.consume());
        if (buf[buf.length - 1] == ".") {
          hasDot = true;
        }
      }
      tokens.push({
        value: hasDot ? parseFloat(buf.join("")) : parseInt(buf.join("")),
        type: TokenType.number,
      });
    } else if (isoperator(char)) {
      tokens.push({
        value: char,
        type: TokenType.operator,
      });
    } else if (isalpha(char)) {
      const buf: string[] = [char];
      while (!charStream.eof() && isalphanum(charStream.peek())) {
        buf.push(charStream.consume());
      }
      tokens.push({
        type: TokenType.variable,
        value: buf.join(""),
      });
    }
  }
  return new Stream<Token>(tokens);
}

function nud(tokenstream: Stream<Token>): ENode | Leaf {
  const token = tokenstream.consume();
  if (token.type === TokenType.number || token.type === TokenType.variable) {
    return token.value;
  }
  throw new Error("invalid token type");
}

function parse(
  tokenstream: Stream<Token>,
  precedence: number = 0
): ENode | Leaf {
  let left = nud(tokenstream);

  let next;
  while (!tokenstream.eof()) {
    next = tokenstream.peek();
    if (next.type !== TokenType.operator) throw new Error();
    if (getPrecedence(next.value as string) <= precedence) break;
    tokenstream.consume();
    left = {
      left: left,
      operator: next.value as string,
      right: parse(tokenstream, getPrecedence(next.value as string)),
    };
  }
  return left;
}

function getPrecedence(operator: string): number {
  if (operator === "+" || operator === "-") {
    return 1;
  }
  if (operator === "*" || operator === "/") {
    return 11;
  }
  if (operator === "^") {
    return 21;
  }
  throw new Error(`unknown operator ${operator}`);
}

function isdigit(char: string) {
  if (char.length !== 1) throw new Error("expected length of 1");
  const code = char.charCodeAt(0);
  return code >= "0".charCodeAt(0) && code <= "9".charCodeAt(0);
}

function isoperator(char: string) {
  if (char.length !== 1) throw new Error("expected length of 1");
  return (
    char == "+" || char == "-" || char == "/" || char == "*" || char == "^"
  );
}

function isalpha(char: string) {
  if (char.length !== 1) throw new Error("expected length of 1");
  if (char == "_") return true;
  const code = char.charCodeAt(0);
  return (
    ("a".charCodeAt(0) <= code && code <= "z".charCodeAt(0)) ||
    ("A".charCodeAt(0) <= code && code <= "Z".charCodeAt(0))
  );
}

function isalphanum(char: string) {
  return isalpha(char) || isdigit(char);
}
