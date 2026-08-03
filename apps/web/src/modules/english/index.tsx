import { ModulePage } from "@/modules/shared/module-page";

// English is a distinct training domain so its rubrics and records can evolve
// without coupling to the general Learning module.
export function EnglishModule() {
  return (
    <ModulePage
      eyebrow="ENGLISH WORKSPACE"
      title="面向 AI 岗位的英语进阶"
      description="围绕技术阅读、行业词汇、产品表达和面试沟通训练，不做泛化考试题库。"
      primaryAction="开始今日训练"
      notice="当前为模块占位页。评分维度和示例内容会在接入真实任务前单独定义并验证。"
      items={[
        { title: "技术阅读", description: "阅读官方文档并保留原文、摘要与理解问题。", status: "ready" },
        { title: "专业表达", description: "用英文解释产品、技术方案和个人项目。", status: "planned" },
        { title: "反馈记录", description: "分别记录语法、词汇、清晰度与专业表达反馈。", status: "planned" },
      ]}
    />
  );
}
