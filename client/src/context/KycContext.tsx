import React, { createContext, useState, useContext, ReactNode } from 'react';

// Create a simple context for KYC verification status
type KycContextType = {
  isVerified: boolean;
  setVerified: (value: boolean) => void;
};

const defaultContext: KycContextType = {
  isVerified: false,
  setVerified: () => {},
};

const KycContext = createContext<KycContextType>(defaultContext);

// Provider component
export function KycProvider({ children }: { children: ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);

  const setVerified = (value: boolean) => {
    setIsVerified(value);
    // Also update local storage for persistence
    if (value) {
      localStorage.setItem('kycVerified', 'true');
    } else {
      localStorage.removeItem('kycVerified');
    }
  };

  // Check if KYC was previously verified
  React.useEffect(() => {
    const storedVerification = localStorage.getItem('kycVerified');
    if (storedVerification === 'true') {
      setIsVerified(true);
    }
  }, []);

  return (
    <KycContext.Provider value={{ isVerified, setVerified }}>
      {children}
    </KycContext.Provider>
  );
}

// Custom hook for using the KYC context
export function useKyc() {
  return useContext(KycContext);
}