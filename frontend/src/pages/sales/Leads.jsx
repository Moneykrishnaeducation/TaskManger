import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeads } from '../../services/api';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [indicatorLead, setIndicatorLead] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getLeads();
        if (mounted) setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data || err.message || 'Failed to load leads');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  const navigate = useNavigate();

  const handleLeadAction = (lead, action) => {
    if (!action) return;
    const labels = {
      follow_up: 'Follow up',
      not_interested: 'Not Interested',
      account_opening: 'Account Opening',
      indicator_sales: 'IndicatorSales',
    };

    if (action === 'account_opening') {
      // navigate to account opening page and pass the lead in location state
      // also set a one-time session flag so AccountOpening knows this came from Leads
      try { sessionStorage.setItem('selectedLead', JSON.stringify(lead)); } catch (e) {}
      try { sessionStorage.setItem('openAccountModal', '1'); } catch (e) {}
      navigate('/sales/account-opening', { state: { lead } });
      return;
    }

    if (action === 'not_interested') {
      // call backend to mark as not interested and update UI
      (async () => {
        try {
          const { setLeadStatus } = await import('../../services/api');
          const updated = await setLeadStatus(lead.id, 'not_interested');
          // update local state
          setLeads((prev) => prev.map(p => (p.id === updated.id ? updated : p)));
        } catch (err) {
          console.error('Failed to set not_interested', err);
          alert('Failed to update lead status');
        }
      })();
      return;
    }

    if (action === 'indicator_sales') {
      // open modal to upload payment proof
      setIndicatorLead(lead);
      setProofFile(null);
      setProofNotes('');
      setShowIndicatorModal(true);
      return;
    }

    if (action === 'follow_up') {
      setFollowUpLead(lead);
      setFollowUpDate('');
      setFollowUpNotes('');
      setShowFollowUpModal(true);
      return;
    }

    // placeholder for other actions
    alert(`Action "${labels[action] || action}" selected for lead ${lead.id}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Leads</h2>

      <div className="p-6 bg-white rounded-lg shadow">
        {loading && <div>Loading leads...</div>}
        {error && <div className="text-red-600">{JSON.stringify(error)}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            {leads.length === 0 ? (
              <div>No leads available.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">City</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-4 py-2">{l.id}</td>
                      <td className="px-4 py-2">{l.name || '-'}</td>
                      <td className="px-4 py-2">{l.email || '-'}</td>
                      <td className="px-4 py-2">{l.phone || '-'}</td>
                      <td className="px-4 py-2">{l.city || '-'}</td>
                      <td className="px-4 py-2">{l.status || '-'}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleLeadAction(l, 'follow_up')}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Next Follow Up
                          </button>
                          <button
                            onClick={() => handleLeadAction(l, 'not_interested')}
                            className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Not Interested
                          </button>
                          <button
                            onClick={() => handleLeadAction(l, 'account_opening')}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Account Opening
                          </button>
                          <button
                            onClick={() => handleLeadAction(l, 'indicator_sales')}
                            className="px-2 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                          >
                            IndicatorSales
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showIndicatorModal && indicatorLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Upload Payment Proof - Lead {indicatorLead.id}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">File</label>
                <input type="file" onChange={(e) => setProofFile(e.target.files[0])} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Notes (optional)</label>
                <textarea value={proofNotes} onChange={(e) => setProofNotes(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowIndicatorModal(false); setIndicatorLead(null); setProofFile(null); setProofNotes(''); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={async () => {
                  if (!proofFile) { alert('Please choose a file'); return; }
                  setUploading(true);
                  try {
                    const { uploadIndicatorProof } = await import('../../services/api');
                    const res = await uploadIndicatorProof(indicatorLead.id, proofFile, proofNotes);
                    // optionally update the lead or show success
                    setLeads(prev => prev.map(p => p.id === indicatorLead.id ? { ...p } : p));
                    alert('Upload successful');
                    setShowIndicatorModal(false);
                    setIndicatorLead(null);
                    setProofFile(null);
                    setProofNotes('');
                  } catch (err) {
                    console.error('Upload error', err);
                    alert('Upload failed: ' + (err?.response?.data?.error || err?.message || 'Unknown error'));
                  } finally {
                    setUploading(false);
                  }
                }} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFollowUpModal && followUpLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Schedule Next Follow Up - Lead {followUpLead.id}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Next Follow Up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Notes</label>
                <textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowFollowUpModal(false); setFollowUpLead(null); setFollowUpDate(''); setFollowUpNotes(''); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={async () => {
                  if (!followUpDate) { alert('Please choose a date'); return; }
                  try {
                    setUploading(true);
                    const { createFollowUp } = await import('../../services/api');
                    const res = await createFollowUp(followUpLead.id, followUpDate, followUpNotes);
                    alert('Follow up scheduled');
                    setShowFollowUpModal(false);
                    setFollowUpLead(null);
                    setFollowUpDate('');
                    setFollowUpNotes('');
                    // optional: navigate to follow ups page
                    // navigate('/sales/follow-ups');
                  } catch (err) {
                    console.error('FollowUp error', err);
                    alert('Failed to schedule follow up: ' + (err?.response?.data?.error || err?.message || 'Unknown error'));
                  } finally {
                    setUploading(false);
                  }
                }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">{uploading ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
