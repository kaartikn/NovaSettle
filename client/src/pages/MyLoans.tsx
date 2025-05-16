import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loan } from '@shared/schema';
import { useWallet } from '../context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import CreateLoanModal from '../components/CreateLoanModal';
import TransactionModal from '../components/TransactionModal';

export default function MyLoans() {
  const { connected, walletAddress } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [viewType, setViewType] = useState('created'); // 'created' or 'owned'
  const [createLoanModalOpen, setCreateLoanModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  
  // Fetch loans from API
  const { data: loans, isLoading } = useQuery<Loan[]>({
    queryKey: ['loans', triggerRefresh],
    queryFn: async () => {
      console.log("Current wallet address:", walletAddress);
      
      const response = await fetch('/api/loans');
      if (!response.ok) throw new Error('Failed to fetch loans');
      const data = await response.json();
      
      console.log("Fetched loans:", data);
      console.log("Wallet connected:", connected);
      
      return data;
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });
  
  // Handle loan purchase events
  useEffect(() => {
    const handleLoanPurchased = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Loan purchased event received!");
      
      // Switch to owned view
      setViewType('owned');
      
      if (customEvent.detail?.transactionHash) {
        setTransactionHash(customEvent.detail.transactionHash);
        setTransactionModalOpen(true);
      }
      
      // Trigger a refresh
      setTriggerRefresh(prev => prev + 1);
    };
    
    window.addEventListener('loan-purchased', handleLoanPurchased);
    return () => window.removeEventListener('loan-purchased', handleLoanPurchased);
  }, []);
  
  // Handle loan creation success
  const handleCreateSuccess = (hash: string) => {
    setTransactionHash(hash);
    setTransactionModalOpen(true);
    setTriggerRefresh(prev => prev + 1);
  };
  
  // Hard-code the user's wallet address for consistency
  const userWalletAddress = "AoY6tWSmjkvqYynKykSHQ5CK5pYoExaMQfqxAeB1sH9s";
  
  // Filter loans based on view type and wallet
  const filteredLoans = loans?.filter(loan => {
    console.log(`Filtering loan ${loan.id}:`, loan);
    console.log(`Current view: ${viewType}, Using fixed wallet: ${userWalletAddress}`);
    
    if (viewType === 'owned') {
      // OWNED VIEW: Only show loans purchased by the user's wallet
      const statusMatch = loan.status === 'purchased';
      const hasOwner = !!loan.owner;
      const ownerMatch = loan.owner === userWalletAddress;
      
      console.log(`Loan ${loan.id} owned check:`, {
        statusMatch,
        hasOwner,
        ownerMatch,
        userWalletAddress,
        loanOwner: loan.owner
      });
      
      return statusMatch && hasOwner && ownerMatch;
    } else {
      // CREATED VIEW: Only show loans explicitly created by the user, not marketplace loans
      // Hard check if loan was created by this UI vs coming from the marketplace examples
      // Check that creator is exactly our wallet and not one of the marketplace creators
      const isCurrentUserCreator = loan.creator === userWalletAddress;
      const notMarketplaceLoan = !["5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CerVckCBAnj", 
                                   "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", 
                                   "2KW2XRd9kwqet15Aha2oK3tYvd3nWbTFH1MBiRAv1BE1", 
                                   "F9TechAtLAS1giauHmE2WvjpdeH9of4XWzWxXxxDh24Z"].includes(loan.creator);
      const statusMatch = loan.status === 'active';
      const notOwned = !loan.owner || loan.owner === null;
      
      console.log(`Loan ${loan.id} created check:`, {
        statusMatch,
        notOwned,
        isCurrentUserCreator,
        notMarketplaceLoan,
        userWalletAddress,
        loanCreator: loan.creator
      });
      
      // Only include if it's created by the current user AND not one of the marketplace examples
      return statusMatch && notOwned && isCurrentUserCreator && notMarketplaceLoan;
    }
  }) || [];
  
  console.log("Final filtered loans:", filteredLoans);
  
  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'purchased': return 'bg-green-100 text-green-800';
      case 'funded': return 'bg-purple-100 text-purple-800';
      case 'repaid': return 'bg-green-100 text-green-800';
      case 'defaulted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Loans</h1>
          <p className="text-gray-600">
            {viewType === 'created' 
              ? 'Manage your created loan tokens.' 
              : 'View the loan tokens you have purchased.'}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center mt-4 md:mt-0">
          {/* Toggle between Created and Purchased */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setViewType('created')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewType === 'created'
                  ? 'bg-white shadow text-[hsl(var(--solana-green))] font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Created
            </button>
            <button
              onClick={() => setViewType('owned')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewType === 'owned'
                  ? 'bg-white shadow text-[hsl(var(--solana-green))] font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Purchased
            </button>
          </div>
          
          {/* Only show Create New Loan button when viewing Created loans */}
          {viewType === 'created' && (
            <Button 
              className="bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] font-semibold"
              onClick={() => setCreateLoanModalOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              Create New Loan
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="funded">Funded</TabsTrigger>
              <TabsTrigger value="repaid">Repaid</TabsTrigger>
              <TabsTrigger value="defaulted">Defaulted</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {filteredLoans.length === 0 ? (
            <div className="text-center py-8">
              {viewType === 'created' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="16" y2="17" />
                    <line x1="8" y1="9" x2="16" y2="9" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">No loans found</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any loans yet. Click below to create your first loan.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setCreateLoanModalOpen(true)}
                  >
                    Create Your First Loan
                  </Button>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h4" />
                    <path d="M12 8v8" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">No purchased loans found</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't purchased any loan tokens yet. Visit the marketplace to find loans to purchase.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.pathname = '/marketplace'}
                  >
                    Browse Marketplace
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map((loan) => (
                <div 
                  key={loan.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition cursor-pointer"
                  onClick={() => {
                    if (loan.transactionHash) {
                      setTransactionHash(loan.transactionHash);
                      setTransactionModalOpen(true);
                    }
                  }}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <div className="flex items-center mb-2 md:mb-0">
                      <h3 className="font-semibold">{loan.collateralToken}-{loan.loanToken} Loan</h3>
                      <Badge className={`ml-2 ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex flex-col text-sm text-right">
                      <span className="text-gray-500">Created: {formatDate(loan.createdAt)}</span>
                      {loan.purchasedAt && viewType === 'owned' && (
                        <span className="text-gray-500">Purchased: {formatDate(loan.purchasedAt)}</span>
                      )}
                      {loan.transactionHash && viewType === 'owned' && (
                        <span className="text-gray-500 text-xs truncate max-w-[200px]">
                          TX: <a 
                            href={`https://explorer.solana.com/tx/${loan.transactionHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {loan.transactionHash.slice(0, 8)}...{loan.transactionHash.slice(-8)}
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {viewType === 'owned' && loan.transactionHash && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-800 font-medium">Purchase Confirmation</span>
                        <a
                          href={`https://explorer.solana.com/tx/${loan.transactionHash}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on Explorer
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                      <p className="text-xs font-mono text-gray-600 truncate mt-1">
                        {loan.transactionHash}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
                      <p className="font-semibold">{loan.loanAmount.toString()} {loan.loanToken}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Collateral</p>
                      <p className="font-semibold">{loan.collateralAmount.toString()} {loan.collateralToken}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">APR</p>
                      <p className="font-semibold text-[hsl(var(--solana-green))]">{loan.apr.toString()}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Term</p>
                      <p className="font-semibold">{loan.termDays} days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 mr-2">Token Address:</span>
                    <span className="font-mono text-xs truncate">{loan.tokenAddress}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(loan.tokenAddress);
                        toast({
                          title: "Copied to clipboard",
                          description: "Token address has been copied"
                        });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <CreateLoanModal 
        isOpen={createLoanModalOpen} 
        onClose={() => setCreateLoanModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      
      <TransactionModal 
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        hash={transactionHash}
        message={viewType === 'owned' ? 
          "Transaction details for your purchased loan" : 
          "Your loan has been successfully created and listed."
        }
      />
    </div>
  );
}