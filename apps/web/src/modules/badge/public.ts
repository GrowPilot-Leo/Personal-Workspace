import type { EntityId, IsoDateTime } from "@/core/identity";

export type BadgeState = "planned" | "active" | "completed" | "verified";

export type BadgeEvidence = {
  id: EntityId;
  type: "task" | "output" | "assessment" | "review" | "plan-revision" | "external";
  title: string;
  sourceModuleId: string;
  recordedAt: IsoDateTime;
};

export type Badge = {
  id: EntityId;
  goal: string;
  state: BadgeState;
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  verifiedAt: IsoDateTime | null;
  evidence: BadgeEvidence[];
};

/**
 * Pure state transition. Manual task completion advances progress but does
 * not automatically create a verified badge.
 */
export function advanceBadgeProgress(badge: Badge, evidence: BadgeEvidence): Badge {
  const merged = [...badge.evidence, evidence];
  const hasOutputEvidence = merged.some((item) => item.type === "output" || item.type === "assessment");
  const hasExternalVerification = merged.some((item) => item.type === "external");

  const nextState: BadgeState = hasExternalVerification
    ? "verified"
    : hasOutputEvidence
      ? "completed"
      : "active";

  const now = evidence.recordedAt;
  return {
    ...badge,
    state: nextState,
    startedAt: badge.startedAt ?? now,
    completedAt: nextState === "completed" || nextState === "verified" ? (badge.completedAt ?? now) : badge.completedAt,
    verifiedAt: nextState === "verified" ? (badge.verifiedAt ?? now) : null,
    evidence: merged,
  };
}
