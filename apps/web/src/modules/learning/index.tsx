import { ModulePage } from "@/modules/shared/module-page";

// Learning owns plans, mastery and reviews. Knowledge ingestion and LLM calls
// will be accessed through public service contracts rather than imported here.
export function LearningModule() {
  return (
    <ModulePage
      eyebrow="LEARNING WORKSPACE"
      title="AI 产品能力成长"
      description="把岗位目标拆成可执行学习路线，并用输出、测试和复盘持续校准掌握度。"
      primaryAction="创建学习计划"
      notice="当前为模块占位页。下一阶段先实现目标、计划、每日任务和复盘四个结构化对象。"
      items={[
        { title: "能力路线", description: "按 LLM、Prompt、RAG、Agent、评测与产品落地组织主线。", status: "ready" },
        { title: "今日学习", description: "根据可用时间和知识缺口生成可完成的任务。", status: "planned" },
        { title: "掌握度复盘", description: "用问题、输出和错误记录调整下一次学习计划。", status: "planned" },
      ]}
    />
  );
}
