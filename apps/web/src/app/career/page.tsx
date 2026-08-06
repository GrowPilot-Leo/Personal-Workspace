import { ModulePage } from "@/modules/shared/module-page";

// Career is a fixed business module (DECISIONS.md). This placeholder composes
// ModulePage until Stage 5 delivers the real skill-map and evidence UI.
export default function CareerPage() {
  return (
    <ModulePage
      eyebrow="CAREER WORKSPACE"
      title="职业成长"
      description="将目标岗位转化为技能与证据路线图，链接学习空间而非复制其内容。"
      primaryAction="建立职业档案"
      notice="当前为模块占位页。目标岗位、技能图、差距与证据在 Stage 5 接入真实任务。"
      items={[
        { title: "目标与技能图", description: "目标岗位、目标日期与可编辑技能图。", status: "ready" },
        { title: "技能差距", description: "差距与学习空间建立稳定 ID 链接。", status: "planned" },
        { title: "里程碑与证据", description: "日周月任务、里程碑与可追溯证据。", status: "planned" },
      ]}
    />
  );
}
