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

    ensureEnoughICElementsAndUpdateIndexes(
      icBox,
      icElements,
      parseInt(icStartIndexInput.value),
      expr.requiredVariables.length
    );

    plot.func = (x: number): number => {
      return 0 + x - x;
    };
  };

  boxFormula.addEventListener("input", (e) => {
    updateDynamicElements();
  });

  updateDynamicElements();
});

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
    label.textContent = `a[${i + startIndex}]: `;
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
