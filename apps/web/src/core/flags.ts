/**
 * Feature flags are a rollback boundary, not a replacement for tests
 * (MODULE_ARCHITECTURE.md §9).
 */
export type FeatureFlag =
  | "v2Navigation"
  | "dynamicLearningSpaces"
  | "knowledgePlanSync"
  | "customLlmProvider"
  | "fitnessVisionAnalysis"
  | "dynamicWallpapers";

export type FeatureFlagConfig = Record<FeatureFlag, boolean>;

export const defaultFeatureFlags: FeatureFlagConfig = {
  v2Navigation: true,
  dynamicLearningSpaces: false,
  knowledgePlanSync: false,
  customLlmProvider: false,
  fitnessVisionAnalysis: false,
  dynamicWallpapers: false,
};

export function createFeatureFlagStore(initial: FeatureFlagConfig = defaultFeatureFlags) {
  const flags = new Map<FeatureFlag, boolean>(Object.entries(initial) as [FeatureFlag, boolean][]);

  function isEnabled(flag: FeatureFlag): boolean {
    return flags.get(flag) ?? false;
  }

  function set(flag: FeatureFlag, enabled: boolean) {
    flags.set(flag, enabled);
  }

  function all(): FeatureFlagConfig {
    return Object.fromEntries(flags) as FeatureFlagConfig;
  }

  return { isEnabled, set, all };
}

export type FeatureFlagStore = ReturnType<typeof createFeatureFlagStore>;
