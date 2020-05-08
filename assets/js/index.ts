/**
 * The main application entrypoint for the index page.
 */

import { debounce } from "./utils.ts";

/**
 * An entry in the horse auto-completion results.
 * ID is used internally, while name and age are displayed to the user.
 */
interface HorseEntry {
  id: string;
  name: string;
  age: string;
}

/**
 * Queries the horses in the database for auto-completion.
 *
 * @param q - The query
 * @param limit - The maximum amount of horses to return
 * @return A promise that resolves to the data
 */
const queryHorses = async (
  q: string,
  limit: number = 10
): Promise<HorseEntry[]> => {
  // Make an async query to the horses.json endpoint
  const resp = await fetch(`/horses.json?q=${q}&limit=${limit}`);

  // Check invalid error code
  if (resp.status !== 200) {
    if (resp.status === 400) {
      // Bad Request
      throw new Error((await resp.json()).error);
    } else {
      // Internal Server Error
      throw new Error("There was an error fetching the horse list.");
    }
  }

  // Get JSON data
  const data: [string, string, string][] = await resp.json();
  // convert sent data into autocomplete entries
  const horses: HorseEntry[] = data.map(([id, name, age]) => ({
    id,
    name,
    age,
  }));

  return horses;
};

/**
 * Copies the horse entry row template and creates a new template.
 *
 * @return Copied horse row entry
 */
const makeEntry = (): HTMLDivElement => {
  // Get the template from the document
  const template: HTMLTemplateElement = document.getElementById(
    "entry-row"
  )! as HTMLTemplateElement;
  // Create a clone
  const rowClone: HTMLDivElement = template.content.cloneNode(
    true
  ) as HTMLDivElement;

  return rowClone;
};

/**
 * Creates rows for auto-completing horses.
 *
 * @param search - The query for auto-completion
 * @return Promise that resolves into row HTML
 */
const makeAutoCompleteRows = async (search: string): Promise<string> => {
  const horses = await queryHorses(search);

  return horses
    .map(
      (horse) =>
        `<div tabindex="-1"
              class="autocomplete__entry"
              data-value="${horse.id}"
              data-age="${horse.age}">${horse.name}</div>`
    )
    .join("");
};

/**
 * The data that is sent to the server when generating predictions.
 */
interface HorseInput {
  id: string;
  weight: number;
  driver: string;
  start: number;
  wonLast: boolean;
  wonLastThree: boolean;
}

/**
 * The data that is returned from the server after predictions have
 * been generated.
 */
interface HorseOutput {
  name: string;
  age: number;
  driver: string;
  start: number;
  prediction: number;
}

/**
 * Gets the entered horse data from the tables on the page.
 *
 * @return rows if all data is valid, or null if there's invalid data
 */
const collectEntries = (): HorseInput[] | null => {
  const results: HorseInput[] = [];

  // Iterate through all tables on the page
  const status = ([].slice.call(
    document.querySelectorAll(".table__row")
  ) as HTMLElement[]).every((row, i) => {
    // Some rows are special, like header or "add another" rows, skip those
    if (row.className !== "table__row") return true;

    // Check the ID field
    const id = (row.querySelector(".horis__horse")! as HTMLElement).dataset
      .realValue;
    if (!id) {
      alert("Row #" + i + " doesn't have the horse name filled.");
      return false;
    }

    // Check the weight field
    const weight = row.querySelector(".horis__weight")! as HTMLInputElement;
    if (!weight.value) {
      alert("Row #" + i + " doesn't have the weight filled.");
      return false;
    }

    // Check the driver field
    const driver = row.querySelector(".horis__driver")! as HTMLInputElement;
    if (!driver.value) {
      alert("Row #" + i + " doesn't have the driver filled.");
      return false;
    }

    // Check the starting position field
    const start = row.querySelector(".horis__start")! as HTMLInputElement;
    if (!start.value) {
      alert("Row #" + i + " doesn't have the start position filled.");
      return false;
    }

    // Get the won last/won last three field
    const wonLast = row.querySelector(".horis__won-last")! as HTMLInputElement;
    const wonLastThree = row.querySelector(
      ".horis__won-last-three"
    )! as HTMLInputElement;

    // Insert HorseInput values
    results.push({
      id,
      weight: parseInt(weight.value),
      driver: driver.value,
      start: parseInt(start.value),
      wonLast: wonLast.checked,
      wonLastThree: wonLastThree.checked,
    });
    return true;
  });

  // If some entry failed validation, then return null
  if (!status) return null;

  return results;
};

/**
 * Gets the data sent from the server and formats it for display on
 * the results table.
 *
 * @param data - Data sent from server
 */
const displayResults = (data: HorseOutput[]) => {
  // Get the results table
  const resultsDiv = document.querySelector(".results__rows")!;

  // For each row, format it and insert it into the table
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

/**
 * Send the data for tables into the server, and display results afterwards.
 */
const submitResults = async () => {
  // Empty the results div
  const resultsDiv = document.querySelector(".results__rows")!;
  resultsDiv.parentElement!.classList.add("results--visible");
  resultsDiv.innerHTML = "";

  // Get all the input data
  const input = collectEntries();
  // Don't submit if entries have invalid values
  if (!input) return;

  try {
    // Send the collected data to the server as JSON
    const resp = await fetch("/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    // Check for error status
    if (resp.status !== 200) {
      if (resp.status === 400) {
        alert((await resp.json()).error);
        return;
      } else {
        throw resp;
      }
    }

    // Get the JSON response data
    const data = await resp.json();

    // Display the results
    displayResults(data);
  } catch (e) {
    console.error(e);
    alert("Error when fetching prediction result.");
  }
};

/**
 * Setup the javascript on document load.
 */
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    // Get the table
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
      (e) => {
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
      (e) => {
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
      (e) => {
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
      (e) => {
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
