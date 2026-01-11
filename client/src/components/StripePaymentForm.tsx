import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useLanguage } from '../contexts/LanguageContext';

// 初始化Stripe（使用发布密钥）
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripePaymentFormProps {
  amount: number;
  orderId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

function PaymentForm({
  amount,
  orderId,
  onSuccess,
  onError,
  processing,
  setProcessing,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // 1. 创建支付意图
      const createIntentResponse = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'USD',
          orderId,
        }),
      });

      if (!createIntentResponse.ok) {
        const errorData = await createIntentResponse.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await createIntentResponse.json();

      // 2. 确认支付
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement as any, // Type assertion for CardElement
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // 3. 确认支付并获取详细信息
        const confirmResponse = await fetch('/api/payment/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId,
          }),
        });

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm payment');
        }

        onSuccess(paymentIntent.id);
      } else {
        throw new Error(`Payment status: ${paymentIntent?.status}`);
      }
    } catch (error: any) {
      console.error('支付失败:', error);
      onError(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-300">
        <CardElement options={cardElementOptions} />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          !stripe || processing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-sb-green text-white hover:bg-opacity-90'
        }`}
      >
        {processing ? t('payment.processing') : t('common.confirm')}
      </button>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p>🔒 您的支付信息已加密，安全可靠。支持Visa、Mastercard等国际卡。</p>
      </div>
    </form>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  // 如果没有配置Stripe密钥，回退到模拟支付
  if (!stripePublishableKey || stripePublishableKey === '') {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm mb-2">
            ⚠️ Stripe支付网关未配置，当前使用模拟支付模式。
          </p>
          <p className="text-yellow-700 text-xs">
            要启用真实支付，请在Vercel环境变量中设置：
            <br />
            • VITE_STRIPE_PUBLISHABLE_KEY (前端)
            <br />
            • STRIPE_SECRET_KEY (后端API)
          </p>
        </div>
        <button
          onClick={async () => {
            // 模拟支付处理
            props.setProcessing(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟延迟
              props.onSuccess('mock_payment_' + Date.now());
            } catch (error: any) {
              props.onError(error.message || 'Payment failed');
            } finally {
              props.setProcessing(false);
            }
          }}
          disabled={props.processing}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            props.processing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-sb-green text-white hover:bg-opacity-90'
          }`}
        >
          {props.processing ? '处理中...' : '确认支付（模拟）'}
        </button>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}
