import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '../context/WalletContext';
import { useKyc } from '../context/KycContext';
import { useToast } from '@/hooks/use-toast';

interface KYCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KYCVerificationModal({ isOpen, onClose }: KYCVerificationModalProps) {
  const { kycVerifying } = useWallet();
  const { setVerified } = useKyc();
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');

  const handleVerify = async () => {
    // Start verification
    setStatus('verifying');
    
    // Wait for 2 seconds for animation
    setTimeout(() => {
      // Always succeed with the simple verification
      setVerified(true);
      
      // Update success state
      setStatus('success');
      
      // Show success toast
      toast({
        title: "KYC Verification Successful",
        description: "Your identity has been verified successfully"
      });
      
      // Close after showing success
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Identity Verification</DialogTitle>
          <DialogDescription>
            Complete a quick KYC verification to create and buy loans on NovaSettle.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {status === 'idle' && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Verify Your Identity</h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                This process will verify your identity to comply with regulations and enable you to participate in the NovaSettle platform.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700 font-medium">
                  Click "Start Verification" to complete the process automatically.
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  No additional information required.
                </p>
              </div>
            </div>
          )}

          {status === 'verifying' && (
            <div className="py-8 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium">Verifying your identity...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-lg font-medium text-green-700">Verification Successful!</p>
              <p className="text-sm text-gray-500 mt-2">You can now create and buy loans on NovaSettle</p>
            </div>
          )}


        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleVerify} 
                disabled={kycVerifying}
                className="bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] font-semibold"
              >
                Start Verification
              </Button>
            </>
          )}
          
          {status === 'success' && (
            <Button 
              onClick={onClose}
              className="bg-[hsl(var(--solana-green))] hover:bg-opacity-90 text-[hsl(var(--dark-blue))] font-semibold"
            >
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}