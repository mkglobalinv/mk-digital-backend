import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ShieldCheck, X, Loader2 } from 'lucide-react';
import API from '../api';
import { isBiometricAvailable, registerBiometric } from '../services/biometricService';
import './BiometricSetupPrompt.css';

const BiometricSetupPrompt = ({ user }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      // 1. Check if they have already dismissed the prompt
      const dismissed = localStorage.getItem('biometricPromptDismissed') === 'true';
      if (dismissed) return;

      // 2. Check if they already have it enabled
      const enabled = localStorage.getItem('biometricEnabled') === 'true';
      if (enabled) return;

      // 3. Check if their device actually supports it
      const supported = await isBiometricAvailable();
      if (!supported) return;

      // If we pass all checks, show the prompt after a short delay
      // Delay prevents stacking popups or interrupting immediate user flows
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    };

    checkEligibility();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('biometricPromptDismissed', 'true');
    setIsVisible(false);
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const challengeRes = await API.get('/api/biometric/register-challenge');
      const regData = await registerBiometric(challengeRes.data);
      await API.post('/api/biometric/register-verify', regData);
      
      localStorage.setItem('biometricEnabled', 'true');
      setIsVisible(false);
      
      // Optional: Dispatch a small success toast or rely on state update
      // We could also reload, but since they just logged in, silently updating is smoother
    } catch (err) {
      console.error('Failed to setup biometric:', err);
      alert('Biometric setup failed. You can try again from your Profile settings later.');
      setIsVisible(false); // Hide anyway to not block the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="bio-prompt-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bio-prompt-card"
            initial={{ y: 50, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button className="bio-prompt-close" onClick={handleDismiss}>
              <X size={20} />
            </button>

            <div className="bio-prompt-icon-ring">
              <div className="bio-prompt-icon-inner">
                {loading ? <Loader2 size={36} className="animate-spin text-white" /> : <Fingerprint size={36} className="text-white" />}
              </div>
            </div>

            <h3 className="bio-prompt-title">Enable Fingerprint Login</h3>
            <p className="bio-prompt-desc">
              Use your fingerprint to sign in.
            </p>

            <div className="bio-prompt-actions">
              <button 
                className="bio-btn-enable" 
                onClick={handleEnable}
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Enable Fingerprint'}
              </button>
              <button 
                className="bio-btn-dismiss" 
                onClick={handleDismiss}
                disabled={loading}
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BiometricSetupPrompt;
