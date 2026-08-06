import type { FeatureFlag } from "@/core/flags";

export type ModuleKind = "fixed" | "dynamic";

export type ModuleManifest = {
  /** stable module identifier, e.g. "learning" */
  id: string;
  /** semantic version of the manifest itself */
  version: string;
  /** fixed platform/business module or data-owned dynamic instance */
  kind: ModuleKind;
  /** module ids this module's public API depends on */
  dependencies: string[];
  /** feature flags that gate this module's capabilities */
  featureFlags: FeatureFlag[];
  /** current schema version of the module's persisted data */
  schemaVersion: number;
};

export function defineModuleManifest(manifest: ModuleManifest): ModuleManifest {
  return manifest;
}
