import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { Wallet } from '../lib/wallet';
import { 
  isPhantomInstalled, 
  connectPhantom, 
  getPhantomConnectionStatus 
} from '../lib/phantom';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [walletAvailability, setWalletAvailability] = useState({
    phantom: false,
    solflare: false,
    backpack: false
  });
  const { toast } = useToast();
  
  // Check wallet availability when modal opens
  useEffect(() => {
    if (isOpen) {
      const checkWallets = () => {
        setWalletAvailability({
          phantom: isPhantomInstalled(),
          solflare: Wallet.isWalletAvailable('solflare'),
          backpack: Wallet.isWalletAvailable('backpack')
        });
      };
      
      checkWallets();
      // Recheck every second in case user installs extension
      const interval = setInterval(checkWallets, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);
  
  // Handle direct Phantom wallet connection
  const handleConnectPhantom = async () => {
    if (!isPhantomInstalled()) {
      // If Phantom is not available, show link to install
      toast({
        title: "Phantom not detected",
        description: "Please install the Phantom extension first. A new tab will open with installation instructions.",
        variant: "destructive"
      });
      
      // Open the Phantom website in a new tab
      window.open('https://phantom.app/', '_blank');
      return;
    }
    
    setConnecting(true);
    setCurrentWallet('phantom');
    
    try {
      // Use our direct connection method
      console.log("Connecting to Phantom wallet...");
      const result = await connectPhantom();
      
      if (result) {
        console.log("Successfully connected to Phantom wallet:", result.address);
        
        // Call the context's connect method to update state
        await connect('phantom');
        
        onClose();
        toast({
          title: "Wallet connected",
          description: `Successfully connected to Phantom wallet: ${result.address.slice(0,6)}...${result.address.slice(-4)}`
        });
      } else {
        throw new Error("Failed to connect to Phantom wallet");
      }
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      
      // Check if the error is due to user rejection
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const isUserRejection = errorMessage.includes('User rejected') || 
                              errorMessage.includes('rejected by user');
      
      toast({
        title: isUserRejection ? "Connection cancelled" : "Connection failed",
        description: isUserRejection 
          ? "You cancelled the connection request" 
          : `Could not connect to Phantom wallet: ${errorMessage}`,
        variant: isUserRejection ? "default" : "destructive"
      });
    } finally {
      setConnecting(false);
      setCurrentWallet(null);
    }
  };
  
  // Handle other wallets connection
  const handleConnectOther = async (walletName: string) => {
    if (!walletAvailability[walletName.toLowerCase() as keyof typeof walletAvailability]) {
      // If wallet is not available, show link to install
      toast({
        title: `${walletName} not detected`,
        description: `Please install the ${walletName} extension first. A new tab has been opened with installation instructions.`,
        variant: "destructive"
      });
      
      // Open the wallet website in a new tab
      if (walletName.toLowerCase() === 'solflare') {
        window.open('https://solflare.com/', '_blank');
      } else if (walletName.toLowerCase() === 'backpack') {
        window.open('https://www.backpack.app/', '_blank');
      }
      
      return;
    }
    
    setConnecting(true);
    setCurrentWallet(walletName);
    
    try {
      console.log(`Calling connect for ${walletName} wallet...`);
      await connect(walletName);
      console.log(`Connection process completed for ${walletName}`);
      onClose();
      toast({
        title: "Wallet connected",
        description: `Successfully connected to ${walletName}`
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Failed to connect wallet",
        description: error instanceof Error ? error.message : `Could not connect to ${walletName}`,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
      setCurrentWallet(null);
    }
  };
  
  // Unified connect handler that routes to the appropriate method
  const handleConnect = (walletName: string) => {
    if (walletName.toLowerCase() === 'phantom') {
      return handleConnectPhantom();
    } else {
      return handleConnectOther(walletName);
    }
  };
  
  // Get current Phantom connection status
  const phantomStatus = getPhantomConnectionStatus();
  
  // Function to display Phantom connection status
  const renderPhantomStatus = () => {
    if (!phantomStatus.isInstalled) {
      return <span className="text-red-500">Not Installed</span>;
    }
    
    if (phantomStatus.isConnected && phantomStatus.address) {
      return (
        <span className="text-green-500">
          Connected: {phantomStatus.address.slice(0,6)}...{phantomStatus.address.slice(-4)}
        </span>
      );
    }
    
    return <span className="text-yellow-500">Installed (Not Connected)</span>;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect with one of the available wallet providers or create a new wallet.
          </DialogDescription>
        </DialogHeader>
        
        {/* Debug section */}
        <div className="p-2 bg-gray-100 rounded-md text-xs mb-4 font-mono">
          <div className="mb-2">
            <p className="font-bold">Wallet Status:</p>
            <p>Phantom: {renderPhantomStatus()}</p>
            <p>Solflare: {walletAvailability.solflare ? "Installed" : "Not Installed"}</p>
            <p>Backpack: {walletAvailability.backpack ? "Installed" : "Not Installed"}</p>
          </div>
          
          <div className="mt-2 flex justify-end">
            <button 
              onClick={handleConnectPhantom}
              className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
            >
              Connect Phantom Directly
            </button>
          </div>
        </div>
        
        <div className="space-y-3 mt-4">
          <button 
            className={`w-full p-4 border ${walletAvailability.phantom ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' : 'border-gray-200 hover:bg-gray-50'} rounded-lg transition flex items-center`}
            onClick={() => handleConnect('phantom')}
            disabled={connecting}
          >
            <div className="h-6 w-6 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
                <path d="M85.5 35.5L69 52H54L37.5 68.5H54L97.5 68.5C98.5 61.5 95.5 42 76.5 42L85.5 35.5Z" fill="#AB9FF2"/>
                <path d="M37.5 68.5L69 100.5H84L105.5 79H68.5L37.5 68.5Z" fill="#AB9FF2"/>
                <path d="M37.5 68.5L25 40.5L45.5 35.5L37.5 68.5Z" fill="#AB9FF2"/>
              </svg>
            </div>
            <div>
              <span className="font-medium">Phantom</span>
              {!walletAvailability.phantom && (
                <p className="text-xs text-gray-500">Not detected - Click to install</p>
              )}
            </div>
            {connecting && currentWallet === 'phantom' ? (
              <svg className="animate-spin h-5 w-5 ml-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            )}
          </button>
          
          <button 
            className={`w-full p-4 border ${walletAvailability.solflare ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' : 'border-gray-200 hover:bg-gray-50'} rounded-lg transition flex items-center`}
            onClick={() => handleConnect('solflare')}
            disabled={connecting}
          >
            <div className="h-6 w-6 mr-4">
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none">
                <path fill="#FC9B27" d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0z"/>
                <path fill="#fff" d="M16 6.043a9.961 9.961 0 0 0-9.957 9.957A9.959 9.959 0 0 0 16 25.957a9.957 9.957 0 0 0 0-19.914zm0 9.914a4.877 4.877 0 0 1-4.872-4.872A4.877 4.877 0 0 1 16 6.214a4.877 4.877 0 0 1 4.872 4.871A4.877 4.877 0 0 1 16 15.957z"/>
              </svg>
            </div>
            <div>
              <span className="font-medium">Solflare</span>
              {!walletAvailability.solflare && (
                <p className="text-xs text-gray-500">Not detected - Click to install</p>
              )}
            </div>
            {connecting && currentWallet === 'solflare' ? (
              <svg className="animate-spin h-5 w-5 ml-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            )}
          </button>
          
          <button 
            className={`w-full p-4 border ${walletAvailability.backpack ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 hover:bg-gray-50'} rounded-lg transition flex items-center`}
            onClick={() => handleConnect('backpack')}
            disabled={connecting}
          >
            <div className="h-6 w-6 mr-4">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000">
                <rect width="512" height="512" rx="256" fill="#0F172A"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M169.226 112H342.774C353.968 112 363.129 121.19 363.129 132.417V363.129C363.129 374.356 353.968 383.546 342.774 383.546H169.226C158.032 383.546 148.871 374.356 148.871 363.129V132.417C148.871 121.19 158.032 112 169.226 112ZM303.516 288.258C303.516 300.323 293.807 310.065 281.781 310.065H230.219C218.193 310.065 208.484 300.323 208.484 288.258V264.516H166.292V347.355C166.292 354.804 172.309 360.839 179.738 360.839H332.261C339.69 360.839 345.708 354.804 345.708 347.355V264.516H303.516V288.258Z" fill="#E5E7EB"/>
              </svg>
            </div>
            <div>
              <span className="font-medium">Backpack</span>
              {!walletAvailability.backpack && (
                <p className="text-xs text-gray-500">Not detected - Click to install</p>
              )}
            </div>
            {connecting && currentWallet === 'backpack' ? (
              <svg className="animate-spin h-5 w-5 ml-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            )}
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            New to Solana?
            <a href="https://solana.com/developers" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--solana-purple))] font-medium ml-1">
              Learn More
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
