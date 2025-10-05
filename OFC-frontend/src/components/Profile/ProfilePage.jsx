import React, { useEffect, useState } from "react";
import api from "../../utils/axios";
import toast from "react-hot-toast";

const Row = ({ label, children }) => (
  <div className="flex justify-between py-1 border-b border-gray-100">
    <span className="text-gray-500 mr-4">{label}</span>
    <span className="text-gray-800 text-right break-all">{children || "Not set"}</span>
  </div>
);

const ProfilePage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/profile");
        setUser(res.data.user);
      } catch (err) {
        toast.error("Failed to load profile");
      }
    };
    fetchProfile();
  }, []);

  if (!user) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4">👤 Profile Details</h2>
      <div className="space-y-2">
        <Row label="Full Name">{user.fullName}</Row>
        <Row label="Email">{user.email}</Row>
        <Row label="Phone">{user.phone}</Row>
        <Row label="Role">{user.role}</Row>
        <Row label="ZKP Key">{user.zkpPublicKey}</Row>
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-2">🏠 Address</h3>
      <div className="space-y-1 text-sm">
        <Row label="Line 1">{user.address?.line1}</Row>
        <Row label="Line 2">{user.address?.line2}</Row>
        <Row label="City">{user.address?.city}</Row>
        <Row label="State">{user.address?.state}</Row>
        <Row label="Country">{user.address?.country}</Row>
        <Row label="ZIP">{user.address?.zip}</Row>
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-2">🏢 Company</h3>
      <div className="space-y-1 text-sm">
        <Row label="Name">{user.company?.name}</Row>
        <Row label="Reg. Number">{user.company?.registrationNumber}</Row>
        <Row label="Website">{user.company?.website}</Row>
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-2">⚙️ Preferences</h3>
      <div className="space-y-1 text-sm">
        <Row label="Theme">{user.preferences?.theme}</Row>
        <Row label="Language">{user.preferences?.language}</Row>
        <Row label="Notif. Email">{String(user.preferences?.notifications?.email)}</Row>
        <Row label="Notif. SMS">{String(user.preferences?.notifications?.sms)}</Row>
      </div>
    </div>
  );
};

export default ProfilePage;
