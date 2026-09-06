import React, { useState } from 'react';
import { api } from '../api/client';

interface PlanInfo {
  id: string;
  name: string;
  price: string;
  type: string;
  contactsIncluded?: number | null;
  durationDays?: number | null;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanInfo | null;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'netbanking'>('upi');

  if (!isOpen || !plan) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create order on backend
      const orderRes = await api.post('/payments/razorpay/create-order', {
        planId: plan.id,
        amount: parseFloat(plan.price),
      });

      const orderData = orderRes.data.data;

      // 2. If live Razorpay key is present and Razorpay SDK window is available, open Razorpay popup
      if (!orderData.isMock && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Kaam Bazar (काम बाज़ार)',
          description: `Subscription Payment for ${plan.name}`,
          order_id: orderData.id,
          handler: async (response: any) => {
            try {
              await api.post('/payments/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
              });
              setSuccess(true);
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 1500);
            } catch (err: any) {
              setError(err.response?.data?.message || 'Payment verification failed');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: 'User',
          },
          theme: {
            color: '#2563eb',
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

      // 3. Fallback / Mock Gateway Execution
      const mockPaymentId = `pay_mock_${Date.now()}`;
      await api.post('/payments/razorpay/verify', {
        razorpay_order_id: orderData.id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: 'mock_signature_valid',
        planId: plan.id,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          color: 'var(--text-main)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#166534',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '16px',
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Payment Successful!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Your plan <strong>{plan.name}</strong> is now active. Credits added to your account!
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Razorpay Secure Checkout</h3>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>🔒 256-Bit SSL Encryption</span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            {/* Plan Summary Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{plan.name}</span>
                <span style={{ fontWeight: 700, fontSize: '18px', color: '#2563eb' }}>₹{plan.price}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                {plan.type === 'ONE_TIME'
                  ? `${plan.contactsIncluded || 0} Contact Unlock Credits`
                  : `Unlimited Contact Access for ${plan.durationDays || 30} Days`}
              </p>
            </div>

            {/* Payment Options Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                SELECT PAYMENT METHOD
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'upi', label: 'UPI / GPay' },
                  { id: 'card', label: 'Debit/Credit' },
                  { id: 'netbanking', label: 'NetBanking' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id as any)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '8px',
                      border: paymentMode === mode.id ? '2px solid #2563eb' : '1px solid var(--border)',
                      backgroundColor: paymentMode === mode.id ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card)',
                      color: paymentMode === mode.id ? '#2563eb' : 'var(--text-main)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              {loading ? (
                'Processing Payment...'
              ) : (
                <>
                  <span>Pay ₹{plan.price} Now</span>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>⚡ Razorpay</span>
                </>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
              Instant activation • 100% Secure Transaction
            </p>
          </>
        )}
      </div>
    </div>
  );
};
