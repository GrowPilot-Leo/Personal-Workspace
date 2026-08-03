export type ModuleKey =
  | "dashboard"
  | "learning"
  | "english"
  | "fitness"
  | "knowledge"
  | "llm-provider";

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
    key: "dashboard",
    label: "成长总览",
    shortLabel: "总览",
    href: "/dashboard",
    description: "今日行动与成长进度",
  },
  {
    key: "learning",
    label: "AI 学习",
    shortLabel: "学习",
    href: "/learning",
    description: "路线、任务与学习复盘",
  },
  {
    key: "english",
    label: "英语进阶",
    shortLabel: "英语",
    href: "/english",
    description: "技术阅读与职业表达",
  },
  {
    key: "fitness",
    label: "健身训练",
    shortLabel: "健身",
    href: "/fitness",
    description: "身体档案与训练记录",
  },
  {
    key: "knowledge",
    label: "知识库",
    shortLabel: "知识",
    href: "/knowledge",
    description: "资料导入、检索与引用",
  },
  {
    key: "llm-provider",
    label: "模型配置",
    shortLabel: "模型",
    href: "/llm-providers",
    description: "可插拔 LLM Provider",
  },
];
