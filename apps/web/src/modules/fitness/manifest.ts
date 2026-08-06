import { defineModuleManifest } from "../../core/module.ts";

export const fitnessManifest = defineModuleManifest({
  id: "fitness",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["knowledge"],
  featureFlags: ["fitnessVisionAnalysis"],
  schemaVersion: 1,
});
