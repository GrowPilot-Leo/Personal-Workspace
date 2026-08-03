# GrowPilot 架构设计 V0.1

## 1. 架构目标

- 模块自治：修改健身模块不应影响学习模块。
- Provider 解耦：业务代码不直接调用 DeepSeek 或其他模型 SDK。
- 数据分层：结构化业务数据、长期记忆和知识文档分开管理。
- 渐进演进：先完成页面与接口边界，再接入数据库、RAG 和 Agent Runtime。

## 2. 分层结构

```text
Web App
├── App Routes              路由与页面装配
├── Business Modules        Dashboard/Learning/English/Fitness/Knowledge
├── Shared UI               跨模块通用但不含业务规则的组件
├── Application Services    用例、工作流和公共接口
├── AI Gateway              Provider 路由、重试、超时、成本记录
└── Data Adapters           Database/Object Storage/Vector Search
```

## 3. 依赖规则

允许：

```text
Route -> Business Module -> Public Service Interface -> Adapter
Business Module -> Shared UI
```

禁止：

```text
Learning -> Fitness internal files
Fitness -> DeepSeek SDK
UI component -> Database client
Knowledge RAG -> overwrite structured user facts
```

跨模块协作通过稳定的公共契约完成，例如 `DailyTaskSummary`、`KnowledgeSearchPort` 和 `LLMCompletionPort`。

## 4. 数据边界

- Core：用户、目标、任务、偏好。
- Learning：学习计划、学习记录、知识点掌握度。
- English：训练任务、作品、评分与反馈。
- Fitness：身体档案、测量记录、训练计划、动作记录、疼痛反馈。
- Knowledge：文档、资源、分块、嵌入、检索引用。
- AI：Provider 配置、调用记录、错误与成本元数据。

初期可使用同一 PostgreSQL 实例，但表、类型和访问代码按模块隔离。

## 5. AI 与 RAG 边界

训练组数、恢复窗口、任务状态等应由结构化数据和规则负责；LLM 负责理解自然语言、生成解释与草案。RAG 负责检索用户上传的知识和可追溯资料，不承担精确计算或唯一事实源。

推荐生成流程：

```text
User Request
-> Validate Input
-> Load Structured Profile
-> Apply Domain Rules
-> Retrieve Relevant Knowledge
-> Call LLM Gateway
-> Validate Structured Output
-> Store Result and Evidence
```

## 6. 安全边界

- 所有密钥仅保存在服务端环境变量。
- 图片和身体数据属于敏感个人数据，后续必须提供删除、授权和保留期限设置。
- 健身建议检测疼痛、伤病或高风险描述时应停止强度推荐，并提示寻求专业人员帮助。
- AI 输出应保留来源、时间和模型信息，便于复盘与评测。
