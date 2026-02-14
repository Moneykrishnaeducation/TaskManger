import { useState } from 'react';
import { uploadLeadsCSV } from '../../services/api';

export default function AdminManageLeads() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus(null);
  };

  const handleUpload = async () => {
    if (!file) return setStatus({ error: 'Please select a CSV file' });
    setStatus({ loading: true });
    try {
      const res = await uploadLeadsCSV(file);
      setStatus({ success: true, data: res });
    } catch (err) {
      setStatus({ error: err.response?.data || err.message || 'Upload failed' });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Manage Leads (Admin)</h2>

      <div className="bg-white shadow rounded p-4">
        <p className="mb-2">Upload a CSV file with columns: <strong>Name, Mail-id (or Email), Number (or Phone), City</strong></p>
        <input type="file" accept=".csv" onChange={handleFile} />
        <div className="mt-4">
          <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded">Upload CSV</button>
        </div>

        <div className="mt-4">
          {status?.loading && <div>Uploading...</div>}
          {status?.error && <div className="text-red-600">{JSON.stringify(status.error)}</div>}
          {status?.success && (
            <div className="text-green-600">
              Uploaded. Created: {status.data.created}, Skipped: {status.data.skipped}
              {status.data.errors && status.data.errors.length > 0 && (
                <div className="mt-2">Errors: <pre className="text-xs">{JSON.stringify(status.data.errors, null, 2)}</pre></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
