# Contributing Guide

## Prerequisites

- Node.js >= 18
- npm >= 9
- TypeScript 5.3+
- 钉钉开放平台应用（AppKey + AppSecret）
- AI CLI 工具：OpenCode 或 Claude Code

## Setup

```bash
# 1. 克隆仓库
git clone https://github.com/dreamor/dingtalk-openwork-integration.git
cd dingtalk-openwork-integration

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DINGTALK_APP_KEY、DINGTALK_APP_SECRET、AI_PROVIDER

# 4. 开发模式启动
npm run dev
```

## Available Scripts

<!-- AUTO-GENERATED from package.json - do not edit manually -->

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npm run build`         | TypeScript 编译（`tsc`）               |
| `npm run start`         | 生产模式启动（`node dist/index.js`）   |
| `npm run dev`           | 开发模式启动（`ts-node src/index.ts`） |
| `npm run test`          | 运行测试（Jest）                       |
| `npm run test:coverage` | 运行测试并生成覆盖率报告               |
| `npm run test:watch`    | 监听模式运行测试                       |
| `npm run lint`          | ESLint 检查                            |
| `npm run lint:fix`      | ESLint 自动修复                        |

<!-- END AUTO-GENERATED -->

## Testing

### 运行测试

```bash
# 全部测试
npm run test

# 单个模块
npx jest src/gateway/__tests__/

# 覆盖率报告
npm run test:coverage

# 监听模式
npm run test:watch
```

### 编写测试

- 测试文件放在对应模块的 `__tests__/` 目录下
- 命名规范：`<module>.test.ts`
- 使用 Jest + ts-jest
- 遵循 Arrange-Act-Assert 模式
- Mock 外部依赖（钉钉 API、CLI 执行器等）
- 覆盖率原则：关键业务路径（router/queue/memory/validators 等）保持 80%+；CLI 子进程与 WebSocket 等外部边界靠集成测试 + 手工烟雾测试兜底，不强求整体 80%

### 测试结构示例

```typescript
import { MyModule } from '../myModule';

describe('MyModule', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = { ... };
    // Act
    const result = MyModule.process(input);
    // Assert
    expect(result.success).toBe(true);
  });
});
```

## Code Style

- TypeScript strict mode
- ESLint + typescript-eslint（recommended config）
- Prettier：single quotes, trailing comma es5, printWidth 100
- 中文注释，英文代码标识符
- 文件组织按功能/领域，不按类型
- 函数 < 50 行，文件 < 800 行

### Lint & Format

```bash
# 检查
npm run lint

# 自动修复
npm run lint:fix
```

## PR Checklist

- [ ] 代码通过 `npm run build` 编译
- [ ] 代码通过 `npm run lint` 检查
- [ ] 新功能有对应测试
- [ ] 测试全部通过 `npm run test`
- [ ] 无硬编码密钥或凭据
- [ ] 提交消息遵循 `<type>: <description>` 格式
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

## Architecture Overview

```
消息流: Stream → Dedup → Queue → ConcurrencyControl → Executor → Response
模块:   dingtalk/  utils/   message-queue/              claude/ | opencode/
```

详见 [CLAUDE.md](../CLAUDE.md) 完整架构说明。
