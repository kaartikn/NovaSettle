import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useKyc } from '../context/KycContext';
import { buyLoanToken } from '../lib/solana';
import { useToast } from '@/hooks/use-toast';
import { getPhantomConnectionStatus } from '../lib/phantom';
import KYCVerificationModal from './KYCVerificationModal';
import { Connection } from '@solana/web3.js';

// Extend window object to include phantom property
declare global {
  interface Window {
    phantom?: {
      solana?: any;
    };
  }
}

interface LoanCardProps {
  id: number;
  title: string;
  isNew?: boolean;
  isPopular?: boolean;
  isHighYield?: boolean;
  postedTime: string;
  loanAmount: string;
  loanToken: string;
  collateralAmount: string;
  collateralToken: string;
  apr: string;
  termDays: string;
  collateralizationRatio: number;
  tokenAddress: string;
  creator: string;
  onBuySuccess: (hash: string) => void;
}

export default function LoanCard({
  id,
  title,
  isNew,
  isPopular,
  isHighYield,
  postedTime,
  loanAmount,
  loanToken,
  collateralAmount,
  collateralToken,
  apr,
  termDays,
  collateralizationRatio,
  tokenAddress,
  creator,
  onBuySuccess
}: LoanCardProps) {
  // Get the wallet address from the context
  const { connected, connection, publicKey, walletAddress } = useWallet();
  const userWalletAddress = walletAddress;
  const { isVerified } = useKyc();
  const [loading, setLoading] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Determine badge style
  let badgeClass = '';
  let badgeText = '';
  
  if (isNew) {
    badgeClass = 'bg-green-100 text-green-800';
    badgeText = 'New';
  } else if (isPopular) {
    badgeClass = 'bg-blue-100 text-blue-800';
    badgeText = 'Popular';
  } else if (isHighYield) {
    badgeClass = 'bg-yellow-100 text-yellow-800';
    badgeText = 'High Yield';
  }
  
  // Determine icon color
  let iconColorClass = '';
  
  if (collateralToken === 'SOL') {
    iconColorClass = 'bg-[hsl(var(--solana-green))] bg-opacity-10 text-[hsl(var(--solana-green))]';
  } else if (collateralToken === 'BTC') {
    iconColorClass = 'bg-[hsl(var(--solana-purple))] bg-opacity-10 text-[hsl(var(--solana-purple))]';
  } else {
    iconColorClass = 'bg-[hsl(var(--solana-blue))] bg-opacity-10 text-[hsl(var(--solana-blue))]';
  }
  
  // Determine progress bar color based on collateralization ratio
  let progressBarColor = 'bg-green-500';
  if (collateralizationRatio < 150) {
    progressBarColor = 'bg-red-500';
  } else if (collateralizationRatio < 165) {
    progressBarColor = 'bg-yellow-500';
  }
  
  const handleBuyLoan = async () => {
    // Check wallet status using both the context and our direct Phantom check
    const phantomStatus = getPhantomConnectionStatus();
    const isWalletConnected = connected || phantomStatus.isConnected;
    const userPublicKey = publicKey || phantomStatus.publicKey;
    
    if (!isWalletConnected || !userPublicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy this loan",
        variant: "destructive"
      });
      return;
    }
    
    // Strictly enforce KYC verification
    if (!isVerified) {
      setKycModalOpen(true);
      toast({
        title: "KYC Verification Required",
        description: "You must complete KYC verification before buying loans.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log(`Buying loan token using wallet: ${phantomStatus.address || 'Unknown'}`);
      
      // Get Phantom provider from our phantom.ts helper
      const provider = (window as any).phantom?.solana;
      if (!provider || !provider.isPhantom) {
        throw new Error("Phantom wallet not installed");
      }
      
      // Create a connection to the Solana network (devnet)
      const connection = new Connection('https://api.devnet.solana.com');
      
      // Execute the transaction using our buyLoanToken function
      console.log("Executing transaction on the Solana devnet");
      const signature = await buyLoanToken(
        connection,
        provider, // Pass the Phantom provider directly
        tokenAddress, // The loan token mint address
        parseFloat(loanAmount) // The loan amount
      );
      
      console.log("Transaction successful, signature:", signature);
      
      // Update loan ownership in our database
      try {
        console.log("Purchasing loan with wallet address:", phantomStatus.address);
        console.log("Wallet address from Phantom status:", phantomStatus);
        console.log("Wallet address from context:", walletAddress);
        
        const ownerWalletAddress = walletAddress || phantomStatus.address;
        
        if (!ownerWalletAddress) {
          throw new Error("Could not determine wallet address for purchase");
        }
        
        console.log("IMPORTANT - Using wallet address:", ownerWalletAddress);
        
        const response = await fetch(`/api/loans/${id}/purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ownerAddress: ownerWalletAddress,
            transactionHash: signature
          }),
        });
        
        if (!response.ok) {
          console.error("Failed to update loan ownership:", await response.text());
        } else {
          console.log("Loan ownership updated in database");
          const responseData = await response.json();
          console.log("Updated loan data:", responseData);
        }
      } catch (err) {
        console.error("Error updating loan ownership:", err);
      }
      
      // Call onBuySuccess to show transaction modal with the real signature
      onBuySuccess(signature);
      
      // Trigger events to refresh both MyLoans page and Marketplace
      console.log("Dispatching loan-purchased event with loan data");
      
      // For MyLoans component
      window.dispatchEvent(new CustomEvent('loan-purchased', {
        detail: { 
          loanData: {
            id,
            loanToken,
            loanAmount,
            collateralToken,
            collateralAmount,
            apr,
            termDays,
            tokenAddress,
            creator: walletAddress || "Unknown", 
            createdAt: new Date().toISOString(),
            status: "active"
          },
          transactionHash: signature 
        }
      }));
      
      // Dispatch a global event for the Marketplace to listen for purchased loans
      window.dispatchEvent(new CustomEvent('marketplace-update', {
        detail: {
          purchasedLoanId: id,
          transactionHash: signature
        }
      }));
      
      toast({
        title: "Loan purchased successfully",
        description: "The transaction has been confirmed on the Solana network"
      });
    } catch (error) {
      console.error('Error buying loan:', error);
      toast({
        title: "Failed to purchase loan",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KYCVerificationModal 
        isOpen={kycModalOpen} 
        onClose={() => setKycModalOpen(false)} 
      />
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full ${iconColorClass} flex items-center justify-center mr-3`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="8" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs text-gray-500">Posted {postedTime}</p>
            </div>
          </div>
          {badgeText && (
            <span className={`text-xs py-1 px-2 ${badgeClass} rounded-full`}>{badgeText}</span>
          )}
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
              <p className="font-semibold">{loanAmount} {loanToken}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Collateral</p>
              <p className="font-semibold">{collateralAmount} {collateralToken}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">APR</p>
              <p className="font-semibold text-[hsl(var(--solana-green))]">{apr}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Term</p>
              <p className="font-semibold">{termDays} days</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Collateralization Ratio</p>
              <p className="text-sm font-medium">{collateralizationRatio}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${progressBarColor} h-2 rounded-full`} 
                style={{ width: `${Math.min(100, collateralizationRatio / 2)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Creator badge if the loan was created by user */}
          {creator === userWalletAddress && (
            <div className="bg-blue-50 border-l-4 border-blue-500 px-4 py-2 mb-3">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                <span className="text-sm font-medium text-blue-700">Created by you</span>
              </div>
            </div>
          )}
          
          <button 
            className={`w-full mt-4 py-2 ${
              // If created by user, show cancel button
              creator === userWalletAddress 
                ? 'bg-amber-600 hover:bg-amber-700'
                : isVerified 
                  ? 'bg-[hsl(var(--dark-blue))] hover:bg-opacity-90' 
                  : 'bg-gray-400 cursor-not-allowed'
            } text-white rounded-lg transition flex items-center justify-center`}
            onClick={creator === userWalletAddress ? () => {} : (isVerified ? handleBuyLoan : () => setKycModalOpen(true))}
            disabled={loading || (!isVerified && creator !== userWalletAddress)}
            title={
              creator === userWalletAddress 
                ? "Cancel this loan token" 
                : (isVerified ? "Purchase this loan" : "KYC verification required to buy loans")
            }
          >
            {loading ? (
              "Processing..."
            ) : creator === userWalletAddress ? (
              'Cancel Loan Token'
            ) : isVerified ? (
              'Buy Loan Token'
            ) : (
              'KYC Required'
            )}
          </button>
        </div>
      </div>
    </>
  );
}