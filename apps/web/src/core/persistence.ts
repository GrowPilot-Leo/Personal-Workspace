import type { DailyLoopState } from "./daily-loop.ts";
import {
  loadDailyLoop as loadV1DailyLoop,
  saveDailyLoop as saveV1DailyLoop,
} from "./daily-loop.ts";
import {
  migrateDailyLoopV1ToV2,
  migrateDailyLoopV1ToWorkspaceV2,
  type MigrationRecord,
  type StorageLike,
  WORKSPACE_V2_KEY,
} from "./migrations.ts";
import {
  normalizeWorkspaceStateV2,
  type WorkspaceStateV2,
} from "./workspace-state.ts";

/** Typed persistence boundary for the local Workspace V2 source of truth. */
export type WorkspaceRepository = {
  loadWorkspace(): WorkspaceStateV2;
  saveWorkspace(state: WorkspaceStateV2): void;
  lastMigration(): MigrationRecord | null;
  loadDailyLoop(): DailyLoopState;
  saveDailyLoop(state: DailyLoopState): void;
};

export function createBrowserWorkspaceRepository(): WorkspaceRepository {
  if (typeof window === "undefined") {
    throw new Error("Browser workspace repository requires a browser environment");
  }
  return createWorkspaceRepository(window.localStorage);
}

export function createWorkspaceRepository(storage: StorageLike): WorkspaceRepository {
  let migration: MigrationRecord | null = null;

  return {
    loadWorkspace() {
      const now = new Date().toISOString();
      const result = migrateDailyLoopV1ToWorkspaceV2(storage, now);
      migration = result.record;
      return normalizeWorkspaceStateV2(result.payload, now);
    },

    saveWorkspace(state) {
      const normalized = normalizeWorkspaceStateV2(
        state,
        new Date().toISOString(),
      );
      storage.setItem(WORKSPACE_V2_KEY, JSON.stringify(normalized));
    },

    loadDailyLoop() {
      migration = migrateDailyLoopV1ToV2(storage).record;
      return loadV1DailyLoop(storage);
    },

    saveDailyLoop(state) {
      saveV1DailyLoop(storage, state);
    },

    lastMigration() {
      return migration;
    },
  };
}
