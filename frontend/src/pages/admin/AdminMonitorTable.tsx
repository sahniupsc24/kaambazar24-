import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/Primitives';

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

export function AdminMonitorTable({ endpoint, columns, emptyLabel }: { endpoint: string; columns: Column[]; emptyLabel: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(endpoint)
      .then((res) => { setRows(res.data.data.items); setTotal(res.data.data.total); })
      .catch(() => setError('Could not load this data.'))
      .finally(() => setIsLoading(false));
  }, [endpoint]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (rows.length === 0) return <EmptyState label={emptyLabel} />;

  return (
    <div style={{ overflowX: 'auto' }}>
      <p style={{ color: '#6b7280', fontSize: 13 }}>{total} total records</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#6b7280' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: 8, borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                  {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
