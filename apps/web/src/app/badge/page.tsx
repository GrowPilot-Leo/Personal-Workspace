import { ModulePage } from "@/modules/shared/module-page";

// Badges document a traceable journey with evidence. Placeholder until its
// owning stage wires real badge state machines and evidence pages.
export default function BadgePage() {
  return (
    <ModulePage
      eyebrow="BADGES"
      title="徽章"
      description="计划灰、进行中灰转金、完成金、验证金带证据标记；每个徽章都有可追溯的证据页。"
      primaryAction="查看徽章"
      notice="当前为模块占位页。徽章状态机与证据页在后续阶段接入真实记录。"
      items={[
        { title: "徽章状态", description: "计划 / 进行中 / 完成 / 验证四种状态。", status: "ready" },
        { title: "证据追踪", description: "任务、产出、评估、复盘与计划修订链接。", status: "planned" },
        { title: "证据详情页", description: "每个徽章的旅程与来源明细。", status: "planned" },
      ]}
    />
  );
}
