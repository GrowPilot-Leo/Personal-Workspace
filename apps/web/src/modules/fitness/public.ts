import type { EntityId, IsoDateTime } from "@/core/identity";

export type ObservationDecision = "pending" | "confirmed" | "edited" | "rejected";

export type ConfirmedObservation<T = unknown> = {
  original: T;
  finalValue?: T;
  decision: ObservationDecision;
  decidedAt?: IsoDateTime;
};

export type FitnessSessionSummary = {
  id: EntityId;
  title: string;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

/**
 * Guard: only confirmed or user-edited observations may influence plans.
 * Pending and rejected observations are excluded from plan generation.
 */
export function observationMayInfluencePlan(
  observation: ConfirmedObservation,
): boolean {
  return observation.decision === "confirmed" || observation.decision === "edited";
}
