import { defineModuleManifest } from "../../core/module.ts";

export const englishManifest = defineModuleManifest({
  id: "english",
  version: "0.1.0",
  kind: "fixed",
  dependencies: ["knowledge"],
  featureFlags: [],
  schemaVersion: 1,
});
