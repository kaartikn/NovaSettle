import { useLocation, Link } from 'wouter';
import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useKyc } from '../context/KycContext';
import { getNetworkStatus } from '../lib/solana';
import KYCVerificationModal from './KYCVerificationModal';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { connection, connected } = useWallet();
  const { isVerified } = useKyc();
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [kycModalOpen, setKycModalOpen] = useState(false);
  
  useEffect(() => {
    // Check network status periodically
    const intervalId = setInterval(async () => {
      try {
        const status = await getNetworkStatus(connection);
        setNetworkStatus(status.status);
      } catch (error) {
        setNetworkStatus('disconnected');
      }
    }, 5000);
    
    // Initial check
    getNetworkStatus(connection)
      .then(status => setNetworkStatus(status.status))
      .catch(() => setNetworkStatus('disconnected'));
    
    return () => clearInterval(intervalId);
  }, [connection]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Marketplace', path: '/marketplace', icon: 'bank' },
    { name: 'My Loans', path: '/my-loans', icon: 'file-list-3' },
    { name: 'Settings', path: '/settings', icon: 'settings-3' },
  ];

  const renderIcon = (name: string) => {
    switch (name) {
      case 'dashboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        );
      case 'bank':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10V8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
            <path d="M1 18a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2Z" />
            <path d="M6 14v-3" />
            <path d="M10 14v-3" />
            <path d="M14 14v-3" />
            <path d="M18 14v-3" />
          </svg>
        );
      case 'file-list-3':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
            <line x1="8" y1="9" x2="16" y2="9" />
          </svg>
        );
      case 'funds':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 12 5.25 5 1.25-1.5-3.5-3 3.5-3.5L7.25 7.5 2 12Z" />
            <path d="m22 12-5.25-5-1.25 1.5 3.5 3-3.5 3.5 1.25 1.5L22 12Z" />
            <path d="m7 4 10 16" />
          </svg>
        );
      case 'settings-3':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.9 4.24A1.98 1.98 0 0 0 8 6v1a2 2 0 0 1-2 2 2 2 0 0 0-2 2v.93a2 2 0 0 0 2 2 2 2 0 0 1 2 2v1a2 2 0 0 0 1.9 1.76 2 2 0 0 0 2.1-1.76v-1a2 2 0 0 1 2-2 2 2 0 0 0 2-2V13a2 2 0 0 0-2-2 2 2 0 0 1-2-2V8a2 2 0 0 0-2.1-3.76Z" />
            <path d="M12 12h.01" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        );
    }
  };

  // Sidebar for desktop
  return (
    <>
      <KYCVerificationModal 
        isOpen={kycModalOpen} 
        onClose={() => setKycModalOpen(false)} 
      />
      
      <aside className="gradient-bg text-white w-full md:w-64 md:min-h-screen md:fixed hidden md:block">
        <div className="p-4">
          <div className="flex items-center mb-8">
            <h1 className="text-xl font-bold">NovaSettle</h1>
          </div>
          
          {/* KYC Status Button */}
          {connected && (
            <div className={`p-3 mb-4 rounded-lg ${isVerified ? 'bg-green-900 bg-opacity-30' : 'bg-yellow-900 bg-opacity-40'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">KYC Status:</span>
                  <div className="text-xs mt-1">
                    {isVerified ? (
                      <span className="text-green-300">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-200">⚠️ Not Verified</span>
                    )}
                  </div>
                </div>
                {!isVerified && (
                  <button 
                    onClick={() => setKycModalOpen(true)}
                    className="px-3 py-1.5 bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] text-xs font-semibold rounded"
                  >
                    Verify Now
                  </button>
                )}
              </div>
            </div>
          )}
        
          <nav>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      location === item.path 
                        ? 'bg-opacity-20 bg-white' 
                        : 'hover:bg-opacity-10 hover:bg-white transition'
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-[hsl(var(--dark-blue))] rounded-lg p-3 text-xs text-gray-300">
            <div className="flex items-center justify-between mb-2">
              <span>Network:</span>
              <span className="font-medium flex items-center">
                <span className="h-2 w-2 rounded-full bg-orange-400 mr-1"></span>
                Solana Devnet
              </span>
            </div>
            <div className={`text-xs ${networkStatus === 'connected' ? 'text-[hsl(var(--solana-green))]' : 'text-red-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                <path d="M2 10v3" />
                <path d="M6 6v7" />
                <path d="M10 3v10" />
                <path d="M14 8v5" />
                <path d="M18 5v8" />
                <path d="M22 10v3" />
              </svg>
              {networkStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu */}
      <div className={`fixed inset-0 bg-[hsl(var(--dark-blue))] bg-opacity-95 z-50 ${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="p-4 flex justify-end">
          <button 
            className="text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        {/* KYC Status for Mobile */}
        {connected && (
          <div className="px-4 mb-4">
            <div className={`p-3 rounded-lg ${isVerified ? 'bg-green-900 bg-opacity-30' : 'bg-yellow-900 bg-opacity-40'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white">KYC Status:</span>
                  <div className="text-xs mt-1">
                    {isVerified ? (
                      <span className="text-green-300">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-200">⚠️ Not Verified</span>
                    )}
                  </div>
                </div>
                {!isVerified && (
                  <button 
                    onClick={() => {
                      setKycModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-1.5 bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] text-xs font-semibold rounded"
                  >
                    Verify Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      
        <nav className="p-4">
          <ul className="space-y-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <a 
                  href="#" 
                  className="flex items-center space-x-3 p-3 text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                >
                  {renderIcon(item.icon)}
                  <span>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
