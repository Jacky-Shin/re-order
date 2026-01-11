# 测试文档

## 测试框架

项目使用以下测试框架：
- **Vitest** - 快速、现代的测试框架
- **React Testing Library** - React 组件测试工具
- **@testing-library/jest-dom** - 额外的 DOM 匹配器

## 运行测试

### 运行所有测试
```bash
cd client
npm test
```

### 运行测试（监听模式）
```bash
npm test
```
按 `a` 运行所有测试，按 `q` 退出

### 运行测试（UI模式）
```bash
npm run test:ui
```
在浏览器中打开测试 UI

### 运行测试（单次运行）
```bash
npm run test:run
```
运行一次所有测试并退出

### 生成测试覆盖率报告
```bash
npm run test:coverage
```

## 测试文件结构

```
client/src/
├── test/
│   ├── setup.ts          # 测试环境配置
│   └── mockData.ts       # 测试数据
├── services/
│   └── __tests__/
│       └── localApi.test.ts
├── contexts/
│   └── __tests__/
│       ├── CartContext.test.tsx
│       └── LanguageContext.test.tsx
└── utils/
    └── __tests__/
        └── storageSync.test.ts
```

## 已实现的测试

### Services 测试
- ✅ `localApi.test.ts` - 本地 API 服务测试
  - 菜单 API
  - 订单 API
  - 支付 API

### Contexts 测试
- ✅ `CartContext.test.tsx` - 购物车上下文测试
  - 初始化购物车
  - 计算总价
  - 计算商品数量
  - 添加到购物车
  - 清空购物车

- ✅ `LanguageContext.test.tsx` - 语言上下文测试
  - 语言检测
  - 语言切换
  - 翻译功能
  - 嵌套路径翻译
  - isAdmin 状态管理

### Utils 测试
- ✅ `storageSync.test.ts` - 存储同步工具测试
  - 设置存储同步
  - 监听数据库更新
  - 取消订阅

## 编写新测试

### 创建测试文件
测试文件应该放在与被测试文件相同的目录下，使用 `__tests__` 文件夹：

```typescript
// src/services/__tests__/myService.test.ts
import { describe, it, expect } from 'vitest';
import { myService } from '../myService';

describe('MyService', () => {
  it('应该执行某个操作', () => {
    const result = myService.doSomething();
    expect(result).toBe(expected);
  });
});
```

### 测试 React 组件
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('应该渲染组件', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### 测试 React Hooks
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('应该返回初始值', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });
});
```

## Mock 数据

测试数据定义在 `src/test/mockData.ts` 中：
- `mockCategory` - 分类数据
- `mockMenuItem` - 菜单项数据
- `mockCartItem` - 购物车项数据
- `mockOrder` - 订单数据
- `mockPayment` - 支付数据

## 测试最佳实践

1. **测试应该独立** - 每个测试不应该依赖其他测试
2. **使用描述性的测试名称** - 清楚说明测试的内容
3. **测试行为，不测试实现** - 关注功能是否正确，而不是内部实现
4. **使用 Mock** - 对于外部依赖（API、localStorage等）使用 Mock
5. **清理测试环境** - 使用 `beforeEach` 和 `afterEach` 清理状态

## 持续集成

测试可以在 CI/CD 流程中运行：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    cd client
    npm run test:run
```

## 故障排除

### 测试失败
1. 检查测试环境是否正确设置
2. 确保所有依赖已安装
3. 检查 Mock 数据是否正确

### 覆盖率问题
1. 确保测试覆盖了所有主要功能
2. 检查 `vitest.config.ts` 中的覆盖率配置
3. 排除不需要测试的文件（如配置文件）

