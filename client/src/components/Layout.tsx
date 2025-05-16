import { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import WalletConnect from './WalletConnect';
import { useWallet } from '../context/WalletContext';
import WalletModal from './WalletModal';
import CreateLoanModal from './CreateLoanModal';
import TransactionModal from './TransactionModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { connected } = useWallet();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [createLoanModalOpen, setCreateLoanModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState({
    hash: '',
    message: 'Transaction successful'
  });
  
  // Get the title based on the current location
  const getTitle = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/marketplace':
        return 'Marketplace';
      case '/my-loans':
        return 'My Loans';
      case '/investments':
        return 'Investments';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };
  
  const showTransactionModal = (hash: string, message: string = 'Transaction successful') => {
    setTransactionDetails({ hash, message });
    setTransactionModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar for desktop */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />
      
      {/* Mobile header */}
      <header className="gradient-bg text-white p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-[hsl(var(--solana-green))] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--dark-blue))] w-4 h-4">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
          </div>
          <h1 className="text-lg font-bold">SolanaLend</h1>
        </div>
        
        <button
          className="text-white focus:outline-none"
          onClick={() => setMobileMenuOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20">
        {/* Top Navigation Bar with Wallet Connect */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 py-3 px-4 md:px-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold hidden md:block">{getTitle()}</h2>
          
          <WalletConnect 
            onConnectClick={() => setWalletModalOpen(true)} 
          />
        </div>

        {children}
      </main>
      
      {/* Modals */}
      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)} 
      />
      
      <CreateLoanModal 
        isOpen={createLoanModalOpen} 
        onClose={() => setCreateLoanModalOpen(false)}
        onSuccess={(hash) => {
          setCreateLoanModalOpen(false);
          showTransactionModal(hash, 'Loan created successfully');
        }}
      />
      
      <TransactionModal 
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        hash={transactionDetails.hash}
        message={transactionDetails.message}
      />
    </div>
  );
}
