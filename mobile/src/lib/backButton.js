// Registry for the Android back button / back gesture.
// A page can register a handler that returns true when it fully handled the
// back action (e.g. it showed a "cancel quotation?" confirmation).

let pageHandler = null

export function setPageBackHandler(fn) {
  pageHandler = fn
}

export function runPageBackHandler() {
  return typeof pageHandler === 'function' ? Boolean(pageHandler()) : false
}
