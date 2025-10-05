import React, { useMemo, useState } from 'react';
import { MessageCircle, X, Key } from 'lucide-react';
import HelpChat from './HelpChat';
import VaultPage from '../Vault/VaultPage';
import { sha256Hex } from '../../utils/hash';
import api from '../../utils/axios';
import { useTheme } from '../../contexts/ThemeContext';

const ChatWidget = () => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat'); // 'chat' | 'vault'
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  // Lock background scroll when widget is open
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const vaultHash = useMemo(() => localStorage.getItem('vault_pass_hash') || '', []);
  const hasVault = !!vaultHash;

  const handleSetVault = async (pwd, confirm) => {
    if (!pwd || pwd.length < 6 || pwd !== confirm) return false;
    setBusy(true);
    try {
      // save local hash to allow quick client-side unlock visual
      const h = await sha256Hex(pwd);
      localStorage.setItem('vault_pass_hash', h);
      // also set on server
      await api.post('/vault/passphrase/set', { newPassphrase: pwd });
      setVaultUnlocked(true);
      return true;
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to set passphrase');
      return false;
    } finally { setBusy(false); }
  };

  const handleUnlockVault = async (pwd) => {
    setBusy(true);
    try {
      // first check server verification
      const verify = await api.post('/vault/passphrase/verify', { passphrase: pwd });
      if (verify.data?.success) {
        const h = await sha256Hex(pwd);
        localStorage.setItem('vault_pass_hash', h);
        setVaultUnlocked(true);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally { setBusy(false); }
  };

  const onChatCommand = async (text, append) => {
    // Commands:
    // /vault-set <password>
    // /vault <password>
    const trimmed = text.trim();
    if (trimmed.startsWith('/vault-set ')) {
      const pwd = trimmed.slice('/vault-set '.length).trim();
      if (!pwd) { append('Provide a password: /vault-set <password>'); return true; }
      const ok = await handleSetVault(pwd, pwd);
      append(ok ? 'Vault password set and unlocked.' : 'Failed to set vault password. Ensure it has 6+ characters.');
      if (ok) setTab('vault');
      return true;
    }
    if (trimmed.startsWith('/vault ')) {
      const pwd = trimmed.slice('/vault '.length).trim();
      if (!pwd) { append('Provide password: /vault <password>'); return true; }
      const ok = await handleUnlockVault(pwd);
      append(ok ? 'Vault unlocked.' : 'Invalid vault password.');
      if (ok) setTab('vault');
      return true;
    }
    return false;
  };

  const VaultGate = () => {
    // Hooks must be declared unconditionally at the top
    const [pwd, setPwd] = useState('');
    const [confirm, setConfirm] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    const sendOtp = async ()=>{
      try { await api.post('/vault/passphrase/forgot/start'); setOtpSent(true); alert('OTP sent to your account email'); } catch(e){ alert('Failed to send OTP'); }
    };
    const resetPass = async ()=>{
      if (!otp || !pwd) { alert('Enter OTP and new password'); return; }
      try { const r = await api.post('/vault/passphrase/forgot/verify', { otp, newPassphrase: pwd }); if (r.data?.success){ alert('Passphrase reset. Please unlock again.'); setOtp(''); setPwd(''); setOtpSent(false); } else { alert('Invalid OTP'); } } catch(e){ alert('Reset failed'); }
    };

    if (!hasVault && !vaultUnlocked) {
      return (
        <div className="space-y-3">
          <h3 className={`font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Create Vault Password</h3>
          <input 
            type="password" 
            className={`w-full border p-2 rounded transition-colors ${
              isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`} 
            placeholder="Password (min 6 chars)" 
            value={pwd} 
            onChange={(e)=>setPwd(e.target.value)} 
          />
          <input 
            type="password" 
            className={`w-full border p-2 rounded transition-colors ${
              isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`} 
            placeholder="Confirm Password" 
            value={confirm} 
            onChange={(e)=>setConfirm(e.target.value)} 
          />
          <button 
            disabled={busy} 
            onClick={async ()=>{ const ok = await handleSetVault(pwd, confirm); if (!ok) alert('Passwords must match and be 6+ chars'); }} 
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Set Password
          </button>
          <p className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>Tip: You can also set it from chat: /vault-set &lt;password&gt;</p>
        </div>
      );
    }
    if (!vaultUnlocked) {
      return (
        <div className="space-y-3">
          <h3 className={`font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Unlock Vault</h3>
          <input 
            type="password" 
            className={`w-full border p-2 rounded transition-colors ${
              isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`} 
            placeholder="Vault password" 
            value={pwd} 
            onChange={(e)=>setPwd(e.target.value)} 
          />
          <div className="flex gap-2">
            <button 
              disabled={busy} 
              onClick={async ()=>{ const ok = await handleUnlockVault(pwd); if (!ok) alert('Invalid password'); }} 
              className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700 transition-colors"
            >
              Unlock
            </button>
            <button 
              onClick={()=>setPwd('')} 
              className={`px-4 py-2 rounded transition-colors ${
                isDark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Clear
            </button>
            <button 
              onClick={sendOtp} 
              className={`px-4 py-2 rounded transition-colors ${
                isDark ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Forgot?
            </button>
          </div>
          {otpSent && (
            <div className={`space-y-2 border rounded p-2 ${
              isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}>
              <input 
                type="text" 
                className={`w-full border p-2 rounded transition-colors ${
                  isDark ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`} 
                placeholder="Enter OTP" 
                value={otp} 
                onChange={(e)=>setOtp(e.target.value)} 
              />
              <button 
                onClick={resetPass} 
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Set New Password
              </button>
            </div>
          )}
          <p className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>Tip: Unlock from chat with /vault &lt;password&gt;</p>
        </div>
      );
    }
    return (
        <div className="-m-2">
          <div className="flex justify-end mb-2">
            <button 
              onClick={()=>setVaultUnlocked(false)} 
              className={`text-sm transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Lock
            </button>
          </div>
        <div style={{ height: '60vh', overflow: 'auto' }}>
          <VaultPage />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={()=>setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center"
        aria-label="Open Deekshi"
      >
        <MessageCircle size={24} />
      </button>

      {/* Overlay & Panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={()=>setOpen(false)}></div>
          <div className={`fixed bottom-6 right-6 z-50 w-[95vw] ${tab==='vault' && vaultUnlocked ? 'max-w-5xl' : 'max-w-md'} rounded-2xl shadow-2xl p-4 border transition-all duration-300 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-2">
                <button 
                  onClick={()=>setTab('chat')} 
                  className={`px-3 py-1 rounded transition-colors ${
                    tab==='chat'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Deekshi
                </button>
                <button 
                  onClick={()=>setTab('vault')} 
                  className={`px-3 py-1 rounded transition-colors ${
                    tab==='vault'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Key size={14} className="inline mr-1" /> Vault
                </button>
              </div>
              <button 
                onClick={()=>setOpen(false)} 
                className={`transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                <X />
              </button>
            </div>
            <div style={{ maxHeight: `${tab==='vault' && vaultUnlocked ? '80vh' : '70vh'}`, overflow: 'auto' }}>
              {tab==='chat' ? (
                <HelpChat onCommand={onChatCommand} />
              ) : (
                <VaultGate />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ChatWidget;