// src/components/KeyZone/KeyDecrypt.jsx
import { useState } from "react";
import api from "../../utils/axios";
import { Link } from "react-router-dom";

export default function KeyDecrypt() {
  const [file, setFile] = useState(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file || !key) return setError("File and key are required.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("key", key);
      const res = await api.post(`/keyzone/decrypt-by-key`, fd, { responseType: 'blob' });

      // trigger download
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (file.name || 'decrypted').replace(/\.enc$|$/i, '.decrypted');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Decryption failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🗝 Key-Based Decryption</h2>
        <Link to="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4 max-w-xl">
        <label className="block">
          <span className="text-sm font-medium">Encrypted file</span>
          <input type="file" className="mt-1 block w-full" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Secret key / hash</span>
          <input
            type="password"
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="Paste your key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>

        {error && <div className="text-red-600 text-sm">✖ {error}</div>}

        <button disabled={busy} className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60">
          {busy ? 'Decrypting…' : 'Decrypt'}
        </button>

        <div className="text-sm text-gray-500">
          We never store your raw key. A SHA-256 hash is kept in history for auditing.
        </div>
      </form>

      <div>
        <Link to="/key-decrypt/history" className="text-blue-600 hover:underline">View Key-Zone History →</Link>
      </div>
    </div>
  );
}
