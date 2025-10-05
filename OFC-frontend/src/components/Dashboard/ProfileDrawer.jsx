import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios"; // ✅ corrected relative path
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useI18n } from "../../i18n";
import { useTheme } from "../../contexts/ThemeContext";
import ChangePasswordModal from "../Profile/ChangePasswordModal";

const ProfileDrawer = ({ user, onClose, setUser }) => {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    zkpPublicKey: user?.zkpPublicKey || "",
    address: {
      line1: user?.address?.line1 || "",
      line2: user?.address?.line2 || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      country: user?.address?.country || "",
      zip: user?.address?.zip || "",
    },
    company: {
      name: user?.company?.name || "",
      registrationNumber: user?.company?.registrationNumber || "",
      website: user?.company?.website || "",
      address: {
        line1: user?.company?.address?.line1 || "",
        city: user?.company?.address?.city || "",
        state: user?.company?.address?.state || "",
        country: user?.company?.address?.country || "",
        zip: user?.company?.address?.zip || "",
      },
    },
    preferences: {
      theme: user?.preferences?.theme || "system",
      language: user?.preferences?.language || "en",
      notifications: {
        email: user?.preferences?.notifications?.email ?? true,
        sms: user?.preferences?.notifications?.sms ?? false,
      },
    },
  });

const handleChange = (e) => {
  const { name, value } = e.target;
  setForm((prev) => ({ ...prev, [name]: value }));
};

const handleNestedChange = (section, field, value) => {
  setForm((prev) => ({
    ...prev,
    [section]: { ...prev[section], [field]: value },
  }));
};

const handlePrefChange = (field, value) => {
  setForm((prev) => ({
    ...prev,
    preferences: { ...prev.preferences, [field]: value },
  }));
};

const handleNotifChange = (field, value) => {
  setForm((prev) => ({
    ...prev,
    preferences: {
      ...prev.preferences,
      notifications: { ...prev.preferences.notifications, [field]: value },
    },
  }));
};

// OTP email verification
const [otpSent, setOtpSent] = useState(false);
const [otp, setOtp] = useState("");
const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

const sendOtp = async () => {
  try {
    await axios.post("/otp/send", { email: form.email || user?.email });
    setOtpSent(true);
    toast.success("OTP sent to email 📧");
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to send OTP";
    toast.error(msg);
  }
};

const verifyOtp = async () => {
  try {
    await axios.post("/otp/verify-code", { email: form.email || user?.email, otp });
    toast.success("Email verified ✅");
    setOtp("");
    setOtpSent(false);
  } catch (err) {
    const msg = err?.response?.data?.message || "Invalid OTP";
    toast.error(msg);
  }
};

const saveProfile = async () => {
  try {
    const payload = { ...form };
    const res = await axios.put("/user/profile", payload);
    setUser(res.data.user);
    toast.success("Profile updated 🎉");
    onClose();
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to update profile ❌";
    toast.error(msg);
  }
};

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 70 }}
className="fixed inset-y-0 right-0 w-full md:w-96 h-full bg-white dark:bg-gray-800 dark:text-white shadow-xl p-6 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
<h2 className="text-xl font-bold">👤 {t("profile.title")}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black text-xl"
        >
          ✖
        </button>
      </div>

<div className="flex-1 overflow-y-auto pr-2">
      {/* Full Name */}
      <label className="block mb-1 text-sm font-semibold">👤 {t("profile.fullName")}</label>
      <input
        type="text"
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        className="w-full border p-2 rounded mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />

      {/* Email */}
      <label className="block mb-1 text-sm font-semibold">📧 {t("profile.email")}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="flex-1 border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
<button type="button" onClick={sendOtp} className="px-3 bg-blue-600 text-white rounded">{t("actions.sendOtp")}</button>
      </div>
      {otpSent && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
placeholder="OTP"
            value={otp}
            onChange={(e)=>setOtp(e.target.value)}
            className="flex-1 border p-2 rounded"
          />
<button type="button" onClick={verifyOtp} className="px-3 bg-green-600 text-white rounded">{t("actions.verify")}</button>
        </div>
      )}

      {/* Phone */}
<label className="block mb-1 text-sm font-semibold">📱 {t("profile.phone")}</label>
      <input
        type="text"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        className="w-full border p-2 rounded mb-3"
      />

      {/* ZKP Public Key */}
<label className="block mb-1 text-sm font-semibold">🔐 {t("profile.zkpKey")}</label>
      <input
        type="text"
        name="zkpPublicKey"
        value={form.zkpPublicKey}
        onChange={handleChange}
        className="w-full border p-2 rounded mb-3"
      />

      {/* Address */}
