import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useKyc } from '../context/KycContext';
import { getPhantomConnectionStatus } from '../lib/phantom';
import KYCVerificationModal from './KYCVerificationModal';

interface WalletConnectProps {
  onConnectClick: () => void;
}

export default function WalletConnect({ onConnectClick }: WalletConnectProps) {
  const { connected, walletAddress, walletName, disconnect } = useWallet();
  const { isVerified } = useKyc();
  const [truncatedAddress, setTruncatedAddress] = useState<string>('');
  const [phantomConnected, setPhantomConnected] = useState(false);
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  
  // Check for Phantom wallet connection
  useEffect(() => {
    const checkPhantomConnection = () => {
      const status = getPhantomConnectionStatus();
      setPhantomConnected(status.isConnected);
      setPhantomAddress(status.address);
    };
    
    // Check immediately
    checkPhantomConnection();
    
    // Set up interval to check periodically
    const interval = setInterval(checkPhantomConnection, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Truncate address for display
  useEffect(() => {
    // Use Phantom address if available, otherwise use context wallet address
    const address = phantomAddress || walletAddress;
    
    if (address) {
      // Truncate wallet address for display
      setTruncatedAddress(
        `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
      );
    }
  }, [walletAddress, phantomAddress]);
  
  // Show connected UI if either connection method is active
  const isConnected = connected || phantomConnected;

  // Handle disconnect for both connection methods
  const handleDisconnect = async () => {
    // Always call the context disconnect
    disconnect();
    
    // If connected via Phantom, we don't need to do anything else
    // as the wallet will handle disconnection through the UI
  };

  if (!isConnected) {
    return (
      <div className="flex items-center ml-auto">
        <button 
          className="flex items-center px-4 py-2 bg-[hsl(var(--dark-blue))] hover:bg-opacity-90 text-white rounded-lg focus:outline-none transition-colors"
          onClick={onConnectClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M17 11h4a2 2 0 0 1 0 4h-4"/>
            <path d="M17 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/>
          </svg>
          <span>Connect Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center ml-auto space-x-3">
      {/* KYC Verification Modal */}
      <KYCVerificationModal 
        isOpen={kycModalOpen} 
        onClose={() => setKycModalOpen(false)} 
      />
    
      {/* KYC Button */}
      <button
        onClick={() => isVerified ? null : setKycModalOpen(true)}
        className={`px-3 py-2 rounded-lg flex items-center ${
          isVerified 
            ? 'bg-green-100 text-green-800 cursor-default' 
            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        }`}
        disabled={isVerified}
        title={isVerified ? 'KYC verification completed' : 'Complete KYC verification'}
      >
        {isVerified ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-sm font-semibold">KYC Verified</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-sm font-semibold">KYC Verification</span>
          </>
        )}
      </button>
      
      {/* Wallet Connection */}
      <div className="flex items-center border border-gray-200 rounded-lg">
        <div className="px-4 py-2 bg-gray-100 border-r border-gray-200 flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm">
            {phantomConnected ? 'Phantom' : walletName || 'Connected'}
          </span>
        </div>
        <div className="px-4 py-2 wallet-address text-sm">
          {truncatedAddress}
        </div>
        <button 
          className="p-2 hover:bg-gray-100 text-gray-700 focus:outline-none"
          onClick={handleDisconnect}
          title="Disconnect wallet"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
