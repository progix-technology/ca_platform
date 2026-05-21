
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { requestAPI, downloadInvoice } from '../services/api';
import Button from '../components/Button';
import CompletedRequestModal from '../components/CompletedRequestModal';


export default function CompletedList() {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdFromUrl = searchParams.get('requestId');


  useEffect(() => {
    const fetchCompleted = async () => {
      setLoading(true);
      try {
        const res = await requestAPI.getArchivedCompleted();
        setCompleted(res.data?.data?.items || []);
      } catch (err) {
        setCompleted([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  useEffect(() => {
    if (!requestIdFromUrl || modalOpen) return;

    const openRequestFromQuery = async () => {
      setModalLoading(true);
      setModalOpen(true);
      try {
        const res = await requestAPI.getById(requestIdFromUrl);
        const data = res.data?.data?.request || null;
        if (data) {
          data.onDownloadInvoice = handleDownloadInvoice;
        }
        setSelectedRequest(data);
      } catch (err) {
        setSelectedRequest(null);
      } finally {
        setModalLoading(false);
      }
    };

    openRequestFromQuery();
  }, [requestIdFromUrl, modalOpen]);

  // Handler to open modal and fetch details if needed
  const handleRowClick = async (req) => {
    setModalLoading(true);
    setModalOpen(true);
    try {
      // Fetch latest details for the request (in case data is partial)
      const res = await requestAPI.getById(req._id);
      const data = res.data?.data?.request || req;
      // Attach invoice download handler
      data.onDownloadInvoice = handleDownloadInvoice;
      setSelectedRequest(data);
    } catch (err) {
      const fallback = { ...req, onDownloadInvoice: handleDownloadInvoice };
      setSelectedRequest(fallback);
    } finally {
      setModalLoading(false);
    }
  };

  // Handler for invoice download
  const handleDownloadInvoice = async (requestId) => {
    try {
      const res = await downloadInvoice(requestId);
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = res.headers['content-disposition'] || '';
      const matchedFilename = contentDisposition.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/i);
      const filename = matchedFilename ? decodeURIComponent(matchedFilename[1] || matchedFilename[2]) : `Invoice-${requestId}.pdf`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-slate-900">Completed Requests</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">Request ID</th>
                <th className="table-head">Service</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Completed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
              ) : completed.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">No completed requests yet.</td></tr>
              ) : completed.map((req) => (
                <tr
                  key={req._id}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleRowClick(req)}
                >
                  <td className="table-cell font-mono text-xs text-slate-500">REQ-{String(req._id).slice(-6).toUpperCase()}</td>
                  <td className="table-cell font-medium text-slate-800">{req.service?.title || '-'}</td>
                  <td className="table-cell font-semibold">₹{Number(req.service?.price || 0).toLocaleString('en-IN')}</td>
                  <td className="table-cell text-slate-500">{req.updatedAt ? new Date(req.updatedAt).toLocaleString('en-IN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for completed request details */}
      <CompletedRequestModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRequest(null);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('requestId');
            return next;
          });
        }}
        request={selectedRequest}
        loading={modalLoading}
      />
    </div>
  );
}
