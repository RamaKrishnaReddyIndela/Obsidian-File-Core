import React, { useEffect, useState } from 'react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const VaultPage = () => {
  const { isDark } = useTheme();
  const [secrets, setSecrets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState({ type:'other', title:'', description:'', secretText:'' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/vault/secrets');
      setSecrets(res.data.secrets || []);
    } catch (err) {
      toast.error('Failed to load secrets');
    }
  };

  useEffect(()=>{ load(); },[]);

  const create = async () => {
    try {
      const metadataObj = creating.description ? { description: creating.description } : {};
      const dataObj = creating.secretText ? { text: creating.secretText } : {};
      const autoTitle = creating.title && creating.title.trim().length > 0
        ? creating.title.trim()
        : (creating.secretText?.trim()?.slice(0, 30) || creating.description?.trim()?.slice(0, 30) || `${creating.type} secret ${new Date().toLocaleString()}`);
      setLoading(true);
      const res = await api.post('/vault/secret', { type: creating.type, title: autoTitle, metadata: metadataObj, data: dataObj });
      toast.success('Secret created');
      setCreating({ type:'other', title:'', description:'', secretText:'' });
      // Optimistic update in case list fetch is delayed
      try { setSecrets(prev => [{ _id: res.data?.secret?.id || Math.random().toString(36), type: creating.type, title: autoTitle, updatedAt: new Date().toISOString() }, ...prev]); } catch {}
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create secret';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const open = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/vault/secret/${id}`);
      setSelected(res.data);
    } catch (err) {
      toast.error('Failed to open secret');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/vault/secret/${id}`);
      toast.success('Secret deleted');
      setSelected(null);
      await load();
    } catch (err) {
      toast.error('Failed to delete secret');
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Create */}
      <div className={`rounded-2xl shadow p-4 transition-colors ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Add Secret</h2>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select 
            className={`border p-2 rounded transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`} 
            value={creating.type} 
            onChange={(e)=>setCreating((p)=>({...p,type:e.target.value}))}
          >
            <option value="card">Card</option>
            <option value="finance">Finance</option>
            <option value="credential">Credential</option>
            <option value="company">Company</option>
            <option value="note">Note</option>
            <option value="file">File</option>
            <option value="other">Other</option>
          </select>
          <input 
            className={`border p-2 rounded transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`} 
            placeholder="Title" 
            value={creating.title} 
            onChange={(e)=>setCreating((p)=>({...p,title:e.target.value}))} 
          />
        </div>
        <label className={`block text-sm mb-1 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>Description (optional)</label>
        <input 
          className={`w-full border p-2 rounded mb-2 transition-colors ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`} 
          placeholder="Short description or notes" 
          value={creating.description} 
          onChange={(e)=>setCreating((p)=>({...p,description:e.target.value}))} 
        />
        <label className={`block text-sm mb-1 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>Secret</label>
        <textarea 
          className={`w-full border p-2 rounded mb-2 h-32 transition-colors ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`} 
          placeholder="Enter your secret text..." 
          value={creating.secretText} 
          onChange={(e)=>setCreating((p)=>({...p,secretText:e.target.value}))}
        ></textarea>
        <button 
          disabled={loading} 
          onClick={create} 
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          Create
        </button>
      </div>

      {/* List + View */}
      <div className={`rounded-2xl shadow p-4 transition-colors ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Your Secrets</h2>
        <div className={`max-h-64 overflow-y-auto divide-y transition-colors ${
          isDark ? 'divide-gray-700' : 'divide-gray-200'
        }`}>
          {secrets.map(s => (
            <div key={s._id} className="flex items-center justify-between py-2">
              <div>
                <div className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{s.title}</div>
                <div className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>{s.type} • {new Date(s.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  className={`px-2 py-1 text-sm rounded transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`} 
                  onClick={()=>open(s._id)}
                >
                  Open
                </button>
                <button 
                  className={`px-2 py-1 text-sm rounded transition-colors ${
                    isDark 
                      ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`} 
                  onClick={()=>remove(s._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {secrets.length===0 && (
            <div className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>No secrets yet</div>
          )}
        </div>

        {selected && (
          <div className={`mt-4 border-t pt-3 transition-colors ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>{selected.title}</div>
            <div className={`text-xs mb-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>{selected.type}</div>
            {selected.metadata?.description && (
              <>
                <div className={`text-sm mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Description:</div>
                <div className={`p-2 rounded text-sm whitespace-pre-wrap transition-colors ${
                  isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'
                }`}>{selected.metadata.description}</div>
              </>
            )}
            <div className={`text-sm mt-3 mb-1 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>Secret:</div>
            <div className={`p-2 rounded text-sm whitespace-pre-wrap transition-colors ${
              isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'
            }`}>{selected.data?.text || JSON.stringify(selected.data, null, 2)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultPage;