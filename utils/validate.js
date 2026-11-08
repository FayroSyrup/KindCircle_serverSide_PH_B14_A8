import { today } from "./date.js";

const fields = ["title", "description", "eventType", "thumbnail", "location", "eventDate"];

// keep only the fields we allow
export function pickEventFields(b = {}) {
  const out = {};
  for (const k of fields) out[k] = String(b[k] ?? "").trim();
  return out;
}

export function checkEvent(d) {
  for (const k of fields) if (!d[k]) return `${k} is required`;
  if (d.title.length < 5) return "Title must be at least 5 characters";
  if (d.description.length < 20) return "Description must be at least 20 characters";
  if (!/^https?:\/\/.+/.test(d.thumbnail)) return "Thumbnail must be a valid image link";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.eventDate)) return "Event date is not valid";
  if (d.eventDate < today()) return "Event date cannot be in the past";
  return null;
}