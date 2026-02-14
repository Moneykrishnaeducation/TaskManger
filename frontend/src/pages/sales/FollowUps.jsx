import { useEffect, useState } from 'react';
import { getFollowUps } from '../../services/api';

const FollowUps = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getFollowUps();
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data || err.message || 'Failed to load follow ups');
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
      <h2 className="text-2xl font-bold mb-4">Follow Ups</h2>
      <div className="p-6 bg-white rounded-lg shadow">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{JSON.stringify(error)}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            {items.length === 0 ? (
              <div>No follow ups scheduled.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Lead</th>
                    <th className="px-4 py-2 text-left">Scheduled Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-left">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="px-4 py-2">{f.id}</td>
                      <td className="px-4 py-2">{f.lead_info?.name || `Lead ${f.lead}`}</td>
                      <td className="px-4 py-2">{f.scheduled_date}</td>
                      <td className="px-4 py-2">{f.notes || '-'}</td>
                      <td className="px-4 py-2">{f.created_by_username || '-'}</td>
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

export default FollowUps;
