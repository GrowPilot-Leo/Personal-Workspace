# GrowPilot — AI Personal Growth OS

GrowPilot 是一个面向个人长期成长的 AI 原生工作台。首版围绕学习、英语、健身、知识库和 LLM Provider 管理，形成“目标 → 今日行动 → 记录 → 反馈 → 调整”的闭环。

## 当前状态

项目处于 V0.1 基础骨架阶段，重点是确定模块边界和建立可持续扩展的 Web App 结构。当前页面使用演示数据，不包含真实用户数据，也没有接入生产环境 API。

## 核心模块

- Dashboard：统一展示今日任务、成长进度和模块状态。
- Learning：管理 AI 产品经理学习路线、任务和复盘。
- English：面向技术阅读、表达与面试场景的英语训练。
- Fitness：身体档案、肌群选择、训练计划与训练记录。
- Knowledge：统一导入文本、图片和文档，为后续 RAG 检索预留接口。
- LLM Provider：统一管理 DeepSeek 等模型供应商，业务模块不直接依赖具体模型。

## 技术方向

- Next.js App Router + TypeScript
- Tailwind CSS
- 模块化前端结构
- 后续接入 Supabase/PostgreSQL、pgvector 与可插拔 LLM Provider

## 本地启动

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 文档

- [产品说明](docs/PRODUCT_SPEC.md)
- [架构设计](docs/ARCHITECTURE.md)
- [开发规范](docs/DEVELOPMENT_GUIDE.md)
- [模块边界](docs/MODULES.md)

## 开发原则

1. 按业务功能拆包，每个模块拥有自己的页面、类型、服务与测试。
2. 业务模块只通过公共接口访问 AI、知识库和数据能力。
3. 结构化数据进入数据库；非结构化资料才进入知识库和 RAG。
4. 每次提交只解决一个清晰问题，提交信息必须说明改了什么。
5. 涉及健康与训练的输出必须保留安全边界，不替代医生或专业教练诊断。

## 路线图

- V0.1：文档、模块骨架、Dashboard 与模块占位页。
- V0.2：用户目标、任务记录、学习与英语闭环。
- V0.3：健身档案、SVG 肌群图、训练记录和规则引擎。
- V0.4：知识导入、检索、引用溯源和 RAG。
- V0.5：多模型 Provider、评测、成本与失败回退。
