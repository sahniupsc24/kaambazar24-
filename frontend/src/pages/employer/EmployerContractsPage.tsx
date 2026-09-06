import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EMPLOYER_NAV_LINKS } from './EmployerDashboardPage';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';
import { ChatDrawer } from '../../components/ChatDrawer';
import { DisputeModal } from '../../components/DisputeModal';
import { MessageSquare, AlertCircle } from 'lucide-react';

function WorkReview({ contractId, compensationType, agreementRate }: { contractId: string; compensationType: string; agreementRate: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [manualAmount, setManualAmount] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    api.get(`/work-entries/contract/${contractId}/review`).then((res) => setEntries(res.data.data));
  }
  useEffect(load, [contractId]);

  async function approve(id: string) { await api.post(`/work-entries/${id}/approve`); load(); }
  async function reject(id: string) { await api.post(`/work-entries/${id}/reject`); load(); }

  async function createPayment() {
    setMsg('');
    try {
      await api.post('/payments', {
        contractId,
        workEntryIds: selected,
        manualAmount: compensationType === 'HOURLY' ? undefined : manualAmount,
      });
      setMsg('Payment created.');
      setSelected([]);
      load();
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? 'Could not create payment.');
    }
  }

  const approvedUnsettled = entries.filter((e) => e.status === 'APPROVED' && !e.isSettled);

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
      <p style={{ fontWeight: 600 }}>Work Entries</p>
      {entries.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No work entries submitted yet.</p>}
      <div style={{ display: 'grid', gap: 4 }}>
        {entries.map((e) => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span>
              {e.status === 'APPROVED' && !e.isSettled && (
                <input type="checkbox" checked={selected.includes(e.id)}
                  onChange={(ev) => setSelected(ev.target.checked ? [...selected, e.id] : selected.filter((id) => id !== e.id))}
                  style={{ marginRight: 6 }} />
              )}
              {e.workDate} — {e.hoursWorked}h {e.isSettled ? '(settled)' : ''}
              {e.checkInLat && e.checkInLng && (
                <span style={{ color: '#0d9488', marginLeft: 8, fontSize: 11, background: '#ccfbf1', padding: '2px 6px', borderRadius: 4 }}>
                  📍 GPS Logged
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <StatusBadge status={e.status} />
              {e.status === 'SUBMITTED' && (
                <>
                  <PrimaryButton onClick={() => approve(e.id)} style={{ padding: '4px 10px', fontSize: 12 }}>Approve</PrimaryButton>
                  <SecondaryButton onClick={() => reject(e.id)} style={{ padding: '4px 10px', fontSize: 12 }}>Reject</SecondaryButton>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {approvedUnsettled.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {compensationType !== 'HOURLY' && (
            <input placeholder="Amount (₹)" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #d1d5db', width: 120 }} />
          )}
          <PrimaryButton onClick={createPayment} disabled={selected.length === 0}>
            Settle Selected ({selected.length})
          </PrimaryButton>
          {msg && <span style={{ fontSize: 13 }}>{msg}</span>}
        </div>
      )}
    </div>
  );
}

export function EmployerContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null);
  const [activeDispute, setActiveDispute] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api.get('/contracts/mine')
      .then((res) => setContracts(res.data.data))
      .catch(() => setError('Could not load your contracts.'))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function send(id: string) { await api.post(`/contracts/${id}/send`); load(); }
  async function confirm(id: string) { await api.post(`/contracts/${id}/employer-confirm`); load(); }
  async function complete(id: string) { await api.post(`/contracts/${id}/complete`); load(); }
  async function terminate(id: string) {
    const reason = window.prompt('Reason for termination:');
    if (reason === null) return;
    await api.post(`/contracts/${id}/terminate`, { reason });
    load();
  }

  return (
    <DashboardLayout links={EMPLOYER_NAV_LINKS}>
      <h1>Contracts</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && contracts.length === 0 && <EmptyState label="No contracts yet." />}
      <div style={{ display: 'grid', gap: 12 }}>
        {contracts.map((c) => (
          <Card key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Contract {c.id.slice(0, 8)}</p>
                <p style={{ color: '#6b7280', margin: '4px 0' }}>{c.compensationType} · ₹{c.agreementRate}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {c.status === 'DRAFT' && <PrimaryButton onClick={() => send(c.id)}>Send to Worker</PrimaryButton>}
              {c.status === 'ACCEPTED' && <PrimaryButton onClick={() => confirm(c.id)}>Activate Contract</PrimaryButton>}
              
              {(c.status === 'ACTIVE' || c.status === 'ACCEPTED') && (
                <>
                  <SecondaryButton 
                    onClick={() => setActiveChat({ id: c.id, name: c.workerProfile?.user?.firstName || 'Worker' })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <MessageSquare size={16} /> Chat
                  </SecondaryButton>
                  <SecondaryButton 
                    onClick={() => setActiveDispute(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', borderColor: '#ef4444' }}
                  >
                    <AlertCircle size={16} /> Raise Dispute
                  </SecondaryButton>
                </>
              )}

              {c.status === 'ACTIVE' && (
                <>
                  <PrimaryButton onClick={() => complete(c.id)}>Mark Completed</PrimaryButton>
                  <SecondaryButton onClick={() => terminate(c.id)}>Terminate</SecondaryButton>
                </>
              )}
            </div>
            {c.status === 'ACTIVE' && (
              <WorkReview contractId={c.id} compensationType={c.compensationType} agreementRate={c.agreementRate} />
            )}
          </Card>
        ))}
      </div>

      {activeChat && (
        <ChatDrawer
          contractId={activeChat.id}
          otherPartyName={activeChat.name}
          isOpen={true}
          onClose={() => setActiveChat(null)}
        />
      )}

      {activeDispute && (
        <DisputeModal
          contractId={activeDispute}
          onClose={() => setActiveDispute(null)}
        />
      )}
    </DashboardLayout>
  );
}
