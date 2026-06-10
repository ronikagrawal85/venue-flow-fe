import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../api/audit-logs';
import { FileText } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import type { AuditLog } from '../../types';
import '../../styles/audit-logs.css';

const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT', 'REGISTER'];
const ENTITIES = ['', 'User', 'Booking', 'Venue', 'Event'];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (action) params.action = action;
      if (entityType) params.entityType = entityType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await getAuditLogs(params as any);
      setLogs(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, action, entityType, dateFrom, dateTo]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">System-wide activity trail for all actions</p>
        </div>
      </div>

      <div className="audit-filters">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {ACTIONS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
          <option value="">All Entities</option>
          {ENTITIES.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} placeholder="To" />
      </div>

      {loading ? <LoadingSpinner /> : logs.length === 0 ? (
        <EmptyState icon={FileText} title="No audit logs found" text="Adjust your filters or check back later." />
      ) : (
        <>
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                    <td>
                      <span className={`audit-action-badge ${log.action.toLowerCase()}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="audit-entity-type">{log.entityType}</span>
                      {log.entityId && (
                        <div className="audit-entity-id">{log.entityId.slice(0, 8)}…</div>
                      )}
                    </td>
                    <td>
                      {log.userEmail || (log.userId ? log.userId.slice(0, 8) + '…' : '—')}
                    </td>
                    <td>
                      {log.changes ? (
                        <div className="audit-changes">
                          {JSON.stringify(log.changes, null, 2)}
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
