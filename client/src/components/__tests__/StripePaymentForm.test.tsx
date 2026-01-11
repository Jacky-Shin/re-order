import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StripePaymentForm from '../StripePaymentForm';
import { LanguageProvider } from '../../contexts/LanguageContext';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmCardPayment: vi.fn(),
  })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div>{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded',
      },
    }),
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({
      // Mock card element
    })),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        {component}
      </LanguageProvider>
    </BrowserRouter>
  );
};

describe('StripePaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_test123');
  });

  it('应该在没有配置Stripe密钥时显示模拟支付模式', () => {
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', '');
    
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const setProcessing = vi.fn();

    renderWithProviders(
      <StripePaymentForm
        amount={100}
        orderId="order-1"
        onSuccess={onSuccess}
        onError={onError}
        processing={false}
        setProcessing={setProcessing}
      />
    );

    expect(screen.getByText(/Stripe支付网关未配置/i)).toBeInTheDocument();
    expect(screen.getByText(/确认支付（模拟）/i)).toBeInTheDocument();
  });

  it('应该在配置了Stripe密钥时显示支付表单', () => {
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_test123');

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const setProcessing = vi.fn();

    renderWithProviders(
      <StripePaymentForm
        amount={100}
        orderId="order-1"
        onSuccess={onSuccess}
        onError={onError}
        processing={false}
        setProcessing={setProcessing}
      />
    );

    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('应该在处理中时禁用提交按钮', () => {
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_test123');

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const setProcessing = vi.fn();

    renderWithProviders(
      <StripePaymentForm
        amount={100}
        orderId="order-1"
        onSuccess={onSuccess}
        onError={onError}
        processing={true}
        setProcessing={setProcessing}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

