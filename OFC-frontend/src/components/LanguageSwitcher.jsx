import React, { useState } from 'react';
import { useI18n } from '../i18n';
import api from '../utils/axios';

const LanguageSwitcher = () => {
  const { lang, setLang } = useI18n();
  const [busy, setBusy] = useState(false);

  const change = async (e) => {
    const value = e.target.value;
    setLang(value);
    setBusy(true);
    try {
      await api.put('/user/profile', { preferences: { language: value } });
    } catch (e) {
      // ignore failures; local preference is still applied
    } finally {
      setBusy(false);
    }
  };

  return (
    <select value={lang} onChange={change} disabled={busy} className="px-2 py-1 rounded bg-gray-700 text-white">
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
      <option value="te">తెలుగు</option>
      <option value="ta">தமிழ்</option>
      <option value="kn">ಕನ್ನಡ</option>
      <option value="mr">मराठी</option>
      <option value="bn">বাংলা</option>
      <option value="gu">ગુજરાતી</option>
      <option value="pa">ਪੰਜਾਬੀ</option>
      <option value="ur">اردو</option>
    </select>
  );
};

export default LanguageSwitcher;
