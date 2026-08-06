import type { EntityId } from "@/core/identity";
import type { Citation, PlanRevisionProposal } from "@/core/plans";

export type KnowledgeScope = "global" | "learning-space" | "english" | "career" | "fitness";

export type ResourceProcessingState = "pending" | "processing" | "ready" | "failed";

export type KnowledgeResourceSummary = {
  id: EntityId;
  title: string;
  scope: KnowledgeScope;
  processingState: ResourceProcessingState;
};

export type PlanRevisionSummary = {
  id: EntityId;
  planId: EntityId;
  reason: string;
  citations: Citation[];
  status: PlanRevisionProposal["status"];
};

/**
 * Re-export of the core plan-revision proposal. Knowledge may create a
 * proposal; it must never silently overwrite an active plan.
 */
export type { PlanRevisionProposal } from "@/core/plans";

export function toPlanRevisionSummary(proposal: PlanRevisionProposal): PlanRevisionSummary {
  return {
    id: proposal.id,
    planId: proposal.planId,
    reason: proposal.reason,
    citations: proposal.citations,
    status: proposal.status,
  };
}
