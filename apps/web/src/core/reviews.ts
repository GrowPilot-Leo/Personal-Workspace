import type { EntityId, IsoDateTime } from "@/core/identity";

export type ReviewHorizon = "daily" | "weekly" | "monthly";

export type Review = {
  id: EntityId;
  ownerModuleId: string;
  horizon: ReviewHorizon;
  periodKey: string;
  wins: string;
  blockers: string;
  adjustment: string;
  submittedAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export function createReview(input: {
  id?: EntityId;
  ownerModuleId: string;
  horizon: ReviewHorizon;
  periodKey: string;
  wins?: string;
  blockers?: string;
  adjustment?: string;
  submittedAt?: IsoDateTime;
}): Review {
  const now = input.submittedAt ?? new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    ownerModuleId: input.ownerModuleId,
    horizon: input.horizon,
    periodKey: input.periodKey,
    wins: input.wins ?? "",
    blockers: input.blockers ?? "",
    adjustment: input.adjustment ?? "",
    submittedAt: now,
    updatedAt: now,
  };
}

export function updateReview(
  review: Review,
  patch: Partial<Pick<Review, "wins" | "blockers" | "adjustment">>,
  now: IsoDateTime = new Date().toISOString(),
): Review {
  return { ...review, ...patch, updatedAt: now };
}
