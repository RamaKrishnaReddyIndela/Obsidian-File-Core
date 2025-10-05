import React, { useState } from 'react';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const HelpChat = ({ onCommand }) => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am Deekshi, your Obsidian File Core assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    // Intercept commands (like /vault <password>) if provided
    if (typeof onCommand === 'function') {
      try {
        const handled = await onCommand(text, (replyText) => {
          setMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
        });
        if (handled) { setLoading(false); return; }
      } catch (e) {}
    }
    try {
      const res = await api.post('/ai/chat', { message: text });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`max-w-2xl mx-auto mt-8 rounded-2xl shadow p-4 flex flex-col h-[70vh] transition-colors ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`p-3 rounded-lg max-w-[80%] transition-colors ${
            m.role === 'user' 
              ? isDark 
                ? 'bg-blue-900/50 text-blue-100 ml-auto' 
                : 'bg-blue-50 text-blue-900 ml-auto'
              : isDark 
                ? 'bg-gray-700 text-gray-100' 
                : 'bg-gray-100 text-gray-900'
          }`}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>Assistant is typing...</div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <textarea
          className={`flex-1 border rounded p-2 h-20 transition-colors ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
          placeholder="Describe your issue or ask a question..."
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button 
          onClick={sendMessage} 
          className="bg-blue-600 text-white px-4 py-2 rounded h-10 self-end hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default HelpChat;