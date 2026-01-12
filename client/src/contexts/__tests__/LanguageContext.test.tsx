import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../LanguageContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.language
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US',
});

describe('LanguageContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('应该默认使用浏览器语言', () => {
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'es-ES',
    });

    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.language).toBe('es');
  });

  it('应该切换语言', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');
  });

  it('应该提供翻译功能', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('es');
    });

    const translation = result.current.t('common.loading');
    expect(translation).toBeDefined();
    expect(typeof translation).toBe('string');
  });

  it('应该支持嵌套路径翻译', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('es');
    });

    const translation = result.current.t('order.status.pending');
    expect(translation).toBeDefined();
  });

  it('应该设置和获取isAdmin状态', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.isAdmin).toBe(false);

    act(() => {
      result.current.setIsAdmin(true);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('商家后台应该保存语言选择到localStorage', async () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    await act(async () => {
      result.current.setIsAdmin(true);
    });

    await act(async () => {
      result.current.setLanguage('es');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('adminLanguage', 'es');
  });
});

