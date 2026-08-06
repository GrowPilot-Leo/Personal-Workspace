import type { EntityId } from "@/core/identity";
import type { Review, ReviewHorizon } from "@/core/reviews";

export type ReviewSummary = {
  id: EntityId;
  ownerModuleId: string;
  horizon: ReviewHorizon;
  periodKey: string;
  wins: string;
  blockers: string;
  adjustment: string;
};

export function toReviewSummary(review: Review): ReviewSummary {
  return {
    id: review.id,
    ownerModuleId: review.ownerModuleId,
    horizon: review.horizon,
    periodKey: review.periodKey,
    wins: review.wins,
    blockers: review.blockers,
    adjustment: review.adjustment,
  };
}

/**
 * Pure scheduling check: a daily review for today is due when none exists yet.
 */
export function isReviewDue(existing: ReviewSummary[], periodKey: string): boolean {
  return !existing.some((review) => review.periodKey === periodKey && review.horizon === "daily");
}
