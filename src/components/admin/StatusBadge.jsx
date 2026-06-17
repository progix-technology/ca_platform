import { Clock, DollarSign, Loader2, FileText, CheckCircle2, RefreshCcw } from 'lucide-react';
import { normalizeWorkflowStatus } from '../../utils/adminUtils';

export default function StatusBadge({ status }) {
  const normalizedStatus = normalizeWorkflowStatus(status);
  if (String(status).trim().toLowerCase() === 'rejected') {
    return <span className="badge bg-rose-100 text-rose-700">Rejected</span>;
  }
  const map = {
    submitted: <span className="badge-pending"><Clock size={10} /> Submitted</span>,
    paid: <span className="badge bg-blue-100 text-blue-700"><DollarSign size={10} /> Paid</span>,
    inprogress: <span className="badge bg-indigo-100 text-indigo-700"><Loader2 size={10} className="animate-spin" /> In Progress</span>,
    filed: <span className="badge bg-fuchsia-100 text-fuchsia-700"><FileText size={10} /> Filed</span>,
    inreview: <span className="badge-inprogress"><Loader2 size={10} className="animate-spin" /> In Review</span>,
    actionneeded: <span className="badge bg-amber-100 text-amber-700">Action Needed</span>,
    rejected: <span className="badge bg-rose-100 text-rose-700">Rejected</span>,
    approved: <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} /> Approved</span>,
    completed: <span className="badge-completed"><CheckCircle2 size={10} /> Completed</span>,
    servicerenewing: <span className="badge bg-blue-100 text-blue-700"><RefreshCcw size={10} /> Service Renewing</span>,
    renewed: <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} /> Renewed</span>,
  };
  return map[normalizedStatus] || <span className="badge bg-slate-100 text-slate-600">{status}</span>;
}
