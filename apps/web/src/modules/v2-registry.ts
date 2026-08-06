import { todayManifest } from "./today/manifest.ts";
import { learningManifest } from "./learning/manifest.ts";
import { careerManifest } from "./career/manifest.ts";
import { englishManifest } from "./english/manifest.ts";
import { fitnessManifest } from "./fitness/manifest.ts";
import { reviewManifest } from "./review/manifest.ts";
import { knowledgeManifest } from "./knowledge/manifest.ts";
import { badgeManifest } from "./badge/manifest.ts";
import { settingsManifest } from "./settings/manifest.ts";
import type { ModuleManifest } from "@/core/module";

/**
 * Registry of fixed V2 modules. Routes compose modules through their public
 * APIs; the registry is metadata only and holds no business rules.
 */
export const v2ModuleManifests: ModuleManifest[] = [
  todayManifest,
  learningManifest,
  careerManifest,
  englishManifest,
  fitnessManifest,
  reviewManifest,
  knowledgeManifest,
  badgeManifest,
  settingsManifest,
];

export function getModuleManifest(moduleId: string): ModuleManifest | undefined {
  return v2ModuleManifests.find((manifest) => manifest.id === moduleId);
}
