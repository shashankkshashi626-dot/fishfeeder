import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./components/AuthContext";
import { useMQTT } from "./hooks/useMQTT";
import { useNotifications } from "./mqtt/NotificationService"; // Custom push notifications

// View pages
import SplashScreen from "./components/SplashScreen";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import AutoFeed from "./components/AutoFeed";
import Settings from "./components/Settings";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  // Initialize MQTT Hook State
  const mqttState = useMQTT();

  // Initialize Push Notification Service
  useNotifications(mqttState);

  // Manage splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Update theme settings based on user profile preferences
  useEffect(() => {
    if (!user) return;
    const root = window.document.documentElement;
    if (user.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [user?.theme]);

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  const isAuthRoute = ["/login", "/register", "/forgot-password"].includes(location.pathname);

  // Protected Route Wrapper
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  // Auth Redirect Wrapper
  const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (user) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      
      {/* Show header only if user is logged in and not on authentication screens */}
      {user && !isAuthRoute && (
        <Header 
          espOnline={mqttState.espOnline} 
          mqttConnected={mqttState.mqttConnected} 
        />
      )}

      {/* Main routing layout with animated page transitions */}
      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Authentication Views */}
            <Route path="/login" element={
              <AuthRedirect>
                <PageWrapper>
                  <Login />
                </PageWrapper>
              </AuthRedirect>
            } />
            <Route path="/register" element={
              <AuthRedirect>
                <PageWrapper>
                  <Register />
                </PageWrapper>
              </AuthRedirect>
            } />
            <Route path="/forgot-password" element={
              <AuthRedirect>
                <PageWrapper>
                  <ForgotPassword />
                </PageWrapper>
              </AuthRedirect>
            } />

            {/* Authenticated Dashboard & Settings Console */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <PageWrapper>
                  <Dashboard mqttState={mqttState} />
                </PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/auto-feed" element={
              <ProtectedRoute>
                <PageWrapper>
                  <AutoFeed />
                </PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <PageWrapper>
                  <Settings />
                </PageWrapper>
              </ProtectedRoute>
            } />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </AnimatePresence>
      </div>

      {/* Show footer only if user is logged in and not on auth screens */}
      {user && !isAuthRoute && <Footer />}

    </div>
  );
};

// Framer motion wrapper for fluid page transitions
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default App;
