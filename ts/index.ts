document.addEventListener("DOMContentLoaded", () => {
  const canvas = getElement<HTMLCanvasElement>("#canvas");
  const boxFormula = getElement<HTMLFontElement>("#box-formula");
  const formulaInput = getElement<HTMLInputElement>("#formula");
  const icStartIndexInput = getElement<HTMLInputElement>(
    "#initial-conditions-start-index"
  );
  const initialConditionsForm = getElement<HTMLDivElement>(
    "#initial-conditions"
  );

  const origin = { x: -0.6, y: 0 };
  const scale = { x: 32, y: 32 };

  const icBox = getElement<HTMLElement>("#initial-conditions");
  const icElements: HTMLElement[] = [];

  const plot = new Plot(canvas, origin, scale);
  plot.func = (x) => (x * x * x) / 30;
  plot.render();

  const updateDynamicElements = () => {
    let expr: Formula;
    try {
      expr = compileMathsExpression(formulaInput.value);
    } catch (e) {
      console.error(e);
      return;
    }

    // TODO: auto convert variables (a[n - 1] -> a[n-1])

    validateUsedVariables(expr.vars);

    ensureEnoughICElementsAndUpdateIndexes(
      icBox,
      icElements,
      parseInt(icStartIndexInput.value),
      expr.vars.length
    );

    const startIndex = parseInt(icStartIndexInput.value);
    const cache: number[] = [];
    for (let i = 0; i < expr.vars.length; i++) {
      cache[i] = parseInt(
        getElement<HTMLInputElement>("input", icElements[i]).value
      );
    }

    plot.func = (x: number): number | null => {
      if (x < startIndex) return null;

      const cacheIndex = x - startIndex;
      for (let j = cache.length; j <= cacheIndex; j++) {
        cache[cacheIndex] = expr.eval(
          toObjOfVariables(cache, expr.vars.length)
        );
      }
      return cache[cacheIndex];
    };

    plot.render();
  };

  boxFormula.addEventListener("input", (e) => {
    updateDynamicElements();
  });

  // set up fibonacci's sequence
  // formulaInput.value = "a[n-1]+a[n-2]";
  // updateDynamicElements();
  // icElements.push(getElement<HTMLElement>("p", icBox));
  // const next = icElements[icElements.length - 1].nextElementSibling;
  // if (next === null || !(next instanceof HTMLElement)) throw new Error("wot?");
  // icElements.push(next);
  // getElement<HTMLInputElement>("input", next).value = "1";
  updateDynamicElements();
});

function validateUsedVariables(variables: string[]) {
  for (let i = 0; i < variables.length; i++) {
    if (variables[i].startsWith("a[n-") && variables[i].endsWith("]")) {
      const index = parseInt(variables[i].slice("a[n-".length, -1), 10);
      if (index > 0 && index <= variables.length) {
        continue;
      }
    }
    console.error(variables[i]);
    throw new Error("invalid variable");
  }
}

function toObjOfVariables(
  allValues: number[],
  numVariables: number
): { [key: string]: number } {
  assertIntegers(numVariables);

  const obj: { [key: string]: number } = {};
  for (let i = 0; i < numVariables; i++) {
    obj[`a[n-${i + 1}]`] = allValues[allValues.length - 1 - i];
  }

  return obj;
}

function ensureEnoughICElementsAndUpdateIndexes(
  icBox: HTMLElement,
  icElements: HTMLElement[],
  startIndex: number,
  n: number
) {
  assertIntegers(n, startIndex);

  if (icElements.length === n) {
    for (let i = 0; i < n; i++) {
      getElement<HTMLElement>("label", icElements[i]).textContent = `a[${
        startIndex + i
      }] = `;
    }
    return;
  }

  if (icElements.length > n) {
    for (let i = 0; i < n; i++) {
      getElement<HTMLElement>("label", icElements[i]).textContent = `a[${
        startIndex + i
      }] = `;
    }
    for (let i = n; i < icElements.length; i++) {
      icElements[i].parentNode?.removeChild(icElements[i]);
    }
    icElements.length = n;
    return;
  }

  for (let i = 0; i < icElements.length; i++) {
    getElement<HTMLElement>("label", icElements[i]).textContent = `a[${
      startIndex + i
    }] = `;
  }

  for (let i = icElements.length; i < n; i++) {
    // <p>
    //   <label for="condition1">a[1]: </label>
    //   <input type="number" value="1" id="condition1" />
    // </p>

    const row = document.createElement("p");

    const label = document.createElement("label");
    label.setAttribute("for", `ic-${i}`);
    label.textContent = `a[${i + startIndex}] = `;
    row.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.value = "0";
    input.id = `ic-${i}`;
    row.appendChild(input);

    icBox.appendChild(row);
    icElements.push(row);
  }
}

function getElement<T>(
  selector: string,
  from: Element | Document = document
): T {
  const element = from.querySelector(selector) as T | null;
  if (element === null) throw new Error(`no match for ${selector}`);
  return element;
}

function assertIntegers(...numbers: number[]) {
  for (let num of numbers) {
    if (Math.floor(num) !== num) throw new Error("expect ints");
  }
}
