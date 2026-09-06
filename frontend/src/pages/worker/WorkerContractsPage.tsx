import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';
import { WorkContract, WorkEntry } from '../../types';
import { ChatDrawer } from '../../components/ChatDrawer';
import { DisputeModal } from '../../components/DisputeModal';
import { MessageSquare, AlertCircle } from 'lucide-react';

function WorkEntryForm({ contractId, onSubmitted }: { contractId: string; onSubmitted: () => void }) {
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('8');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setIsSubmitting(true);
    setError('');
    
    let gpsCoords = {};
    try {
      if ('geolocation' in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        gpsCoords = {
          checkInLat: pos.coords.latitude,
          checkInLng: pos.coords.longitude,
          checkInAccuracy: pos.coords.accuracy
        };
      }
    } catch (err) {
      console.warn('Geolocation failed:', err);
    }

    try {
      await api.post(`/work-entries/contract/${contractId}`, {
        workDate, hoursWorked: Number(hours), workerNotes: notes || undefined, ...gpsCoords
      });
      setNotes('');
      onSubmitted();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit work entry.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
      <input type="date" value={workDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setWorkDate(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} />
      <input type="number" min={0.5} max={24} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: 80, padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} />
      <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} />
      <PrimaryButton type="button" onClick={submit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Log Work'}</PrimaryButton>
      {error && <span style={{ color: '#b91c1c', fontSize: 13 }}>{error}</span>}
    </div>
  );
}

export function WorkerContractsPage() {
  const [contracts, setContracts] = useState<WorkContract[]>([]);
  const [entriesByContract, setEntriesByContract] = useState<Record<string, WorkEntry[]>>({});
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

  async function loadEntries(contractId: string) {
    const res = await api.get(`/work-entries/contract/${contractId}/mine`);
    setEntriesByContract((prev) => ({ ...prev, [contractId]: res.data.data }));
  }

  async function acceptContract(id: string) {
    try {
      await api.post(`/contracts/${id}/worker-accept`);
      load();
    } catch {
      setError('Could not accept this contract.');
    }
  }

  return (
    <DashboardLayout links={WORKER_NAV_LINKS}>
      <h1>My Contracts</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && contracts.length === 0 && <EmptyState label="No contracts yet." />}
      <div style={{ display: 'grid', gap: 12 }}>
        {contracts.map((c) => (
          <Card key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Contract {c.id.slice(0, 8)}</p>
                <p style={{ color: '#6b7280', margin: '4px 0' }}>
                  {c.compensationType} · ₹{c.agreementRate}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>

            {c.status === 'SENT' && (
              <div style={{ marginTop: 8 }}>
                <PrimaryButton onClick={() => acceptContract(c.id)}>Accept Contract</PrimaryButton>
              </div>
            )}

            {(c.status === 'ACTIVE' || c.status === 'ACCEPTED') && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <SecondaryButton 
                  onClick={() => setActiveChat({ id: c.id, name: (c as any).job?.employerProfile?.businessName || 'Employer' })}
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
              </div>
            )}

            {c.status === 'ACTIVE' && (
              <div style={{ marginTop: 12, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Log Today's Work</p>
                <WorkEntryForm contractId={c.id} onSubmitted={() => loadEntries(c.id)} />
                <button
                  onClick={() => loadEntries(c.id)}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
                >
                  View my work entries
                </button>
                {entriesByContract[c.id] && (
                  <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                    {entriesByContract[c.id].length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No entries yet.</p>}
                    {entriesByContract[c.id].map((e) => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>{e.workDate} — {e.hoursWorked}h</span>
                        <StatusBadge status={e.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
