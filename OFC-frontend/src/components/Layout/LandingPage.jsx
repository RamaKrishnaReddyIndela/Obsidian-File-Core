import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Zap, Eye, Globe, Star, ArrowRight, CheckCircle, Users, Award, Sparkles } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeToggle from "../ThemeToggle";

export default function LandingPage() {
  const { isDark } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const features = [
    {
      icon: <Shield className="w-12 h-12 text-blue-400" />,
      title: "Military-Grade Encryption",
      description: "AES-256 encryption with advanced cryptographic algorithms to protect your most sensitive data.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Lock className="w-12 h-12 text-green-400" />,
      title: "Zero-Knowledge Security",
      description: "Your data is encrypted locally. We never have access to your files or encryption keys.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Zap className="w-12 h-12 text-purple-400" />,
      title: "AI-Powered Analysis",
      description: "Intelligent threat detection and sensitivity classification using machine learning.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Eye className="w-12 h-12 text-orange-400" />,
      title: "Real-Time Scanning",
      description: "Continuous monitoring for malicious content and vulnerability assessment.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Globe className="w-12 h-12 text-indigo-400" />,
      title: "Secure Sharing",
      description: "Share encrypted files safely with time-limited links and access controls.",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: <Star className="w-12 h-12 text-yellow-400" />,
      title: "Enterprise Ready",
      description: "Scalable solution with audit logs, compliance features, and team management.",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime" },
    { number: "256-bit", label: "Encryption" },
    { number: "<1s", label: "Processing" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Obsidian File Core
          </span>
        </motion.div>
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-6xl mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-6"
            >
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                isDark 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                <Sparkles className="w-4 h-4 mr-2" />
                Enterprise-Grade Security Platform
              </div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className={`text-5xl md:text-7xl font-black mb-6 leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Secure Your Digital
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {" "}Fortress
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Military-grade encryption, AI-powered threat detection, and zero-knowledge security. 
              <span className="font-semibold text-blue-500">Protect what matters most</span> with the most advanced file security platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link to="/signup">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center min-w-[200px]"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-4 font-bold text-lg rounded-2xl border-2 transition-all duration-300 min-w-[200px] ${
                    isDark
                      ? 'border-gray-600 text-white hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-2xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className={`text-center p-4 rounded-xl ${
                    isDark ? 'bg-white/5 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'
                  }`}
                >
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="mb-16">
            <motion.h2 
              variants={itemVariants}
              className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Why Choose Obsidian File Core?
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className={`text-lg mb-12 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            >
              Experience next-generation file security with these powerful features
            </motion.p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`group relative p-8 rounded-3xl transition-all duration-500 ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10' 
                      : 'bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 mb-6 mx-auto">
                      {feature.icon}
                    </div>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            variants={itemVariants}
            className="mb-16"
          >
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>10,000+ Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>ISO 27001 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-orange-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>256-bit Encryption</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className={`relative z-10 text-center py-8 border-t ${
        isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'
      }`}>
        <p>&copy; 2024 Obsidian File Core. Securing your digital future.</p>
      </footer>
    </div>
  );
}
