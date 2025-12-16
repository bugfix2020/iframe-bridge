# @bugfix2019/iframe-bridge

[![npm version](https://img.shields.io/npm/v/@bugfix2019/iframe-bridge.svg)](https://www.npmjs.com/package/@bugfix2019/iframe-bridge)
[![License](https://img.shields.io/npm/l/@bugfix2019/iframe-bridge.svg)](https://github.com/bugfix2020/iframe-bridge/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-89.12%25-yellowgreen.svg)](https://github.com/bugfix2020/iframe-bridge)

一个通用的 iframe JavaScript Bridge，用于浏览器环境下基于 `postMessage` 的安全通信。

> 注意：不支持 SSR（仅支持浏览器环境）。

## ✨ 特性

- 🎯 **100% TypeScript** - 完整类型定义
- ✅ **测试覆盖率** - Vitest + v8 coverage（覆盖率细化到具体文件）
- 🚀 **简单 API** - 支持方法调用（request/response）与事件（event）
- 🔒 **Origin 校验** - 支持 `allowedOrigins` 白名单
- 🔧 **React Hook** - 子路径导出 `@bugfix2019/iframe-bridge/react`

## 📦 安装

```bash
# npm
npm install @bugfix2019/iframe-bridge

# pnpm
pnpm add @bugfix2019/iframe-bridge

# yarn
yarn add @bugfix2019/iframe-bridge
```

**前置要求**:
- 运行环境：浏览器（不支持 SSR）
- 开发/测试：Node.js >= 18.0.0

## 🚀 快速开始

父窗口（主页面）：

```ts
import { createParentBridge } from '@bugfix2019/iframe-bridge';

const iframe = document.getElementById('myIframe') as HTMLIFrameElement;
const bridge = createParentBridge(iframe, 'https://child-domain.com', {
  debug: true,
  timeout: 5000,
  allowedOrigins: ['https://child-domain.com']
});

bridge.registerMethod('getUserInfo', async () => ({ id: 1, name: 'John Doe' }));

bridge.on('userAction', (data) => {
  console.log('userAction:', data);
});

const result = await bridge.call('childMethod', { param: 'value' });
console.log('child result:', result);

bridge.emit('parentEvent', { message: 'Hello from parent' });
```

子窗口（iframe 内）：

```ts
import { createChildBridge } from '@bugfix2019/iframe-bridge';

const bridge = createChildBridge('https://parent-domain.com', { debug: true });

bridge.registerMethod('childMethod', async (params) => {
  console.log('childMethod params:', params);
  return { ok: true };
});

const userInfo = await bridge.call('getUserInfo');
console.log('userInfo:', userInfo);

bridge.on('parentEvent', (data) => console.log('parentEvent:', data));
bridge.emit('userAction', { action: 'click', target: 'button' });
```

React Hook（子路径导出）：

```ts
import { useIframeBridge } from '@bugfix2019/iframe-bridge/react';
```

## ⚙️ 配置选项

`BridgeOptions`：

```ts
export interface BridgeOptions {
  allowedOrigins?: string[];
  timeout?: number;
  debug?: boolean;
  messageValidator?: (message: any) => boolean;
}
```

Hook 参数（概念）：

- `mode: 'child'`：在 iframe 内自动连接 `window.parent`
- `mode: 'parent'`：需要传入 `iframe` 元素以连接 `iframe.contentWindow`

## 🧪 测试覆盖率

本仓库已配置 Vitest 覆盖率（`@vitest/coverage-v8`），输出目录为 `coverage/`。

运行测试：
```bash
npm test
```

查看覆盖率报告：
```bash
npm run test:coverage
```

覆盖率汇总（具体到文件）：

| 文件 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 |
|------|-----------|-----------|-----------|---------|
| src/bridge.ts | 90.32% | 77.08% | 100% | 90.32% |
| src/index.ts | 100% | 100% | 100% | 100% |
| src/react/useIframeBridge.ts | 84.14% | 88.88% | 100% | 84.14% |
| src/react/index.ts | 100% | 100% | 100% | 100% |
| **总计** | **89.12%** | **82.19%** | **100%** | **89.12%** |

说明：纯类型文件 src/types.ts 不参与覆盖率统计。

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 查看覆盖率
npm run test:coverage

# 类型检查
npm run type-check
```

## 📦 发布到 npm

```bash
# 1. 确保构建成功
npm run build

# 2. 确保测试通过
npm test

# 3. 更新版本号
npm version patch
npm version minor
npm version major

# 4. 发布
npm publish --access public
```

## 📂 项目结构

```
iframe-bridge/
├── src/
│   ├── __test__/
│   │   ├── iframeBridge.__test__.ts
│   │   └── useIframeBridge.__test__.ts
│   ├── react/
│   │   ├── useIframeBridge.ts
│   │   └── index.ts
│   ├── bridge.ts
│   ├── types.ts
│   └── index.ts
├── dist/                           # 构建输出
├── coverage/                        # 运行 test:coverage 后生成
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

## 🤝 贡献

如需贡献：

1. 修改/新增功能
2. 增加/更新单元测试
3. 运行 `npm test` 与 `npm run test:coverage`
4. 更新 README

## 📄 许可证

MIT

## 👥 贡献者

感谢以下贡献者对本项目的贡献：

<div style="display: flex; justify-content: center; align-items: flex-start; gap: 40px; flex-wrap: wrap;">
  <div style="text-align: center;">
    <a href="https://github.com/bugfix2020"><img src="https://github.com/bugfix2020.png?size=100" width="100px;" style="border-radius: 50%;border:1px solid #efefef;" alt="Yuxuan Liu"/></a>
    <br/>
    <a href="https://github.com/bugfix2020"><strong>Polaris</strong></a>
    <br/>
    <sub>📧 ts02315607@gmail.com</sub>
  </div>
</div>

## 🔗 相关链接

- [GitHub 仓库](https://github.com/bugfix2020/iframe-bridge)
- [Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Vitest](https://vitest.dev/)

## ❓ 常见问题

### Q: 是否支持 SSR？

A: 不支持。该库依赖 `window` 与 `postMessage`，仅支持浏览器环境。

### Q: 如何限制允许通信的来源？

A: 在 `BridgeOptions.allowedOrigins` 里设置白名单（推荐始终设置）。

### Q: 如何避免内存泄漏？

A: 在不再需要通信时调用 `destroy()`；React 中使用 Hook 时，组件卸载会自动清理。

---

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

---

**Made with ❤️ by [Polaris](https://github.com/bugfix2020)**
// 子窗口
try {
  const auth = await bridge.call('authenticate', { username, password });
  localStorage.setItem('token', auth.token);
} catch (error) {
  console.error('登录失败:', error);
}
```

### 3. 实时通知

```typescript
// 父窗口
const notifications = new EventSource('/notifications');
notifications.onmessage = (event) => {
  bridge.emit('notification', JSON.parse(event.data));
};

// 子窗口
bridge.on('notification', (notification) => {
  showNotification(notification);
});
```

## 安全注意事项

1. 始终指定明确的 `targetOrigin` 而不是使用 `'*'`
2. 设置 `allowedOrigins` 来限制允许通信的域名
3. 使用 HTTPS 来保护数据传输
4. 验证所有接收到的数据
5. 及时调用 `destroy()` 来清理资源

## 许可证

MIT
