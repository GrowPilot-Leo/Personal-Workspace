import { ModulePage } from "@/modules/shared/module-page";

// Providers are infrastructure, not business modules. API keys must stay on
// the server and business workflows depend only on the future AI Gateway.
export function LlmProviderModule() {
  return (
    <ModulePage
      eyebrow="MODEL SETTINGS"
      title="LLM Provider 管理"
      description="通过统一接口配置 DeepSeek 等模型供应商，让业务模块可以独立于具体模型演进。"
      primaryAction="添加 Provider"
      notice="当前不采集 API Key。正式接入时密钥只保存在服务端环境变量或安全密钥服务中。"
      items={[
        { title: "DeepSeek", description: "计划作为首个文本生成 Provider，接入前核验最新官方 API。", status: "ready" },
        { title: "统一网关", description: "统一请求类型、超时、错误、结构化输出和使用记录。", status: "planned" },
        { title: "评测与回退", description: "基于任务质量、成本和稳定性评测模型，不静默切换。", status: "planned" },
      ]}
    />
  );
}
