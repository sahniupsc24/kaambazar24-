import { useState } from 'react';
import { api } from '../api/client';
import { X } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './common/Primitives';

interface DisputeModalProps {
  contractId: string;
  onClose: () => void;
}

export function DisputeModal({ contractId, onClose }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the dispute.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/disputes', { contractId, reason });
      alert('Dispute raised successfully. Admin will review it shortly.');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not raise dispute.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} 
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-card)',
          width: '90%',
          maxWidth: 450,
          borderRadius: 12,
          padding: 24,
          zIndex: 1001,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Raise Dispute</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
          Our Admin Dispute Desk will review your case. Please provide as much detail as possible.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Reason for Dispute *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the issue with the contract or payment..."
              rows={4}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                outline: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={isLoading} style={{ background: '#ef4444' }}>
              {isLoading ? 'Submitting...' : 'Submit Dispute'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  );
}
