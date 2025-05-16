import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import LoanCard from '../components/LoanCard';
import { Loan } from '@shared/schema';
import TransactionModal from '../components/TransactionModal';
import { useWallet } from '../context/WalletContext';

export default function Marketplace() {
  const { walletAddress } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [loanFilter, setLoanFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  
  const queryClient = useQueryClient();
  
  // Fetch loans data with auto-refresh
  const { data: loans, isLoading, isError } = useQuery<Loan[]>({
    queryKey: ['/api/loans'],
    refetchInterval: 3000 // Refresh every 3 seconds to see updates
  });
  
  // Listen for marketplace update events (when a loan is purchased)
  useEffect(() => {
    const handleMarketplaceUpdate = (event: Event) => {
      console.log("Marketplace received update event");
      // Invalidate and refetch loans data immediately
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
    };
    
    // Add event listener
    window.addEventListener('marketplace-update', handleMarketplaceUpdate);
    
    // Clean up
    return () => {
      window.removeEventListener('marketplace-update', handleMarketplaceUpdate);
    };
  }, [queryClient]);
  
  // Filter and sort loans
  const filteredLoans = loans
    ? loans
        .filter(loan => {
          // Only show active loans that haven't been purchased
          return loan.status === 'active' && !loan.owner;
        })
        .filter(loan => {
          // Apply search filter
          if (searchQuery) {
            return (
              loan.loanToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
              loan.collateralToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
              loan.tokenAddress.toLowerCase().includes(searchQuery.toLowerCase())
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
        // Apply sorting
        .sort((a, b) => {
          if (sortOrder === 'newest') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (sortOrder === 'oldest') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          } else if (sortOrder === 'highest-apr') {
            return Number(b.apr) - Number(a.apr);
          } else if (sortOrder === 'lowest-apr') {
            return Number(a.apr) - Number(b.apr);
          }
          return 0;
        })
    : [];
  
  // Handle loan buy success
  const handleBuySuccess = (hash: string) => {
    setTransactionHash(hash);
    setTransactionModalOpen(true);
  };
  
  // Calculate time since posting
  const getTimeSince = (date: string | Date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
    
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
      {/* Marketplace Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Loan Marketplace</h1>
        <p className="text-gray-600">Browse and purchase loan tokens from the marketplace.</p>
      </div>
      
      {/* Filters */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by token..."
              className="pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          
          <div>
            <Select
              value={loanFilter}
              onValueChange={setLoanFilter}
            >
              <SelectTrigger>
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
          
          <div>
            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest-apr">Highest APR</SelectItem>
                <SelectItem value="lowest-apr">Lowest APR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Results summary */}
      <div className="mb-4">
        <p className="text-gray-500">
          {isLoading 
            ? 'Loading loans...' 
            : isError 
              ? 'Error loading loans' 
              : `Showing ${filteredLoans.length} of ${loans?.length || 0} loans`}
        </p>
      </div>
      
      {/* Loan Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
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
            <p className="text-gray-500">No loans found matching your criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              id={loan.id}
              title={`${loan.collateralToken}-${loan.loanToken} Loan`}
              isNew={loan.createdAt ? new Date(loan.createdAt).getTime() > Date.now() - 3600000 : false} // New if less than 1 hour old
              isPopular={Number(loan.apr) > 8 && Number(loan.apr) < 12}
              isHighYield={Number(loan.apr) > 12}
              postedTime={loan.createdAt ? getTimeSince(loan.createdAt) : "Recently"}
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
      
      {/* Transaction Modal */}
      <TransactionModal 
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        hash={transactionHash}
        message="Your loan token has been successfully purchased."
      />
    </div>
  );
}
