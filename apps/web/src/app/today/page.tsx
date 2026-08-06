import { ModulePage } from "@/modules/shared/module-page";

// Today aggregates real module summaries into an action-first view. The
// real implementation (TodayModule) lands with Stage 2 Task 7; this
// placeholder keeps the route stable for navigation.
export default function TodayPage() {
  return (
    <ModulePage
      eyebrow="TODAY"
      title="今日行动"
      description="聚合各模块今日任务与复盘提醒，先行动后复盘。"
      primaryAction="开始今日行动"
      notice="当前为占位页。真实 Today 视图会聚合 V1 每日闭环的真实任务状态。"
      items={[
        { title: "今日任务", description: "聚合真实 V1 每日闭环任务。", status: "ready" },
        { title: "复盘提醒", description: "当日复盘到期时给出提示。", status: "planned" },
        { title: "明日建议", description: "基于真实任务状态的下一步建议。", status: "planned" },
      ]}
    />
  );
}
