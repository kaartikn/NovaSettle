import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWallet } from '../context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { getSolBalance, requestDevnetAirdrop } from '../lib/solana';
import { Badge } from '@/components/ui/badge';
import { PublicKey, Connection } from '@solana/web3.js';
import KYCVerificationModal from '../components/KYCVerificationModal';

export default function Settings() {
  const { connected, walletAddress, walletName, connection, kycVerified, kycVerifying } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('wallet');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  
  // Handler for requesting airdrop (on Devnet)
  const requestAirdrop = async () => {
    if (!connected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to request an airdrop",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a connection to the Solana devnet
      const devnetConnection = new Connection('https://api.devnet.solana.com');
      
      // Request 1 SOL from the devnet faucet (free test tokens)
      const signature = await requestDevnetAirdrop(
        devnetConnection,
        walletAddress,
        1 // Request 1 SOL
      );
      
      console.log("Airdrop successful, transaction signature:", signature);
      
      toast({
        title: "Airdrop successful",
        description: "1 SOL has been airdropped to your wallet",
      });
      
      // Update balance
      fetchBalance();
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      toast({
        title: "Airdrop failed",
        description: error instanceof Error ? error.message : "Failed to request SOL airdrop",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch SOL balance
  const fetchBalance = async () => {
    if (!connected || !walletAddress) return;
    
    try {
      const balance = await getSolBalance(connection, walletAddress);
      setSolBalance(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };
  
  // Fetch balance when wallet is connected
  useEffect(() => {
    if (connected && walletAddress) {
      fetchBalance();
    }
  }, [connected, walletAddress]);
  
  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile settings have been saved",
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved",
    });
  };
  
  return (
    <div className="p-4 md:p-6">
      {/* KYC Verification Modal */}
      <KYCVerificationModal 
        isOpen={kycModalOpen} 
        onClose={() => setKycModalOpen(false)} 
      />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
      </div>
      
      {/* KYC Verification Card - Always visible when connected */}
      {connected && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Identity Verification (KYC)</CardTitle>
            <CardDescription>Verify your identity to unlock all platform features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-md font-medium mb-1">KYC Status</h3>
                  <p className="text-sm text-gray-500">
                    Identity verification is required to create and buy loans
                  </p>
                </div>
                <div>
                  {kycVerified ? (
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800">Not Verified</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-start pt-2">
                <Button 
                  className={`${kycVerified ? 'bg-gray-200 text-gray-800' : 'bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))]'} font-semibold`}
                  onClick={() => setKycModalOpen(true)}
                  disabled={kycVerified || kycVerifying}
                >
                  {kycVerifying ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : kycVerified ? (
                    'Verification Complete'
                  ) : (
                    'Complete KYC Verification'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Developer Tools Card - Always visible regardless of wallet connection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Developer Tools</CardTitle>
          <CardDescription>Tools for testing and development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col">
              <h3 className="text-md font-medium mb-2">Reset Application Data</h3>
              <p className="text-sm text-gray-500 mb-4">
                Reset the application to its initial state. This will remove all purchased loans and reset the marketplace listings.
              </p>
              
              <div className="flex items-start">
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/dev/reset', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                      
                      if (response.ok) {
                        toast({
                          title: "Application reset successful",
                          description: "All loans have been reset to their initial state.",
                        });
                      } else {
                        throw new Error("Failed to reset application data");
                      }
                    } catch (error) {
                      console.error('Error resetting application:', error);
                      toast({
                        title: "Reset failed",
                        description: error instanceof Error ? error.message : "Failed to reset application data",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Reset Application Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!connected ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                <path d="M17 11h4a2 2 0 0 1 0 4h-4"/>
                <path d="M17 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-500 mb-4">Please connect your wallet to access wallet settings.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="wallet" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="wallet" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Settings</CardTitle>
                  <CardDescription>View and manage your connected wallet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Connected Wallet</Label>
                    <div className="flex items-center">
                      <Badge className="bg-green-100 text-green-800 mr-2">Connected</Badge>
                      <span className="font-medium">{walletName}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="flex items-center">
                      <code className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                        {walletAddress}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-8 w-8 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(walletAddress || '');
                          toast({
                            title: "Copied to clipboard",
                            description: "Wallet address copied to clipboard",
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SOL Balance</Label>
                    <div className="flex items-center">
                      {solBalance !== null ? (
                        <span className="font-medium">{solBalance.toFixed(4)} SOL</span>
                      ) : (
                        <span className="text-gray-500">Loading balance...</span>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={fetchBalance}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button 
                        className="bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] font-semibold"
                        onClick={requestAirdrop}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[hsl(var(--dark-blue))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Request SOL Airdrop (Devnet)'
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (walletAddress) {
                            window.open(`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`, '_blank');
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Network Settings</CardTitle>
                  <CardDescription>Manage blockchain network settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Current Network</Label>
                        <p className="text-sm text-gray-500">Connected to Solana Devnet</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">Devnet</Badge>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-4">
                        This application currently only supports Solana Devnet for testing purposes.
                      </p>
                      <Button variant="outline" disabled>
                        Switch to Mainnet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="Enter your username" defaultValue="solanaDev" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Enter your email" defaultValue="user@example.com" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea 
                        id="bio" 
                        className="w-full min-h-[100px] p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" 
                        placeholder="Tell us about yourself..."
                        defaultValue="Solana DeFi enthusiast and developer."
                      ></textarea>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-4">
                      <Label htmlFor="darkMode" className="cursor-pointer">Enable Dark Mode</Label>
                      <Switch 
                        id="darkMode" 
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <Button 
                        className="bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] font-semibold"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSaveProfile();
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="notifications">Notifications</Label>
                          <p className="text-sm text-gray-500">Receive app notifications</p>
                        </div>
                        <Switch 
                          id="notifications" 
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive email updates</p>
                        </div>
                        <Switch 
                          id="emailNotifications" 
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="font-medium">Notification Types</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input type="checkbox" id="loanUpdates" className="rounded border-gray-200 mr-2" defaultChecked />
                          <Label htmlFor="loanUpdates">Loan status updates</Label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="repaymentReminders" className="rounded border-gray-200 mr-2" defaultChecked />
                          <Label htmlFor="repaymentReminders">Repayment reminders</Label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="marketplaceAlerts" className="rounded border-gray-200 mr-2" defaultChecked />
                          <Label htmlFor="marketplaceAlerts">New marketplace listings</Label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="securityAlerts" className="rounded border-gray-200 mr-2" defaultChecked />
                          <Label htmlFor="securityAlerts">Security alerts</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <Button 
                        className="bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] font-semibold"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSaveNotifications();
                        }}
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
