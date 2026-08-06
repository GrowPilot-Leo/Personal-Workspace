import { defineModuleManifest } from "../../core/module.ts";

export const todayManifest = defineModuleManifest({
  id: "today",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["learning", "career", "english", "fitness", "review"],
  featureFlags: ["v2Navigation"],
  schemaVersion: 1,
});
