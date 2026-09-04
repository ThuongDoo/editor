import { jsonrepair } from 'jsonrepair'

// Parses "relaxed" JSON — plain JS object-literal syntax (unquoted keys,
// unquoted bare-word values, trailing commas, single quotes) as well as
// common syntax mistakes (missing commas, missing/extra closing brackets)
// by repairing it into strict JSON before calling JSON.parse. Lets an admin
// paste a config object straight out of source code without hand-fixing it
// into strict JSON first.
export function parseRelaxedJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    // fall through to the repair pass below
  }

  return JSON.parse(jsonrepair(text))
}

// Same repair pass as parseRelaxedJson, but returns the fixed JSON text
// instead of a parsed value — used to show what was auto-corrected before
// the admin generates a draft from it.
export function repairJsonText(text) {
  try {
    JSON.parse(text)
    return text
  } catch {
    // fall through to the repair pass below
  }

  return jsonrepair(text)
}
