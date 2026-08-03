# GrowPilot 开发规范

## 1. 目录和命名

- 业务模块放在 `src/modules/<module-name>`。
- 目录使用小写 kebab-case，React 组件使用 PascalCase。
- 每个模块通过自己的 `index.ts` 或入口组件暴露公共能力。
- 禁止从另一个模块的内部路径导入文件。
- 公共组件只有在至少两个模块真实复用后才移入 `shared`。

## 2. 模块建议结构

```text
src/modules/learning/
├── components/
├── domain/
├── services/
├── types/
└── index.tsx
```

V0.1 允许模块只有入口文件；随着功能增长再按上述目录拆分，避免空目录和无效抽象。

## 3. 注释规范

注释解释“为什么这样设计、有什么边界”，不逐行复述代码。公共接口、复杂规则、安全约束和临时兼容方案必须写明原因。

## 4. 提交规范

使用 Conventional Commits：

- `docs: add product scope and architecture`
- `feat(fitness): add body profile form`
- `feat(knowledge): add document ingestion contract`
- `fix(llm-provider): prevent client-side API key exposure`
- `refactor(learning): isolate plan generation service`

一次提交只完成一个可说明的改动。提交前检查改动范围，禁止混入无关格式化。

## 5. AI 接口规范

- 业务模块只调用统一 AI Gateway。
- 请求必须包含明确任务类型和超时。
- 输出优先使用经过校验的结构化 Schema。
- 记录 Provider、模型、耗时、错误类型和可选成本数据。
- Provider 失败必须有清晰错误态；后续再实现回退策略，不能静默换模型。

## 6. 数据与隐私

- API Key、Token、个人照片和生产数据不得提交到 Git。
- 示例数据必须明确标注为演示数据。
- 任何删除用户数据的能力都要明确作用范围并可验证。
- 涉及健身、伤病和身体评价时，避免诊断式语言。

## 7. 完成标准

一个功能完成至少满足：

1. 页面状态完整：加载、成功、空数据、错误。
2. 类型和模块边界清晰。
3. 关键规则有测试或可复核验证。
4. 文档说明新能力和限制。
5. 构建与静态检查通过。
