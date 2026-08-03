import { ModulePage } from "@/modules/shared/module-page";

// Knowledge manages unstructured resources and citations. Precise profile data
// and task state remain in module databases instead of being hidden in vectors.
export function KnowledgeModule() {
  return (
    <ModulePage
      eyebrow="KNOWLEDGE WORKSPACE"
      title="个人知识与可控记忆"
      description="统一导入文本、图片和文档，完成解析、检索与引用，为各成长模块提供有来源的上下文。"
      primaryAction="导入资料"
      notice="当前未启用上传。RAG 上线前会先定义资源删除、权限、分块策略、引用格式和检索评测。"
      items={[
        { title: "资源中心", description: "管理 PDF、图片、文本、笔记及其来源和处理状态。", status: "ready" },
        { title: "RAG 检索", description: "按模块、时间、标签和相关度检索，并返回可追溯引用。", status: "planned" },
        { title: "长期记忆", description: "将可确认的偏好与总结交给用户查看、修正和删除。", status: "planned" },
      ]}
    />
  );
}
