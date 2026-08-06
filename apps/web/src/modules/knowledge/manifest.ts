import { defineModuleManifest } from "../../core/module.ts";

export const knowledgeManifest = defineModuleManifest({
  id: "knowledge",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["learning", "career", "english", "fitness"],
  featureFlags: ["knowledgePlanSync"],
  schemaVersion: 1,
});
