import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import LandingPage from './components/Layout/LandingPage';
import ProtectedRoute from './utils/ProtectedRoute';

// Tool Pages
import EncryptionPage from './components/Tools/EncryptionPage';
import DecryptionPage from './components/Tools/DecryptionPage';
import HistoryPage from './components/Tools/HistoryPage';
import AIAnalyzer from './components/Tools/AIAnalyzer';
import MLScanner from './components/Tools/MLScanner';
import MalwareScanner from './components/Tools/MalwareScanner';
import SensitivityFinder from './components/Tools/SensitivityFinder';
import OtherTools from './components/Tools/OtherTools';

// Profile Page
import ProfilePage from './components/Profile/ProfilePage';
import UserProfile from './components/Profile/UserProfile';
import UserFilesView from './components/Files/UserFilesView';

// Help Chat and Vault
import HelpChat from './components/Support/HelpChat';
import VaultPage from './components/Vault/VaultPage';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      /* Profile Page (inside Dashboard) */
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* User Profile Pages */}
      <Route
        path="/dashboard/user-profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/user-profile/:userId"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      {/* Hierarchical Files View (Admin) */}
      <Route
        path="/dashboard/user-files"
        element={
          <ProtectedRoute>
            <UserFilesView />
          </ProtectedRoute>
        }
      />

      {/* Tool Routes */}
      <Route
        path="/dashboard/encrypt"
        element={
          <ProtectedRoute>
            <EncryptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/decrypt"
        element={
          <ProtectedRoute>
            <DecryptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/ai-analyzer"
        element={
          <ProtectedRoute>
            <AIAnalyzer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/ml-scanner"
        element={
          <ProtectedRoute>
            <MLScanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/malicious"
        element={
          <ProtectedRoute>
            <MalwareScanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sensitivity"
        element={
          <ProtectedRoute>
            <SensitivityFinder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/other"
        element={
          <ProtectedRoute>
            <OtherTools />
          </ProtectedRoute>
        }
      />

      {/* Help & Chat */}
      <Route
        path="/dashboard/help"
        element={
          <ProtectedRoute>
            <HelpChat />
          </ProtectedRoute>
        }
      />

      {/* Secret Vault */}
      <Route
        path="/dashboard/vault"
        element={
          <ProtectedRoute>
            <VaultPage />
          </ProtectedRoute>
        }
      />
        </Routes>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
