import { defineModuleManifest } from "../../core/module.ts";

export const learningManifest = defineModuleManifest({
  id: "learning",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["knowledge", "badge"],
  featureFlags: ["dynamicLearningSpaces"],
  schemaVersion: 1,
});
