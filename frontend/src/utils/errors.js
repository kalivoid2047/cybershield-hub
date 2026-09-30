// Helpers for reading the API's error envelope: { error: { message, details } },
// where `details` is DRF's raw payload (field -> [messages] or { detail }).

function detailsOf(error) {
  const data = error?.response?.data;
  return data?.error?.details ?? data?.errors ?? data;
}

function firstString(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (value && typeof value === "object") return firstString(Object.values(value)[0]);
  return "";
}

// Per-field messages, for showing errors next to the inputs that caused them.
export function fieldErrors(error) {
  const details = detailsOf(error);
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};
  return Object.fromEntries(Object.entries(details).map(([key, value]) => [key, firstString(value)]).filter(([, message]) => message));
}

export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error && !error.response && error.request) return "Can't reach the server. Check your connection and try again.";
  const details = detailsOf(error);
  if (details && typeof details === "object" && !Array.isArray(details)) {
    if (typeof details.detail === "string") return details.detail;
    const first = firstString(details);
    const key = Object.keys(details)[0];
    if (first && key) return key === "non_field_errors" ? first : `${key.replaceAll("_", " ")}: ${first}`;
  }
  return error?.response?.data?.error?.message || fallback;
}
