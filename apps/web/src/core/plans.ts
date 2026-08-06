import type { EntityId, IsoDateTime } from "@/core/identity";
import type { Task } from "@/core/tasks";

export type PlanHorizon = "daily" | "weekly" | "monthly";

export type PlanVersion<T> = {
  version: number;
  createdAt: IsoDateTime;
  reason: string;
  data: T;
};

export type Plan<T = unknown> = {
  id: EntityId;
  ownerModuleId: string;
  horizon: PlanHorizon;
  versions: PlanVersion<T>[];
  activeVersion: number;
  updatedAt: IsoDateTime;
};

export type PlanRevisionProposalStatus = "pending" | "accepted" | "edited" | "rejected";

export type Citation = {
  resourceId: EntityId;
  title: string;
  location?: string;
};

export type PlanRevisionProposal = {
  id: EntityId;
  planId: EntityId;
  reason: string;
  citations: Citation[];
  before: unknown;
  after: unknown;
  expectedTimeImpactMinutes?: number;
  status: PlanRevisionProposalStatus;
  proposedAt: IsoDateTime;
  decidedAt: IsoDateTime | null;
};

export type PlanRevisionDiff<T = unknown> = {
  proposalId: EntityId;
  reason: string;
  citations: Citation[];
  before: T;
  after: T;
};

export function createPlan<T>(
  input: {
    id?: EntityId;
    ownerModuleId: string;
    horizon: PlanHorizon;
    data: T;
    reason?: string;
    now?: IsoDateTime;
  },
): Plan<T> {
  const now = input.now ?? new Date().toISOString();
  const initialVersion: PlanVersion<T> = {
    version: 1,
    createdAt: now,
    reason: input.reason ?? "initial",
    data: input.data,
  };
  return {
    id: input.id ?? crypto.randomUUID(),
    ownerModuleId: input.ownerModuleId,
    horizon: input.horizon,
    versions: [initialVersion],
    activeVersion: 1,
    updatedAt: now,
  };
}

export function activePlanData<T>(plan: Plan<T>): T {
  const version = plan.versions.find((v) => v.version === plan.activeVersion);
  if (!version) throw new Error(`active version ${plan.activeVersion} not found`);
  return version.data;
}

export function proposeRevision<T>(
  plan: Plan<T>,
  input: {
    id?: EntityId;
    reason: string;
    citations?: Citation[];
    after: T;
    expectedTimeImpactMinutes?: number;
    now?: IsoDateTime;
  },
): PlanRevisionProposal {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    planId: plan.id,
    reason: input.reason,
    citations: input.citations ?? [],
    before: activePlanData(plan),
    after: input.after,
    expectedTimeImpactMinutes: input.expectedTimeImpactMinutes,
    status: "pending",
    proposedAt: now,
    decidedAt: null,
  };
}

export function applyRevision<T>(
  plan: Plan<T>,
  proposal: PlanRevisionProposal,
  decision: Exclude<PlanRevisionProposalStatus, "pending">,
  now: IsoDateTime = new Date().toISOString(),
): { plan: Plan<T>; proposal: PlanRevisionProposal } {
  const nextVersion = plan.activeVersion + 1;
  const updatedProposal: PlanRevisionProposal = {
    ...proposal,
    status: decision,
    decidedAt: now,
  };

  if (decision === "rejected") {
    return { plan, proposal: updatedProposal };
  }

  const acceptedAfter = decision === "edited" && "after" in proposal ? proposal.after : proposal.after;
  const nextPlan: Plan<T> = {
    ...plan,
    versions: [
      ...plan.versions,
      {
        version: nextVersion,
        createdAt: now,
        reason: proposal.reason,
        data: acceptedAfter as T,
      },
    ],
    activeVersion: nextVersion,
    updatedAt: now,
  };
  return { plan: nextPlan, proposal: updatedProposal };
}

export function deriveTasksFromPlan(plan: Plan<Task[]>): Task[] {
  return activePlanData(plan);
}
