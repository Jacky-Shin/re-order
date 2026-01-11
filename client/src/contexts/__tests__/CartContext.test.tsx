import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { mockCartItem } from '../../test/mockData';
import { cartApi } from '../../api/client';

// Mock cartApi
vi.mock('../../api/client', () => ({
  cartApi: {
    get: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('应该初始化购物车', async () => {
    const mockCart = [mockCartItem];
    (cartApi.get as any).mockResolvedValue({ data: mockCart });

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.cart).toEqual(mockCart);
    });
  });

  it('应该计算总价', async () => {
    const mockCart = [mockCartItem];
    (cartApi.get as any).mockResolvedValue({ data: mockCart });

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      const total = result.current.getTotal();
      // 价格 = 25 * 2 = 50 (getTotal只计算基础价格，不包括size和customizations)
      expect(total).toBe(50);
    });
  });

  it('应该计算商品数量', async () => {
    const mockCart = [mockCartItem];
    (cartApi.get as any).mockResolvedValue({ data: mockCart });

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      const count = result.current.getItemCount();
      expect(count).toBe(2); // quantity = 2
    });
  });

  it('应该添加到购物车', async () => {
    const mockCart = [mockCartItem];
    (cartApi.get as any).mockResolvedValue({ data: [] });
    (cartApi.add as any).mockResolvedValue({ data: mockCart });

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addToCart(mockCartItem);
    });

    expect(cartApi.add).toHaveBeenCalled();
    expect(result.current.cart).toEqual(mockCart);
  });

  it('应该清空购物车', async () => {
    const mockCart = [mockCartItem];
    (cartApi.get as any).mockResolvedValue({ data: mockCart });
    (cartApi.clear as any).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.cart).toEqual(mockCart);
    });

    await act(async () => {
      await result.current.clearCart();
    });

    expect(cartApi.clear).toHaveBeenCalled();
    expect(result.current.cart).toEqual([]);
  });
});

