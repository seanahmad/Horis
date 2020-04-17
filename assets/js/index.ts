import { debounce } from "./utils.ts";

interface HorseEntry {
  id: string;
  name: string;
  age: string;
}

const queryHorses = async (
  q: string,
  limit: number = 10
): Promise<HorseEntry[]> => {
  const resp = await fetch(`/horses.json?q=${q}&limit=${limit}`);
  if (resp.status !== 200) {
    if (resp.status === 400) {
      throw new Error((await resp.json()).error);
    } else {
      throw new Error("There was an error fetching the horse list.");
    }
  }

  const data: [string, string, string][] = await resp.json();
  const horses: HorseEntry[] = data.map(([id, name, age]) => ({
    id,
    name,
    age
  }));

  return horses;
};

const makeEntry = (): HTMLDivElement => {
  const template: HTMLTemplateElement = document.getElementById(
    "entry-row"
  )! as HTMLTemplateElement;
  const rowClone: HTMLDivElement = template.content.cloneNode(
    true
  ) as HTMLDivElement;
  return rowClone;
};

const makeAutoCompleteRows = async (search: string): Promise<string> => {
  const horses = await queryHorses(search);

  return horses
    .map(
      horse =>
        `<div tabindex="-1"
              class="autocomplete__entry"
              data-value="${horse.id}"
              data-age="${horse.age}">${horse.name}</div>`
    )
    .join("");
};

interface HorseInput {
  id: string;
  weight: number;
  driver: string;
  start: number;
  wonLast: boolean;
  wonLastThree: boolean;
}

interface HorseOutput {
  name: string;
  age: number;
  driver: string;
  start: number;
  prediction: number;
}

const collectEntries = (): HorseInput[] | null => {
  const results: HorseInput[] = [];

  const result = ([].slice.call(
    document.querySelectorAll(".table__row")
  ) as HTMLElement[]).every((row, i) => {
    // This checks for extra classes which we want to avoid.
    if (row.className !== "table__row") return true;

    const id = (row.querySelector(".horis__horse")! as HTMLElement).dataset
      .realValue;
    if (!id) {
      alert("Row #" + i + " doesn't have the horse name filled.");
      return false;
    }

    const weight = row.querySelector(".horis__weight")! as HTMLInputElement;
    if (!weight.value) {
      alert("Row #" + i + " doesn't have the weight filled.");
      return false;
    }

    const driver = row.querySelector(".horis__driver")! as HTMLInputElement;
    if (!driver.value) {
      alert("Row #" + i + " doesn't have the driver filled.");
      return false;
    }

    const start = row.querySelector(".horis__start")! as HTMLInputElement;
    if (!start.value) {
      alert("Row #" + i + " doesn't have the start position filled.");
      return false;
    }

    const wonLast = row.querySelector(".horis__won-last")! as HTMLInputElement;
    const wonLastThree = row.querySelector(
      ".horis__won-last-three"
    )! as HTMLInputElement;

    results.push({
      id,
      weight: parseInt(weight.value),
      driver: driver.value,
      start: parseInt(start.value),
      wonLast: wonLast.checked,
      wonLastThree: wonLastThree.checked
    });
    return true;
  });

  if (!result) return null;

  return results;
};

const displayResults = (data: HorseOutput[]) => {
  const resultsDiv = document.querySelector(".results__rows")!;

  data.forEach((result, i) => {
    const row = document.createElement("div");
    row.className = "table__row results__row";
    row.innerHTML = `
<div>${i + 1}</div>
<div>${result.name}</div>
<div>${result.age}</div>
<div>${result.driver}</div>
<div>${result.start}</div>
<div>${Math.floor(result.prediction * 100) / 100}</div>
`;
    resultsDiv.appendChild(row);
  });
};

const submitResults = async () => {
  const resultsDiv = document.querySelector(".results__rows")!;
  resultsDiv.parentElement!.classList.add("results--visible");
  resultsDiv.innerHTML = "";

  const input = collectEntries();
  if (!input) return;

  try {
    const resp = await fetch("/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (resp.status !== 200) {
      if (resp.status === 400) {
        alert((await resp.json()).error);
        return;
      } else {
        throw resp;
      }
    }

    const data = await resp.json();

    displayResults(data);
  } catch (e) {
    console.error(e);
    alert("Error when fetching prediction result.");
  }
};

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const table = document.querySelector(".table")!;

    // activate the add button
    const button = document.querySelector(".table__row--add button");
    if (button) {
      button.addEventListener(
        "click",
        () => {
          const row = makeEntry();
          if (table.children.length === 12 + 2) {
            alert("You can enter a maximum of 12 horses.");
          } else {
            table.insertBefore(row, button.parentElement);
          }
        },
        false
      );
    }

    // setup autocomplete handler
    const autoComplEl = document.createElement("div");
    autoComplEl.className = "autocomplete";
    // add the value to the input when clicked
    autoComplEl.addEventListener(
      "click",
      e => {
        const el = e.target as HTMLDivElement | null;
        if (!el || el.className !== "autocomplete__entry") return;

        const input = autoComplEl.previousElementSibling as HTMLInputElement | null;
        if (!input) return;

        input.value = el.textContent!;
        input.dataset.realValue = el.dataset.value!;

        // set the age for the age field
        const age = input.parentElement!.parentElement!.querySelector(
          ".horis__age"
        ) as HTMLInputElement | null;
        if (age) {
          age.value = el.dataset.age!;
        }

        autoComplEl.remove();
      },
      false
    );

    // setup the autocomplete
    const debounced = debounce(async (el: HTMLInputElement) => {
      autoComplEl.innerHTML = await makeAutoCompleteRows(el.value);
    }, 250);

    table.addEventListener(
      "input",
      e => {
        const el = e.target as HTMLElement | null;
        if (
          !el ||
          !(el instanceof HTMLInputElement) ||
          el.className !== "horis__horse" ||
          !el.value
        )
          return;

        if (autoComplEl.previousElementSibling !== el)
          el.parentElement!.appendChild(autoComplEl);

        // make sure to invalidate previous value
        el.removeAttribute("data-real-value");
        // clear the age for the age field
        const age = el.parentElement!.parentElement!.querySelector(
          ".horis__age"
        ) as HTMLInputElement | null;
        if (age) {
          age.value = "";
        }

        // make a query
        debounced(el);
      },
      false
    );

    // remove the completion popup when the user clicks out
    table.addEventListener(
      "focusout",
      e => {
        const focusEv = e as FocusEvent;
        const el = focusEv.target as HTMLElement | null;

        if (
          !el ||
          !(el instanceof HTMLInputElement) ||
          el.className !== "horis__horse" ||
          !el.value
        )
          return;

        if (
          !focusEv.relatedTarget ||
          !(focusEv.relatedTarget as HTMLElement).className.includes(
            "autocomplete"
          )
        )
          autoComplEl.remove();
      },
      false
    );

    // delete rows
    table.addEventListener(
      "click",
      e => {
        const el = e.target as HTMLElement | null;

        if (!el || el.className !== "horis__delete") return;

        el.parentElement!.parentElement!.remove();
      },
      false
    );

    // and finally, submit the results!
    const submit = document.querySelector(".submitform")!;
    submit.addEventListener("click", submitResults, false);
  },
  false
);
