import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWallet } from '../context/WalletContext';
import TransactionModal from '../components/TransactionModal';
import { Loan } from '@shared/schema';

export default function Investments() {
  const { connected, walletAddress } = useWallet();
  const [activeTab, setActiveTab] = useState('active');
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  
  // In a real implementation, this would fetch investments by wallet address
  // For now, we'll simulate by using loans API and filtering
  const { data: allLoans, isLoading, isError } = useQuery<Loan[]>({
    queryKey: ['/api/loans'],
    enabled: !!walletAddress && connected,
  });
  
  // Simulate purchased loans (in a real app, this would come from a separate API)
  // Assuming we purchased some loans with specific IDs
  const purchasedLoanIds = [1, 3]; // Simulated IDs of loans that were purchased
  
  // Filter investments (purchased loans)
  const investments = allLoans
    ? allLoans
        .filter(loan => purchasedLoanIds.includes(loan.id))
        .filter(loan => {
          if (activeTab === 'active') return loan.status === 'funded';
          if (activeTab === 'completed') return loan.status === 'repaid';
          if (activeTab === 'defaulted') return loan.status === 'defaulted';
          return true;
        })
    : [];
  
  // Calculate ROI (simulated for now)
  const calculateRoi = (loan: Loan) => {
    const principal = parseFloat(loan.loanAmount.toString());
    const apr = parseFloat(loan.apr.toString());
    const termDays = loan.termDays;
    
    // Simple interest calculation
    const dailyRate = apr / 365 / 100;
    const interest = principal * dailyRate * termDays;
    const roi = (interest / principal) * 100;
    
    return roi.toFixed(2);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Calculate maturity date
  const calculateMaturityDate = (createdDate: string, termDays: number) => {
    const date = new Date(createdDate);
    date.setDate(date.getDate() + termDays);
    return formatDate(date.toString());
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded':
        return 'bg-blue-100 text-blue-800';
      case 'repaid':
        return 'bg-green-100 text-green-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Simulate claiming interest
  const handleClaimInterest = (loanId: number) => {
    // In a real implementation, this would interact with a Solana program
    setTransactionHash(`simulated-transaction-hash-${loanId}-${Date.now()}`);
    setTransactionMessage('You have successfully claimed your interest.');
    setTransactionModalOpen(true);
  };
  
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Investments</h1>
        <p className="text-gray-600">Track the performance of your loan investments.</p>
      </div>
      
      {!connected ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                <path d="M17 11h4a2 2 0 0 1 0 4h-4"/>
                <path d="M17 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-500 mb-4">Please connect your wallet to view your investments.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Investment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="bg-[hsl(var(--solana-green))] bg-opacity-10 p-2 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--solana-green))]">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Capital Deployed</p>
                    <p className="text-2xl font-bold">5,240 USDC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="bg-[hsl(var(--solana-purple))] bg-opacity-10 p-2 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--solana-purple))]">
                      <path d="M12 22V8" />
                      <path d="m5 12 7-4 7 4" />
                      <path d="M5 16l7-4 7 4" />
                      <path d="M5 20l7-4 7 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interest Earned</p>
                    <p className="text-2xl font-bold">128.5 USDC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="bg-[hsl(var(--solana-blue))] bg-opacity-10 p-2 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--solana-blue))]">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average APR</p>
                    <p className="text-2xl font-bold">11.2%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Investments Table */}
          <Card>
            <CardHeader>
              <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="defaulted">Defaulted</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j}>
                            <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Failed to load your investments. Please try again later.</p>
                </div>
              ) : investments.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M17 18v-1a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v1" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">No {activeTab} investments found</h3>
                  <p className="text-gray-500 mb-4">You don't have any {activeTab} investments at the moment.</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = "/marketplace"}
                  >
                    Browse Marketplace
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {investments.map((loan) => (
                    <div key={loan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                        <div className="flex items-center mb-2 md:mb-0">
                          <h3 className="font-semibold">{loan.collateralToken}-{loan.loanToken} Loan</h3>
                          <Badge className={`ml-2 ${getStatusColor(loan.status)}`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">Purchased: {formatDate(loan.createdAt)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Principal</p>
                          <p className="font-semibold">{loan.loanAmount.toString()} {loan.loanToken}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Expected Return</p>
                          <p className="font-semibold text-[hsl(var(--solana-green))]">{calculateRoi(loan)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">APR</p>
                          <p className="font-semibold">{loan.apr.toString()}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Maturity Date</p>
                          <p className="font-semibold">{calculateMaturityDate(loan.createdAt, loan.termDays)}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 mr-2">Token:</span>
                          <span className="font-mono text-xs truncate">{loan.tokenAddress.substring(0, 8)}...{loan.tokenAddress.substring(loan.tokenAddress.length - 8)}</span>
                        </div>
                        
                        {loan.status === 'repaid' && (
                          <Button 
                            className="bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] font-semibold"
                            onClick={() => handleClaimInterest(loan.id)}
                          >
                            Claim Interest
                          </Button>
                        )}
                        
                        {loan.status === 'funded' && (
                          <Button variant="outline" disabled>
                            In Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Transaction Modal */}
      <TransactionModal 
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        hash={transactionHash}
        message={transactionMessage}
      />
    </div>
  );
}