<h3 className="text-md font-semibold mt-4 mb-2">🏠 {t("profile.address")}</h3>
      <input
        type="text"
placeholder={t("profile.line1")}
        value={form.address.line1}
        onChange={(e) => handleNestedChange('address','line1', e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <input
        type="text"
placeholder={t("profile.line2")}
        value={form.address.line2}
        onChange={(e) => handleNestedChange('address','line2', e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
placeholder={t("profile.city")}
          value={form.address.city}
          onChange={(e) => handleNestedChange('address','city', e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
placeholder={t("profile.state")}
          value={form.address.state}
          onChange={(e) => handleNestedChange('address','state', e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
placeholder={t("profile.country")}
          value={form.address.country}
          onChange={(e) => handleNestedChange('address','country', e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
placeholder={t("profile.zip")}
          value={form.address.zip}
          onChange={(e) => handleNestedChange('address','zip', e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* Company */}
      <h3 className="text-md font-semibold mt-4 mb-2">🏢 {t("profile.company")}</h3>
      <input
        type="text"
        placeholder={t("profile.companyName")}
        value={form.company.name}
        onChange={(e) => setForm((p)=>({...p, company:{...p.company, name:e.target.value}}))}
        className="w-full border p-2 rounded mb-2"
      />
      <input
        type="text"
        placeholder={t("profile.registrationNumber")}
        value={form.company.registrationNumber}
        onChange={(e) => setForm((p)=>({...p, company:{...p.company, registrationNumber:e.target.value}}))}
        className="w-full border p-2 rounded mb-2"
      />
      <input
        type="text"
        placeholder={t("profile.website")}
        value={form.company.website}
        onChange={(e) => setForm((p)=>({...p, company:{...p.company, website:e.target.value}}))}
        className="w-full border p-2 rounded mb-2"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Company Address Line 1"
          value={form.company.address.line1}
          onChange={(e) => setForm((p)=>({...p, company:{...p.company, address:{...p.company.address, line1:e.target.value}}}))}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("profile.city")}
          value={form.company.address.city}
          onChange={(e) => setForm((p)=>({...p, company:{...p.company, address:{...p.company.address, city:e.target.value}}}))}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("profile.state")}
          value={form.company.address.state}
          onChange={(e) => setForm((p)=>({...p, company:{...p.company, address:{...p.company.address, state:e.target.value}}}))}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("profile.country")}
          value={form.company.address.country}
          onChange={(e) => setForm((p)=>({...p, company:{...p.company, address:{...p.company.address, country:e.target.value}}}))}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("profile.zip")}
          value={form.company.address.zip}
          onChange={(e) => setForm((p)=>({...p, company:{...p.company, address:{...p.company.address, zip:e.target.value}}}))}
          className="border p-2 rounded"
        />
      </div>

      {/* Preferences */}
      <h3 className="text-md font-semibold mt-4 mb-2">⚙️ Preferences</h3>
      <label className="block mb-1 text-sm">Theme</label>
      <select
        className="w-full border p-2 rounded mb-2"
        value={theme}
        onChange={(e)=>setTheme(e.target.value)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      <label className="block mb-1 text-sm">Language</label>
      <input
        type="text"
        className="w-full border p-2 rounded mb-2"
        value={form.preferences.language}
        onChange={(e)=>handlePrefChange('language', e.target.value)}
      />

      <div className="flex items-center gap-3 mt-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.preferences.notifications.email} onChange={(e)=>handleNotifChange('email', e.target.checked)} /> Email Notifications
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.preferences.notifications.sms} onChange={(e)=>handleNotifChange('sms', e.target.checked)} /> SMS Notifications
        </label>
      </div>

      </div>

      {/* Actions */}
      <div className="space-y-3 mt-6">
        {/* Admin-only comprehensive profile button */}
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              navigate('/dashboard/user-profile');
              onClose();
            }}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            📊 View Comprehensive Profile
          </button>
        )}
        
        <button
          onClick={() => setShowChangePasswordModal(true)}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          🔐 Change Password
        </button>
        
        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            {t("actions.close")}
          </button>
          <button
            onClick={saveProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {t("actions.save")}
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-6 border-t pt-4">
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded w-full"
        >
          🚪 {t("actions.logout")}
        </button>
      </div>
      
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          toast.success('Password changed successfully!');
        }}
      />
    </motion.div>
  );
};

export default ProfileDrawer;
