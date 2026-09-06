import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { PaymentModal } from '../components/PaymentModal';

interface Plan {
  id: string;
  name: string;
  audience: 'WORKER' | 'EMPLOYER';
  type: 'ONE_TIME' | 'SUBSCRIPTION';
  price: string;
  contactsIncluded: number | null;
  durationDays: number | null;
  isActive: boolean;
}

export const PricingPage: React.FC = () => {
  const [audience, setAudience] = useState<'WORKER' | 'EMPLOYER'>('EMPLOYER');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, [audience]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/plans?audience=${audience}`);
      setPlans(res.data.data || []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const defaultEmployerPlans: Plan[] = [
    {
      id: 'emp-starter',
      name: 'Hiring Starter Pack (स्मार्ट पैक)',
      audience: 'EMPLOYER',
      type: 'ONE_TIME',
      price: '199',
      contactsIncluded: 10,
      durationDays: null,
      isActive: true,
    },
    {
      id: 'emp-pro',
      name: 'Contractor Pro Membership (प्रो सब्सक्रिप्शन)',
      audience: 'EMPLOYER',
      type: 'SUBSCRIPTION',
      price: '499',
      contactsIncluded: null,
      durationDays: 30,
      isActive: true,
    },
    {
      id: 'emp-unlimited',
      name: 'Business Enterprise Pass (अनलिमिटेड पैक)',
      audience: 'EMPLOYER',
      type: 'SUBSCRIPTION',
      price: '999',
      contactsIncluded: null,
      durationDays: 90,
      isActive: true,
    },
  ];

  const defaultWorkerPlans: Plan[] = [
    {
      id: 'wrk-boost',
      name: 'Worker Boost Pass (कामगार बूस्ट)',
      audience: 'WORKER',
      type: 'ONE_TIME',
      price: '49',
      contactsIncluded: 5,
      durationDays: null,
      isActive: true,
    },
    {
      id: 'wrk-pro',
      name: 'Verified Worker Pro (गोल्ड पास)',
      audience: 'WORKER',
      type: 'SUBSCRIPTION',
      price: '149',
      contactsIncluded: null,
      durationDays: 30,
      isActive: true,
    },
  ];

  const displayPlans = plans.length > 0 ? plans : audience === 'EMPLOYER' ? defaultEmployerPlans : defaultWorkerPlans;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: '#2563eb',
              fontWeight: 700,
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            💎 FLEXIBLE PRICING & CONTACT PACKS
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            Choose Your Growth Plan (सही प्लान चुनें)
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Unlock verified phone numbers, direct hiring contacts, and priority search badges for seamless blue-collar hiring across India.
          </p>

          {/* Audience Toggle Switch */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '30px',
              padding: '4px',
              marginTop: '28px',
            }}
          >
            <button
              onClick={() => setAudience('EMPLOYER')}
              style={{
                padding: '10px 24px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: audience === 'EMPLOYER' ? '#2563eb' : 'transparent',
                color: audience === 'EMPLOYER' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🏢 For Employers / Contractors (ठेकेदार)
            </button>
            <button
              onClick={() => setAudience('WORKER')}
              style={{
                padding: '10px 24px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: audience === 'WORKER' ? '#2563eb' : 'transparent',
                color: audience === 'WORKER' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              👷 For Workers (कामगार)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {displayPlans.map((plan, index) => {
            const isFeatured = index === 1;
            return (
              <div
                key={plan.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: isFeatured ? '2px solid #2563eb' : '1px solid var(--border)',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: isFeatured ? '0 12px 24px rgba(37, 99, 235, 0.15)' : 'none',
                }}
              >
                {isFeatured && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '12px',
                      padding: '4px 16px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                    }}
                  >
                    MOST POPULAR (सर्वाधिक लोकप्रिय)
                  </span>
                )}

                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, color: '#2563eb' }}>₹{plan.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      {plan.type === 'ONE_TIME' ? '/ pack' : `/${plan.durationDays || 30} days`}
                    </span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '20px' }} />

                  {/* Feature Checklist */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: '14px', lineHeight: '2' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      {plan.type === 'ONE_TIME'
                        ? `${plan.contactsIncluded || 0} Direct Worker Contact Unlocks`
                        : `Unlimited Verified Contact Unlocks`}
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> Direct Call & WhatsApp Access
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> Verified Skill & Experience Badges
                    </li>
                    {audience === 'EMPLOYER' && (
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> Priority Job Listing Banner
                      </li>
                    )}
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> 24/7 Dedicated Support
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: isFeatured ? '#2563eb' : 'var(--bg-main)',
                    color: isFeatured ? '#ffffff' : 'var(--text-main)',
                    border: isFeatured ? 'none' : '1px solid var(--border)',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Buy Plan (अभी खरीदें)
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={selectedPlan}
        onSuccess={() => {
          alert('Subscription purchased successfully!');
        }}
      />
    </div>
  );
};
