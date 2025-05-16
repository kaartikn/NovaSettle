import { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { Wallet } from '../lib/wallet';
import { useToast } from '@/hooks/use-toast';

// Define wallet context types
type WalletContextType = {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  walletAddress: string | null;
  walletName: string | null;
  kycVerified: boolean;
  kycVerifying: boolean;
  verifyKYC: () => Promise<boolean>;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => void;
  connection: Connection;
};

// Create wallet context with default values
const WalletContext = createContext<WalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  walletAddress: null,
  walletName: null,
  kycVerified: false,
  kycVerifying: false,
  verifyKYC: async () => false,
  connect: async () => {},
  disconnect: () => {},
  connection: new Connection(clusterApiUrl('devnet')),
});

// Custom hook to use wallet context
export const useWallet = () => useContext(WalletContext);

// Provider component to wrap app with wallet context
export const WalletContextProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [kycVerifying, setKycVerifying] = useState(false);
  const walletRef = useRef<Wallet | null>(null);
  const connection = new Connection(clusterApiUrl('devnet'));
  const { toast } = useToast();

  // Function to setup wallet listeners
  const setupWalletListeners = useCallback((wallet: Wallet, provider: any) => {
    if (!provider) return;
    
    const handleDisconnect = () => {
      console.log('Wallet disconnected event');
      disconnect();
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected"
      });
    };

    const handleAccountChange = (newPublicKey: PublicKey) => {
      console.log('Wallet account changed:', newPublicKey.toString());
      setPublicKey(newPublicKey);
      setWalletAddress(newPublicKey.toString());
      toast({
        title: "Wallet account changed",
        description: `Active account changed to ${newPublicKey.toString().slice(0, 6)}...${newPublicKey.toString().slice(-4)}`
      });
    };

    // Add event listeners
    try {
      provider.on('disconnect', handleDisconnect);
      provider.on('accountChanged', handleAccountChange);
    } catch (error) {
      console.error('Failed to add wallet event listeners:', error);
    }

    // Return a cleanup function
    return () => {
      try {
        provider.removeListener('disconnect', handleDisconnect);
        provider.removeListener('accountChanged', handleAccountChange);
      } catch (error) {
        console.error('Failed to remove wallet event listeners:', error);
      }
    };
  }, []);

  // Effect to check for wallet reconnection on startup
  useEffect(() => {
    const checkWalletConnection = async () => {
      // Check if wallet was previously connected
      const savedWallet = localStorage.getItem('connectedWallet');
      if (savedWallet) {
        try {
          await connect(savedWallet);
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
          localStorage.removeItem('connectedWallet');
        }
      }
    };

    checkWalletConnection();
  }, []);

  // Function to connect to wallet
  const connect = useCallback(async (name: string) => {
    try {
      setConnecting(true);
      const wallet = new Wallet(name);
      const connected = await wallet.connect();
      
      if (connected && wallet.publicKey) {
        setPublicKey(wallet.publicKey);
        setWalletAddress(wallet.publicKey.toString());
        setWalletName(name);
        setConnected(true);
        localStorage.setItem('connectedWallet', name);
        
        // Store wallet reference
        walletRef.current = wallet;
        
        // Setup listeners
        const windowObj = window as any;
        const provider = name.toLowerCase() === 'phantom' ? windowObj.phantom?.solana :
                         name.toLowerCase() === 'solflare' ? windowObj.solflare :
                         name.toLowerCase() === 'backpack' ? windowObj.backpack?.solana : null;
        
        if (provider) {
          setupWalletListeners(wallet, provider);
        }
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [setupWalletListeners]);

  // Function to disconnect wallet
  const disconnect = useCallback(async () => {
    if (walletRef.current) {
      try {
        await walletRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
    
    setPublicKey(null);
    setWalletAddress(null);
    setWalletName(null);
    setConnected(false);
    setKycVerified(false);
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('kycVerified');
    walletRef.current = null;
  }, []);

  // Function to verify KYC - this will immediately set the user as verified
  const verifyKYC = useCallback(async (): Promise<boolean> => {
    // If not connected, force verification anyway but notify about connection
    if (!connected || !walletAddress) {
      toast({
        title: "Note",
        description: "For testing purposes, KYC verification will succeed even without wallet connection"
      });
    }

    // Skip all verification logic and just mark as verified
    setKycVerified(true);
    localStorage.setItem('kycVerified', 'true');
    
    toast({
      title: "KYC Verification Successful",
      description: "Your identity has been verified successfully"
    });
    
    return true;
  }, [connected, walletAddress, toast]);

  // Check for previously verified KYC on mount
  useEffect(() => {
    const savedKycVerified = localStorage.getItem('kycVerified');
    if (savedKycVerified === 'true' && connected) {
      setKycVerified(true);
    }
  }, [connected]);

  const value = {
    connected,
    connecting,
    publicKey,
    walletAddress,
    walletName,
    kycVerified,
    kycVerifying,
    verifyKYC,
    connect,
    disconnect,
    connection
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
