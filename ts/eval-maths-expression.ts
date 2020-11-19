interface Formula {
  eval: (vars: { [key: string]: number }) => number;
  requiredVariables: string[];
}

enum TokenType {
  variable,
  operator,
  number,
  bracket,
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

function compileMathsExpression(expression: string): Formula {
  const tokens = tokenize(expression);
  const variables = extractVariables(tokens);
  const tree = parse(tokens);
  const _eval = (
    node: ENode | Leaf,
    vars: { [key: string]: number }
  ): number => {
    if (typeof node === "number") {
      return node;
    }
    if (typeof node === "string") {
      return vars[node];
    }

    if (node.operator === "+") {
      return _eval(node.left, vars) + _eval(node.right, vars);
    }
    if (node.operator === "-") {
      return _eval(node.left, vars) - _eval(node.right, vars);
    }
    if (node.operator === "*") {
      return _eval(node.left, vars) * _eval(node.right, vars);
    }
    if (node.operator === "/") {
      return _eval(node.left, vars) / _eval(node.right, vars);
    }

    console.error(node);
    throw new Error("invalid node");
  };
  return {
    eval: function (vars: { [key: string]: number }): number {
      // ensure we have all the variables
      const foundVars = Array.from(variables);
      for (let name in vars) {
        const index = foundVars.indexOf(name);
        if (index < 0) throw new Error(`Unknown variable ${name}`);
        foundVars.splice(index, 1);
      }
      if (foundVars.length > 0) {
        console.error(foundVars);
        throw new Error("missing variables");
      }
      return _eval(tree, vars);
    },
    requiredVariables: variables,
  };
}

function tokenize(expression: string): Token[] {
  // I don't what is the best way to get typescript to see that a string can
  // also be considered an array of strings (characters)
  const charStream = new Stream<string>((expression as unknown) as string[]);

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
    } else if (char === "(" || char === ")") {
      tokens.push({
        type: TokenType.bracket,
        value: char,
      });
    } else if (char === "{") {
      const buf: string[] = [];
      let char = "{";
      while (!charStream.eof() && charStream.peek() !== "}") {
        buf.push(charStream.consume());
      }
      charStream.consume(); // consume the }
      tokens.push({
        type: TokenType.variable,
        value: buf.join(""),
      });
    } else if (char !== " ") {
      console.error(char);
      throw new Error("invalid char");
    }
  }
  return tokens;
}

function parse(tokens: Token[]): ENode | Leaf {
  return _parse(new Stream<Token>(tokens), 0);
}

function _parse(tokenstream: Stream<Token>, precedence: number): ENode | Leaf {
  let left = nud(tokenstream);

  let next;
  while (!tokenstream.eof()) {
    next = tokenstream.peek();
    if (next.type === TokenType.operator) {
      if (getPrecedence(next.value as string) <= precedence) break;
      tokenstream.consume();
      left = {
        left: left,
        operator: next.value as string,
        right: _parse(tokenstream, getPrecedence(next.value as string)),
      };
    } else if (
      tokenstream.peek().type === TokenType.bracket &&
      tokenstream.peek().value === ")"
    ) {
      break;
    } else {
      console.error(next);
      throw new Error();
    }
  }
  return left;
}

function nud(tokenstream: Stream<Token>): ENode | Leaf {
  const token = tokenstream.consume();
  if (token.type === TokenType.number || token.type === TokenType.variable) {
    return token.value;
  }
  if (token.type === TokenType.bracket && token.value === "(") {
    const node = _parse(tokenstream, 0);
    const close = tokenstream.consume();
    if (close.type !== TokenType.bracket || close.value !== ")")
      throw new Error();
    return node;
  }
  console.error(token.value, TokenType[token.type]);
  throw new Error("invalid token type");
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

function extractVariables(tokens: Token[]): string[] {
  const variables: string[] = [];
  for (let token of tokens) {
    if (token.type === TokenType.variable) {
      variables.push(token.value as string);
    }
  }
  return variables;
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
