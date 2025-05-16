import { PublicKey } from '@solana/web3.js';

/**
 * Interface for the Phantom Wallet Provider
 */
interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toString: () => string } | null;
  isConnected?: boolean;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

/**
 * Interface for the Phantom Wallet Window
 */
interface PhantomWindow extends Window {
  phantom?: {
    solana?: PhantomProvider;
  };
}

/**
 * Get Phantom provider from window
 */
function getProvider(): PhantomProvider | null {
  if ('phantom' in window) {
    const win = window as PhantomWindow;
    const provider = win.phantom?.solana;
    
    if (provider?.isPhantom) {
      return provider;
    }
  }
  
  return null;
}

/**
 * Check if Phantom wallet is installed
 */
export function isPhantomInstalled(): boolean {
  return getProvider() !== null;
}

/**
 * Connect to Phantom wallet
 */
export async function connectPhantom(): Promise<{ publicKey: PublicKey; address: string } | null> {
  try {
    const provider = getProvider();
    
    if (!provider) {
      console.error('Phantom wallet not installed');
      return null;
    }
    
    console.log('Connecting to Phantom wallet...');
    const response = await provider.connect();
    console.log('Phantom connection response:', response);
    
    if (response.publicKey) {
      const publicKey = new PublicKey(response.publicKey.toString());
      const address = publicKey.toString();
      
      console.log('Connected to Phantom wallet address:', address);
      return { 
        publicKey,
        address
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error connecting to Phantom wallet:', error);
    throw error;
  }
}

/**
 * Disconnect from Phantom wallet
 */
export async function disconnectPhantom(): Promise<void> {
  try {
    const provider = getProvider();
    
    if (!provider) {
      console.error('Phantom wallet not installed');
      return;
    }
    
    console.log('Disconnecting from Phantom wallet...');
    await provider.disconnect();
    console.log('Disconnected from Phantom wallet');
  } catch (error) {
    console.error('Error disconnecting from Phantom wallet:', error);
    throw error;
  }
}

/**
 * Get Phantom connection status
 */
export function getPhantomConnectionStatus(): { 
  isInstalled: boolean; 
  isConnected: boolean;
  publicKey: PublicKey | null;
  address: string | null;
} {
  const provider = getProvider();
  
  if (!provider) {
    return {
      isInstalled: false,
      isConnected: false,
      publicKey: null,
      address: null
    };
  }
  
  const isConnected = provider.isConnected || false;
  let publicKey: PublicKey | null = null;
  let address: string | null = null;
  
  if (provider.publicKey) {
    try {
      publicKey = new PublicKey(provider.publicKey.toString());
      address = publicKey.toString();
    } catch (e) {
      console.error('Error converting Phantom public key:', e);
    }
  }
  
  return {
    isInstalled: true,
    isConnected,
    publicKey,
    address
  };
}

/**
 * Listen for Phantom wallet events
 */
export function addPhantomEventListener(
  event: 'connect' | 'disconnect' | 'accountChanged', 
  callback: (publicKey?: PublicKey) => void
): () => void {
  const provider = getProvider();
  
  if (!provider) {
    console.error('Phantom wallet not installed');
    return () => {};
  }
  
  const handler = (payload: any) => {
    if (payload?.publicKey) {
      try {
        const publicKey = new PublicKey(payload.publicKey.toString());
        callback(publicKey);
      } catch (e) {
        console.error('Error in Phantom event handler:', e);
        callback();
      }
    } else {
      callback();
    }
  };
  
  provider.on(event, handler);
  
  // Return a cleanup function
  return () => {
    provider.removeListener(event, handler);
  };
}