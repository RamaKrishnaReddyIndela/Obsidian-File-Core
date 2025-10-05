import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Unlock, ShieldAlert, Search, History, Wrench, Cpu, Brain, Users } from "lucide-react";
import api from "../../utils/axios";
import UploadFile from "../Files/UploadFile";
import FileList from "../Files/FileList";
import ProfileDrawer from "./ProfileDrawer";
import { useI18n } from "../../i18n";
import LanguageSwitcher from "../LanguageSwitcher";
import ChatWidget from "../Support/ChatWidget";
import ThemeToggle from "../ThemeToggle";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [refreshFiles, setRefreshFiles] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { t, setLang } = useI18n();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
        try {
          const preferred = res.data?.user?.preferences?.language;
          if (preferred) setLang(preferred);
        } catch (_) {}
      } catch (error) {
        console.error("Profile fetch failed:", error.response?.data?.message || error.message);
        navigate("/login");
      }
    };

    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (error) {
        console.error("Stats fetch failed:", error.response?.data?.message || error.message);
      }
    };

    fetchProfile();
    fetchStats();
  }, [navigate, setLang]);

  const refreshFileList = () => setRefreshFiles((prev) => !prev);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);


  if (!user) return <div className="p-6">🔄 Loading...</div>;

  const tools = [
    { name: t("dashboard.tools.encryption"), icon: <Lock size={28} />, color: "from-blue-500 to-indigo-500", path: "/dashboard/encrypt", count: stats?.encrypted || 0 },
    { name: t("dashboard.tools.decryption"), icon: <Unlock size={28} />, color: "from-green-500 to-emerald-500", path: "/dashboard/decrypt", count: stats?.decrypted || 0 },
    { name: t("dashboard.tools.maliciousFinder"), icon: <ShieldAlert size={28} />, color: "from-red-500 to-pink-500", path: "/dashboard/malicious", count: stats?.threats || 0 },
    { name: t("dashboard.tools.sensitivityFinder"), icon: <Search size={28} />, color: "from-purple-500 to-pink-500", path: "/dashboard/sensitivity", count: stats?.sensitive || 0 },
    { name: t("dashboard.tools.aiAnalyzer"), icon: <Brain size={28} />, color: "from-indigo-500 to-purple-500", path: "/dashboard/ai-analyzer", count: stats?.aiScans || 0 },
    { name: t("dashboard.tools.mlScanner"), icon: <Cpu size={28} />, color: "from-pink-500 to-red-500", path: "/dashboard/ml-scanner", count: stats?.mlScans || 0 },
    { name: t("dashboard.tools.history"), icon: <History size={28} />, color: "from-yellow-500 to-orange-500", path: "/dashboard/history", count: stats?.history || 0 },
    // Admin-only tools
    ...(user?.role === 'admin' ? [{ name: "User Files", icon: <Users size={28} />, color: "from-teal-500 to-cyan-500", path: "/dashboard/user-files", count: stats?.totalUsers || 0 }] : []),
    // Chat and Vault moved to floating widget for secrecy
    { name: t("dashboard.tools.otherTools"), icon: <Wrench size={28} />, color: "from-gray-500 to-slate-500", path: "/dashboard/other", count: stats?.tools || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-lg shadow">
        <h2 className="text-xl font-bold">{t("dashboard.title")}</h2>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-4 py-2 bg-gray-700 rounded-full hover:bg-gray-600"
          >
            👤 {user.fullName}
          </button>
        </div>
      </div>

      {/* Backdrop when drawer open */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"></div>
      )}

      {/* Tool Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05 }}
            className={`cursor-pointer p-6 rounded-2xl shadow-lg bg-gradient-to-r ${tool.color} text-white flex flex-col items-center`}
            onClick={() => navigate(tool.path)}
          >
            {tool.icon}
            <h3 className="text-xl font-semibold mt-2">{tool.name}</h3>
            <p className="text-sm mt-1">{tool.count} {t("common.records")}</p>
          </motion.div>
        ))}
      </div>

      {/* Upload + File List */}
      <UploadFile onUploadSuccess={refreshFileList} />
      <FileList refresh={refreshFiles} onFileDeleted={refreshFileList} user={user} />

      {/* Profile Drawer */}
      {drawerOpen && (
        <ProfileDrawer
          user={user}
          setUser={setUser}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Floating Chat + Vault Widget */}
      <ChatWidget />
    </div>
  );
};

export default Dashboard;
