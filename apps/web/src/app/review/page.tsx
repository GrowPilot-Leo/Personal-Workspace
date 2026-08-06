import { ModulePage } from "@/modules/shared/module-page";

// Review aggregates daily/weekly/monthly reviews across modules. Placeholder
// until its owning stage wires real review records.
export default function ReviewPage() {
  return (
    <ModulePage
      eyebrow="REVIEW CENTER"
      title="复盘中心"
      description="日、周、月复盘视图，优先复用真实 V1 每日复盘数据。"
      primaryAction="开始今日复盘"
      notice="当前为模块占位页。日周月复盘视图在后续阶段接入真实记录。"
      items={[
        { title: "每日复盘", description: "基于真实 V1 每日复盘记录。", status: "ready" },
        { title: "每周复盘", description: "按周汇总目标、任务与调整。", status: "planned" },
        { title: "每月复盘", description: "按月审视方向与阶段产出。", status: "planned" },
      ]}
    />
  );
}
