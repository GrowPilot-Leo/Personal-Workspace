import { defineModuleManifest } from "../../core/module.ts";

export const careerManifest = defineModuleManifest({
  id: "career",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["learning"],
  featureFlags: [],
  schemaVersion: 1,
});
