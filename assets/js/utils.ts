/**
 * Utility functions.
 */

/**
 * Execute the function after a specified amount of time.
 * Repeated calls delay execution.
 *
 * This function creates a temporary object and binds a function to it,
 * which will delay execution until the function hasn't been called more than
 * once in the specified amount of milliseconds.
 *
 * @param fn - The function to be executed
 * @param ms - The amount of milliseconds to wait
 * @return Debounced function
 */
export const debounce = (
  fn: (...params: any[]) => void,
  ms: number
): ((...params: any[]) => void) =>
  function (this: { _timeout: number | null }, ...params: any[]) {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    this._timeout = setTimeout(() => {
      fn(...params);
      this._timeout = null;
    }, ms);
  }.bind({ _timeout: null });
