// src/components/KeyZone/KeyHistory.jsx
import { useEffect, useState } from "react";
import api from "../../utils/axios";
import { Link } from "react-router-dom";

export default function KeyHistory() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await api.get('/keyzone/history');
      setItems(res.data.items || []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🗝 Key-Based Decryption — History</h2>
        <Link to="/key-decrypt" className="text-blue-600 hover:underline">← Back</Link>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Filename</th>
              <th className="py-2 px-3">Key Hash (SHA-256)</th>
              <th className="py-2 px-3">Result</th>
              <th className="py-2 px-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i._id} className="border-b">
                <td className="py-2 px-3">{new Date(i.createdAt).toLocaleString()}</td>
                <td className="py-2 px-3">{i.filename}</td>
                <td className="py-2 px-3 font-mono text-xs break-all">{i.keyHash}</td>
                <td className={`py-2 px-3 ${i.success ? 'text-green-600' : 'text-red-600'}`}>
                  {i.success ? 'Success' : 'Failed'}
                </td>
                <td className="py-2 px-3">{i.message}</td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="py-6 px-3 text-gray-500" colSpan={5}>No history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
