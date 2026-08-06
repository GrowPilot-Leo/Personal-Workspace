import { ModulePage } from "@/modules/shared/module-page";

// Settings hosts Appearance (themes/wallpapers/motion), AI providers and
// data/privacy. Theme switching already lives in the sidebar switcher.
export default function SettingsPage() {
  return (
    <ModulePage
      eyebrow="SETTINGS"
      title="设置"
      description="外观（主题与动效）、AI Provider 配置、数据与隐私。Provider 密钥始终保存在服务端。"
      primaryAction="打开外观设置"
      notice="当前为模块占位页。壁纸、动效模式与 Provider 配置在后续阶段接入。"
      items={[
        { title: "外观", description: "日间 / 夜间 / 暮色主题与动效模式。", status: "ready" },
        { title: "AI Provider", description: "统一接口配置，密钥只存服务端。", status: "planned" },
        { title: "数据与隐私", description: "导出、删除与留存规则。", status: "planned" },
      ]}
    />
  );
}
