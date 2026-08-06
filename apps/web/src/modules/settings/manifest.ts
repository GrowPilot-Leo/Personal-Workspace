import { defineModuleManifest } from "../../core/module.ts";

export const settingsManifest = defineModuleManifest({
  id: "settings",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["llm-provider"],
  featureFlags: ["customLlmProvider", "dynamicWallpapers"],
  schemaVersion: 1,
});
