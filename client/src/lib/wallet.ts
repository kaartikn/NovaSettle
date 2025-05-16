import { PublicKey } from '@solana/web3.js';

// Define types for wallet providers
type Provider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  isConnected?: boolean;
  publicKey?: PublicKey | string | any;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
};

// Class to handle wallet interactions
export class Wallet {
  name: string;
  provider: Provider | null = null;
  publicKey: PublicKey | null = null;

  constructor(name: string) {
    this.name = name;
    this.detectProvider();
  }

  // Check if a wallet extension is installed
  static isWalletAvailable(walletName: string): boolean {
    const windowObj = window as any;
    
    switch (walletName.toLowerCase()) {
      case 'phantom':
        return !!windowObj.phantom?.solana;
      case 'solflare':
        return !!windowObj.solflare;
      case 'backpack':
        return !!windowObj.backpack?.solana;
      default:
        return false;
    }
  }

  // Detect wallet provider based on name
  private detectProvider() {
    const windowObj = window as any;
    console.log('Detecting wallet provider for:', this.name);
    
    switch (this.name.toLowerCase()) {
      case 'phantom':
        if (windowObj.phantom?.solana) {
          console.log('Phantom provider found:', windowObj.phantom.solana);
          this.provider = windowObj.phantom.solana;
          
          // Debug info about the provider
          if (this.provider) {
            console.log('Provider info:');
            console.log('- isPhantom:', this.provider.isPhantom ? 'Yes' : 'No');
            console.log('- isConnected:', this.provider.isConnected ? 'Yes' : 'No');
            console.log('- Has publicKey:', this.provider.publicKey ? 'Yes' : 'No');
          }
        } else {
          console.log('Phantom provider not found');
        }
        break;
      case 'solflare':
        this.provider = windowObj.solflare;
        break;
      case 'backpack':
        this.provider = windowObj.backpack?.solana;
        break;
      default:
        throw new Error(`Unsupported wallet: ${this.name}`);
    }
  }

  // Connect to wallet
  async connect(): Promise<boolean> {
    if (!this.provider) {
      console.log(`${this.name} wallet is not installed`);
      
      if (this.name.toLowerCase() === 'phantom') {
        window.open('https://phantom.app/', '_blank');
      } else if (this.name.toLowerCase() === 'solflare') {
        window.open('https://solflare.com/', '_blank');
      } else if (this.name.toLowerCase() === 'backpack') {
        window.open('https://www.backpack.app/', '_blank');
      }
      
      throw new Error(`${this.name} wallet is not installed. Please install the extension and try again.`);
    }

    try {
      console.log(`Attempting to connect to ${this.name} wallet...`);
      
      // For Phantom wallet, use the most direct approach
      if (this.name.toLowerCase() === 'phantom') {
        console.log('Using direct connect approach for Phantom wallet');
        
        // Get the phantom object directly
        const phantom = (window as any).phantom;
        
        if (phantom && phantom.solana) {
          console.log('Phantom methods:', Object.keys(phantom.solana));
          
          // Try the direct connect method
          try {
            const response = await phantom.solana.connect();
            console.log('Direct Phantom connection successful:', response);
            
            if (response && response.publicKey) {
              this.publicKey = response.publicKey;
              return true;
            }
          } catch (e: any) {
            console.error('Direct connection error:', e);
            // If we get a user rejection error, that means the wallet is working
            // But the user clicked "Cancel" in the wallet popup
            if (e.message && e.message.includes('User rejected')) {
              throw new Error('Connection was rejected by the user.');
            }
            
            // For other errors, continue to the fallback approach
            console.log('Falling back to provider approach');
          }
        }
      }
      
      // Standard approach for all other wallets
      console.log(`Using standard approach for ${this.name} wallet`);
      
      // Log all provider methods to help debug
      if (this.provider) {
        console.log('Provider methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.provider)));
      }
      
      const response = await this.provider.connect();
      console.log(`Connected to ${this.name} wallet:`, response.publicKey.toString());
      this.publicKey = response.publicKey;
      return true;
    } catch (error) {
      console.error(`Error connecting to ${this.name} wallet:`, error);
      throw error;
    }
  }

  // Disconnect from wallet
  async disconnect(): Promise<void> {
    if (!this.provider) {
      return;
    }

    try {
      await this.provider.disconnect();
      this.publicKey = null;
      console.log(`Disconnected from ${this.name} wallet`);
    } catch (error) {
      console.error(`Error disconnecting from ${this.name} wallet:`, error);
    }
  }
  
  // Sign a transaction (for future implementation)
  async signTransaction(transaction: any): Promise<any> {
    if (!this.provider || !this.provider.signTransaction) {
      throw new Error(`${this.name} wallet does not support transaction signing`);
    }
    
    try {
      return await this.provider.signTransaction(transaction);
    } catch (error) {
      console.error(`Error signing transaction with ${this.name} wallet:`, error);
      throw error;
    }
  }
  
  // Sign multiple transactions (for future implementation)
  async signAllTransactions(transactions: any[]): Promise<any[]> {
    if (!this.provider || !this.provider.signAllTransactions) {
      throw new Error(`${this.name} wallet does not support batch transaction signing`);
    }
    
    try {
      return await this.provider.signAllTransactions(transactions);
    } catch (error) {
      console.error(`Error signing transactions with ${this.name} wallet:`, error);
      throw error;
    }
  }
}
