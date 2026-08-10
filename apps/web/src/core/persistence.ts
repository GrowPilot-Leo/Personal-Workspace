import type { DailyLoopState } from "@/core/daily-loop";
import {
  loadDailyLoop as loadV1DailyLoop,
  saveDailyLoop as saveV1DailyLoop,
} from "@/core/daily-loop";
import {
  migrateDailyLoopV1ToV2,
  type MigrationRecord,
  type StorageLike,
} from "@/core/migrations";

/**
 * Typed persistence boundary for the current local workspace.
 *
 * V3 keeps the V1 daily-loop payload as the editable source of truth while
 * the idempotent V1 -> V2 snapshot is created at the repository boundary.
 * This lets pages stop reaching into localStorage directly without silently
 * replacing the working V1 data model.
 */
export type WorkspaceRepository = {
  loadDailyLoop(): DailyLoopState;
  saveDailyLoop(state: DailyLoopState): void;
  lastMigration(): MigrationRecord | null;
};

export function createWorkspaceRepository(storage: StorageLike): WorkspaceRepository {
  let migration: MigrationRecord | null = null;

  return {
    loadDailyLoop() {
      try {
        migration = migrateDailyLoopV1ToV2(storage).record;
      } catch {
        // A malformed migration must not blank the existing V1 experience.
        migration = null;
      }
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
