import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../components/StatCard';
import LoanCard from '../components/LoanCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loan } from '@shared/schema';
import { useWallet } from '../context/WalletContext';
import CreateLoanModal from '../components/CreateLoanModal';
import TransactionModal from '../components/TransactionModal';
import KYCVerificationModal from '../components/KYCVerificationModal';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { connected, kycVerified } = useWallet();
  const { toast } = useToast();
  
  const [createLoanModalOpen, setCreateLoanModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loanFilter, setLoanFilter] = useState('all');
  const [kycModalOpen, setKycModalOpen] = useState(false);
  
  // Fetch loans data
  const { data: loans, isLoading, isError } = useQuery<Loan[]>({
    queryKey: ['/api/loans'],
  });
  
  // Filter and sort loans
  const filteredLoans = loans
    ? loans
        .filter(loan => {
          // Apply search filter
          if (searchQuery) {
            return (
              loan.loanToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
              loan.collateralToken.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          return true;
        })
        .filter(loan => {
          // Apply category filter
          if (loanFilter === 'high-apr') {
            return Number(loan.apr) > 10;
          } else if (loanFilter === 'low-risk') {
            return Number(loan.collateralAmount) > Number(loan.loanAmount) * 1.5;
          } else if (loanFilter === 'short-term') {
            return loan.termDays <= 30;
          }
          return true;
        })
        // Sort by creation date (newest first)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        // Limit to 3 items for the dashboard
        .slice(0, 3)
    : [];
  
  // Handle loan buy success
  const handleBuySuccess = (hash: string) => {
    setTransactionHash(hash);
    setTransactionMessage('Your loan token has been successfully purchased.');
    setTransactionModalOpen(true);
  };
  
  // Handle loan creation success
  const handleCreateSuccess = (hash: string) => {
    setTransactionHash(hash);
    setTransactionMessage('Your loan has been successfully created and listed.');
    setTransactionModalOpen(true);
  };
  
  // Calculate time since posting
  const getTimeSince = (date: string | Date) => {
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Convert to ISO string for consistent handling
    const dateStr = dateObj.toISOString();
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Dashboard Header with Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total Value Locked" 
            value="143,221 SOL"
            change={{ value: "+5.3% from last week", isPositive: true }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--solana-green))]">
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="8" />
              </svg>
            }
            iconColor="[hsl(var(--solana-green))]"
          />
          
          <StatCard 
            title="Active Loans" 
            value="1,287"
            change={{ value: "+12% from last week", isPositive: true }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--solana-purple))]">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
                <line x1="8" y1="9" x2="16" y2="9" />
              </svg>
            }
            iconColor="[hsl(var(--solana-purple))]"
          />
          
          <StatCard 
            title="Average APR" 
            value="8.74%"
            change={{ value: "-0.5% from last week", isPositive: false }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--solana-blue))]">
                <path d="M10 2v2.5" />
                <path d="M14 2v2.5" />
                <path d="M10 13v-2.5" />
                <path d="M10 19.5v-2" />
                <path d="M14 13v-2.5" />
                <path d="M14 19.5v-2" />
                <path d="M3 7.5h18" />
                <path d="M3 12h18" />
                <path d="M3 16.5h18" />
              </svg>
            }
            iconColor="[hsl(var(--solana-blue))]"
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <Button 
          className={`px-6 py-6 ${!connected ? 'bg-gray-400 cursor-not-allowed' : 'bg-[hsl(var(--solana-green))] hover:bg-opacity-90'} text-[hsl(var(--dark-blue))] font-semibold rounded-lg shadow-sm flex-1 flex items-center justify-center text-base`}
          onClick={() => {
            if (!connected) {
              toast({
                title: "Wallet not connected",
                description: "Please connect your wallet to create loans",
                variant: "destructive"
              });
              return;
            }
            
            // Remove KYC check and always allow loan creation
            setCreateLoanModalOpen(true);
          }}
          disabled={!connected}
          title="Create a new loan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
          <span>Create Loan</span>
        </Button>
        
        <Button
          variant="outline"
          className="px-6 py-6 border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold rounded-lg shadow-sm flex-1 flex items-center justify-center text-base"
          onClick={() => navigate('/marketplace')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M4 10V8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
            <path d="M1 18a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2Z" />
            <path d="M6 14v-3" />
            <path d="M10 14v-3" />
            <path d="M14 14v-3" />
            <path d="M18 14v-3" />
          </svg>
          <span>View Marketplace</span>
        </Button>
      </div>
      
      {/* Loan Listings Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <h2 className="text-xl font-bold">Recent Loan Listings</h2>
        
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search loans..."
              className="pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Select
              value={loanFilter}
              onValueChange={setLoanFilter}
            >
              <SelectTrigger className="w-full sm:w-auto min-w-[150px]">
                <SelectValue placeholder="Filter loans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                <SelectItem value="high-apr">High APR</SelectItem>
                <SelectItem value="low-risk">Low Risk</SelectItem>
                <SelectItem value="short-term">Short Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Loan Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-16 bg-gray-100"></div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j}>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-16"></div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded mt-4"></div>
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="col-span-3 p-6 text-center">
            <p className="text-red-500">Failed to load loans. Please try again later.</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="col-span-3 p-6 text-center">
            <p className="text-gray-500">No loans found. Create a new loan or adjust your filters.</p>
          </div>
        ) : (
          filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              id={loan.id}
              title={`${loan.collateralToken}-${loan.loanToken} Loan`}
              isNew={false} // Not showing as new since we don't have createdAt timestamps for examples
              isPopular={Number(loan.apr) > 8 && Number(loan.apr) < 12}
              isHighYield={Number(loan.apr) > 12}
              postedTime={"Recently"} // Default time since we don't have createdAt for examples
              loanAmount={loan.loanAmount.toString()}
              loanToken={loan.loanToken}
              collateralAmount={loan.collateralAmount.toString()}
              collateralToken={loan.collateralToken}
              apr={`${loan.apr}%`}
              termDays={loan.termDays.toString()}
              collateralizationRatio={165} // Hardcoded for now, would be calculated in real app
              tokenAddress={loan.tokenAddress}
              creator={loan.creator}
              onBuySuccess={handleBuySuccess}
            />
          ))
        )}
      </div>
      
      {/* View more button */}
      <div className="text-center">
        <Button 
          variant="outline"
          className="px-6 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          onClick={() => navigate('/marketplace')}
        >
          View More Loans
        </Button>
      </div>
      
      {/* Modals */}
      <KYCVerificationModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
      />
      
      <CreateLoanModal 
        isOpen={createLoanModalOpen} 
        onClose={() => setCreateLoanModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      
      <TransactionModal 
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        hash={transactionHash}
        message={transactionMessage}
      />
    </div>
  );
}
