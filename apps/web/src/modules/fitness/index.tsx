import { ModulePage } from "@/modules/shared/module-page";

// Fitness keeps sensitive body and workout data in its own boundary. Medical
// diagnosis and rehabilitation prescriptions are explicitly out of scope.
export function FitnessModule() {
  return (
    <ModulePage
      eyebrow="FITNESS WORKSPACE"
      title="个性化训练工作台"
      description="以身体档案、训练目标、器械条件和历史记录为依据，逐步生成安全可执行的训练建议。"
      primaryAction="建立身体档案"
      notice="V0.1 不做照片诊断和 3D 模型。下一阶段先实现身体档案、SVG 肌群选择与训练记录。"
      items={[
        { title: "身体档案", description: "记录身高、体重、围度、经验、目标、器械与限制。", status: "ready" },
        { title: "肌群选择", description: "使用可访问的 2D SVG 正背面图选择目标肌群。", status: "planned" },
        { title: "训练闭环", description: "生成计划、记录组次重量、反馈难度并调整后续安排。", status: "planned" },
      ]}
    />
  );
}
