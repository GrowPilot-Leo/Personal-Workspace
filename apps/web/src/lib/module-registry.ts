export type ModuleKey =
  | "today"
  | "learning"
  | "career"
  | "english"
  | "fitness"
  | "review"
  | "knowledge"
  | "badge"
  | "settings";

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  shortLabel: string;
  href: string;
  description: string;
};

// This registry is navigation metadata only. Domain rules and API calls stay
// inside their owning module to prevent the shell from becoming a god object.
export const moduleRegistry: ModuleDefinition[] = [
  {
    key: "today",
    label: "今日",
    shortLabel: "今日",
    href: "/today",
    description: "今日行动与复盘",
  },
  {
    key: "learning",
    label: "学习中心",
    shortLabel: "学习",
    href: "/learning",
    description: "可配置学习空间",
  },
  {
    key: "career",
    label: "职业成长",
    shortLabel: "职业",
    href: "/career",
    description: "目标、技能与证据",
  },
  {
    key: "english",
    label: "英语进阶",
    shortLabel: "英语",
    href: "/english",
    description: "听说读写综合提升",
  },
  {
    key: "fitness",
    label: "健身训练",
    shortLabel: "健身",
    href: "/fitness",
    description: "身体档案与训练计划",
  },
  {
    key: "review",
    label: "复盘中心",
    shortLabel: "复盘",
    href: "/review",
    description: "日周月复盘",
  },
  {
    key: "knowledge",
    label: "知识库",
    shortLabel: "知识",
    href: "/knowledge",
    description: "资料、检索与引用",
  },
  {
    key: "badge",
    label: "徽章",
    shortLabel: "徽章",
    href: "/badge",
    description: "可追溯的成长证据",
  },
  {
    key: "settings",
    label: "设置",
    shortLabel: "设置",
    href: "/settings",
    description: "外观、模型与数据",
  },
];

const mvpModuleKeys: ModuleKey[] = ["today", "learning", "review", "settings"];

export const mvpModuleRegistry: ModuleDefinition[] = mvpModuleKeys.map((key) => {
  const module = moduleRegistry.find((candidate) => candidate.key === key);
  if (!module) throw new Error(`Missing MVP module metadata: ${key}`);
  return module;
});
