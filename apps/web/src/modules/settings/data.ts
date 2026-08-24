import type { IsoDateTime } from "../../core/identity.ts";
import { migrateDailyLoopPayloadToWorkspaceV2 } from "../../core/migrations.ts";
import {
  normalizeWorkspaceStateV2,
  type WorkspaceStateV2,
} from "../../core/workspace-state.ts";
import {
  isMotion,
  isTheme,
  type Motion,
  type Theme,
} from "../../shared/theme/theme.ts";

export type WorkspaceExportV2 = {
  schema: "growpilot.workspace.export";
  version: 2;
  exportedAt: IsoDateTime;
  appearance: { theme: Theme; motion: Motion };
  workspace: WorkspaceStateV2;
};

export type WorkspaceImportSummary = {
  spaces: number;
  tasks: number;
  reviews: number;
};

export type ParsedWorkspaceImport = {
  workspace: WorkspaceStateV2;
  appearance: Partial<{ theme: Theme; motion: Motion }>;
  summary: WorkspaceImportSummary;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCompleteWorkspaceRoot(
  value: unknown,
): value is Record<string, unknown> & { version: 2 } {
  return (
    isRecord(value) &&
    value.version === 2 &&
    Array.isArray(value.learningSpaces) &&
    Array.isArray(value.plans) &&
    Array.isArray(value.tasks) &&
    Array.isArray(value.reviews) &&
    Array.isArray(value.events)
  );
}

function parseAppearance(
  value: unknown,
): Partial<{ theme: Theme; motion: Motion }> {
  if (!isRecord(value)) return {};
  const appearance: Partial<{ theme: Theme; motion: Motion }> = {};
  if (isTheme(value.theme)) appearance.theme = value.theme;
  if (isMotion(value.motion)) appearance.motion = value.motion;
  return appearance;
}

function parsedImport(
  workspace: WorkspaceStateV2,
  appearance: Partial<{ theme: Theme; motion: Motion }>,
): ParsedWorkspaceImport {
  return {
    workspace,
    appearance,
    summary: {
      spaces: workspace.learningSpaces.length,
      tasks: workspace.tasks.length,
      reviews: workspace.reviews.length,
    },
  };
}

export function buildWorkspaceExport(
  workspace: WorkspaceStateV2,
  appearance: { theme: Theme; motion: Motion },
  exportedAt: IsoDateTime,
): WorkspaceExportV2 {
  return {
    schema: "growpilot.workspace.export",
    version: 2,
    exportedAt,
    appearance,
    workspace: normalizeWorkspaceStateV2(workspace, exportedAt),
  };
}

export function parseWorkspaceImport(
  value: unknown,
  now: IsoDateTime,
): ParsedWorkspaceImport | null {
  if (
    !isRecord(value) ||
    value.schema !== "growpilot.workspace.export"
  ) {
    return null;
  }

  const appearance = parseAppearance(value.appearance);
  if (value.version === 2) {
    if (!isCompleteWorkspaceRoot(value.workspace)) return null;
    return parsedImport(
      normalizeWorkspaceStateV2(value.workspace, now),
      appearance,
    );
  }

  if (value.version === 1) {
    const workspace = migrateDailyLoopPayloadToWorkspaceV2(
      value.dailyLoop,
      now,
    );
    return workspace ? parsedImport(workspace, appearance) : null;
  }

  return null;
}
