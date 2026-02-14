import { useEffect, useState } from 'react';
import { getLeads } from '../../services/api';

const NotInterested = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getLeads();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setLeads(list.filter(l => l.status === 'not_interested'));
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Not Interested Leads</h2>
      <div className="p-6 bg-white rounded-lg shadow">
        {loading && <div>Loading leads...</div>}
        {error && <div className="text-red-600">{JSON.stringify(error)}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            {leads.length === 0 ? (
              <div>No leads marked as not interested.</div>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotInterested;
