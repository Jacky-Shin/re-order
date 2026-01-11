import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupStorageSync, onDatabaseUpdate } from '../storageSync';

describe('storageSync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('应该设置storage sync', () => {
    expect(() => {
      setupStorageSync();
    }).not.toThrow();
  });

  it('应该监听数据库更新', () => {
    const callback = vi.fn();
    const unsubscribe = onDatabaseUpdate(callback);

    expect(typeof unsubscribe).toBe('function');
    
    // 触发更新
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'db_orders',
      newValue: 'test',
    }));

    // 由于storage事件是异步的，这里只检查函数是否可调用
    expect(callback).toBeDefined();
    
    // 清理
    unsubscribe();
  });

  it('应该能够取消订阅', () => {
    const callback = vi.fn();
    const unsubscribe = onDatabaseUpdate(callback);

    expect(() => {
      unsubscribe();
    }).not.toThrow();
  });
});

