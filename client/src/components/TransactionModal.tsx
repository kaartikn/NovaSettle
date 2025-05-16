import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hash: string;
  message?: string;
}

export default function TransactionModal({ isOpen, onClose, hash, message = "Transaction successful" }: TransactionModalProps) {
  // Check if it's a simulated transaction (starts with "simulated-")
  const isSimulated = hash.startsWith('simulated-');
  
  // Base58 validation for Solana addresses and transaction signatures
  const isValidBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,98}$/.test(hash);
  
  // Determine whether this is a transaction signature or token address
  const isLikelyTransactionSignature = hash.length >= 87; // Transaction signatures are longer
  const isLikelyTokenAddress = isValidBase58 && hash.length >= 32 && hash.length <= 50; // Token addresses are shorter
  
  // Determine explorer URL
  let explorerUrl;
  if (isLikelyTransactionSignature) {
    explorerUrl = `https://explorer.solana.com/tx/${hash}?cluster=devnet`;
  } else if (isLikelyTokenAddress) {
    explorerUrl = `https://explorer.solana.com/address/${hash}?cluster=devnet`;
  } else {
    explorerUrl = undefined;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="p-6 flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          
          <h3 className="text-xl font-bold mb-2">Transaction Successful</h3>
          <p className="text-gray-600 text-center mb-6">
            {isSimulated 
              ? "This is a simulated transaction for demonstration purposes." 
              : message}
          </p>
          
          <div className="w-full bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {isSimulated ? "Simulation ID" : isLikelyTokenAddress ? "Solana Token Address" : "Transaction Hash"}
              </span>
              
              {explorerUrl && (
                <a 
                  href={explorerUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[hsl(var(--solana-blue))]"
                >
                  View on Explorer
                </a>
              )}
            </div>
            <p className="text-sm font-mono break-all">{hash}</p>
            
            {isSimulated ? (
              <p className="text-xs text-amber-600 mt-2">
                Note: This is a simulated transaction running in development mode. 
                In production, this would be an actual blockchain transaction.
              </p>
            ) : isLikelyTokenAddress ? (
              <p className="text-xs text-green-600 mt-2">
                This is a real Solana token address on devnet. You can view it on the Solana Explorer.
              </p>
            ) : null}
          </div>
          
          <Button 
            className="w-full py-3 bg-[hsl(var(--dark-blue))] text-white rounded-lg"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
