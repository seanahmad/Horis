/**
 * Execute the function after a specified amount of time.
 * Repeated calls delay execution.
 */
export const debounce = (
  fn: (...params: any[]) => void,
  ms: number
): ((...params: any[]) => void) =>
  function(this: { _timeout: number | null }, ...params: any[]) {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    this._timeout = setTimeout(() => {
      fn(...params);
      this._timeout = null;
    }, ms);
  }.bind({ _timeout: null });
