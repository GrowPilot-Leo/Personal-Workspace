export type EntityId = string;

export type IsoDateTime = string;

export type DateKey = string;

export function createId(): EntityId {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function nowIso(): IsoDateTime {
  return new Date().toISOString();
}

export function isIsoDateTime(value: unknown): value is IsoDateTime {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
