import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLeads } from '../../services/api';

const AccountOpening = () => {
  const { state } = useLocation();
  const [lead, setLead] = useState(state?.lead || null);
  const [deposit, setDeposit] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // prefer location state. If navigated from Leads we also set a one-time
    // session flag `openAccountModal` so we can auto-open after refresh.
    if (state?.lead) {
      try { sessionStorage.setItem('selectedLead', JSON.stringify(state.lead)); } catch (e) {}
      try { sessionStorage.setItem('openAccountModal', '1'); } catch (e) {}
      setLead(state.lead);
      setDeposit('');
      setMessage(null);
      setShowModal(true);
      return;
    }

    try {
      const stored = sessionStorage.getItem('selectedLead');
      const shouldOpen = sessionStorage.getItem('openAccountModal');
      if (stored) {
        setLead(JSON.parse(stored));
        setDeposit('');
        setMessage(null);
        // only auto-open the modal when the one-time flag is present
        if (shouldOpen === '1') {
          setShowModal(true);
          try { sessionStorage.removeItem('openAccountModal'); } catch (e) {}
        }
      }
    } catch (e) {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getLeads();
        if (!mounted) return;
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data || err.message || 'Failed to load leads');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // call backend to persist deposit for this lead
      const { createAccountOpening } = await import('../../services/api');
      const data = await createAccountOpening(lead.id, deposit || 0);
      setMessage({ type: 'success', text: `Saved deposit ${data.deposit_amount || deposit || '0'} for lead ${lead?.id || 'N/A'}` });
      setDeposit('');
      // clear one-time flags and selected lead after successful save
      try { sessionStorage.removeItem('selectedLead'); } catch (e) {}
      try { sessionStorage.removeItem('openAccountModal'); } catch (e) {}
      setShowModal(false);
    } catch (err) {
      console.error('Account opening save error', err);
      const serverMsg = err?.response?.data?.error || err?.response?.data || err?.message || 'Failed to save deposit';
      setMessage({ type: 'error', text: typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Account Opening</h2>
        <p className="text-gray-600">Create an account opening for a lead and record deposit amount.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Leads</h3>
        {loading && <div>Loading leads...</div>}
        {error && <div className="text-red-600">{JSON.stringify(error)}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto mb-6">
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
                        <button
                          onClick={() => {
                            setLead(l);
                            try { sessionStorage.setItem('selectedLead', JSON.stringify(l)); } catch (e) {}
                              setShowModal(true);
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {lead ? null : (
          <div className="p-6 bg-gray-50 rounded">No lead selected. Open this page from Leads &gt; Account Opening.</div>
        )}
      </div>

        {/* Modal for lead details + deposit */}
        {showModal && lead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account Opening - Lead {lead.id}</h2>

              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{lead.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{lead.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{lead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-medium">{lead.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{lead.status || '-'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Deposit Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter deposit amount"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setDeposit(''); setMessage(null); }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Save Deposit
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default AccountOpening;
