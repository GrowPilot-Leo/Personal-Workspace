import { defineModuleManifest } from "../../core/module.ts";

export const reviewManifest = defineModuleManifest({
  id: "review",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["learning", "career", "english", "fitness"],
  featureFlags: [],
  schemaVersion: 1,
});
