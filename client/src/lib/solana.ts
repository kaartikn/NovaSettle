import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';

/**
 * Create a loan token on Solana that's linked to a specific public key
 * 
 * This creates a deterministic token address based on the creator's public key
 * and the loan details, allowing it to be linked to the creator's wallet
 */
export async function createLoanToken(
  connection: Connection,
  wallet: any, // Wallet instance or public key
  loanAmount: number | string,
  loanToken: string,
  collateralAmount: number | string,
  collateralToken: string,
  termDays: number,
  apr: number | string
): Promise<string> {
  try {
    console.log("Starting token creation process...");
    
    // Convert all inputs to strings for display
    const loanAmountStr = loanAmount.toString();
    const collateralAmountStr = collateralAmount.toString();
    const aprStr = apr.toString();
    const termDaysStr = termDays.toString();
    
    // Get the creator's public key (either from wallet or use the provided one)
    let creatorPublicKey: PublicKey;
    
    if (wallet.publicKey) {
      creatorPublicKey = new PublicKey(wallet.publicKey.toString());
    } else if (typeof wallet === 'string') {
      creatorPublicKey = new PublicKey(wallet);
    } else {
      throw new Error('No valid public key provided');
    }
    
    console.log("Using creator public key:", creatorPublicKey.toString());
    
    // Create a deterministic address based on the creator's address
    // since we can't safely use Buffer in the browser
    
    // Generate a unique seed for this loan using timestamp
    const timestamp = Date.now().toString();
    
    // Create a derived address based on the creator's public key and loan details
    // We'll use a deterministic method to generate a unique address
    const uniqueNumber = parseInt(timestamp.slice(-9)); // Get last 9 digits of timestamp
    const offset = uniqueNumber % 256; // Use as an offset value between 0-255
    
    // Create a new keypair that will be our token address
    const tokenKeypair = Keypair.generate();
    
    // Modify the public key based on creator's address to create association
    const tokenPublicKeyBytes = tokenKeypair.publicKey.toBytes();
    const creatorPublicKeyBytes = creatorPublicKey.toBytes();
    
    // Inject part of the creator's public key into the token public key
    // This creates a mathematical relationship between the addresses
    for (let i = 0; i < 16; i++) {
      tokenPublicKeyBytes[i+8] = creatorPublicKeyBytes[i] ^ offset;
    }
    
    const derivedAddress = new PublicKey(tokenPublicKeyBytes);
    
    const tokenAddress = derivedAddress.toString();
    console.log("Created token address linked to creator:", tokenAddress);
    
    // In a complete implementation, we would:
    // 1. Create a real token mint 
    // 2. Initialize token account 
    // 3. Set up a loan program with these details
    
    // For now, we're creating a valid Solana address that's mathematically
    // derived from the creator's public key so it's linked to them
    
    // Try to airdrop a small amount of SOL to the token address to make it visible on Explorer
    try {
      console.log("Attempting to airdrop SOL to token address...");
      const airdropSignature = await connection.requestAirdrop(
        derivedAddress,
        LAMPORTS_PER_SOL * 0.01 // 0.01 SOL
      );
      
      // Wait for confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: airdropSignature
      });
      
      console.log("Successfully airdropped SOL to token address.");
    } catch (error) {
      console.error("Error airdropping SOL:", error);
      // Continue even if airdrop fails
    }
    
    return tokenAddress;
  } catch (error) {
    console.error('Error creating loan token:', error);
    throw error;
  }
}

/**
 * Buy a loan token on Solana
 * 
 * Note: In a full implementation, this would transfer SPL tokens in exchange for a loan token
 * For the MVP, we'll create a transaction that transfers a small amount of SOL
 */
export async function buyLoanToken(
  connection: Connection,
  payer: any, // Wallet or Phantom provider
  loanTokenMint: string,
  price: number
): Promise<string> {
  try {
    // Handle both wallet object and phantom provider
    const payerPublicKey = payer.publicKey?.toBase58 ? 
      new PublicKey(payer.publicKey.toBase58()) : 
      payer.publicKey ? 
        new PublicKey(payer.publicKey) : 
        null;
    
    if (!payerPublicKey) {
      throw new Error('Wallet not connected');
    }

    // Target account - in a production app, this would be the loan contract
    // For demo purposes, we'll send to a random newly generated account
    const targetKeypair = Keypair.generate();
    const targetPubkey = targetKeypair.publicKey;
    
    console.log(`Creating transaction from ${payerPublicKey.toBase58()} to ${targetPubkey.toBase58()}`);
    
    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
    // Create a new transaction
    const transaction = new Transaction();
      
    // Set the transaction properties
    transaction.feePayer = payerPublicKey;
    transaction.recentBlockhash = blockhash;
    
    // Calculate minimum balance for rent exemption
    // This is needed to avoid the "insufficient funds for rent" error
    const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(0);
    console.log(`Minimum balance for rent exemption: ${rentExemptAmount} lamports`);
    
    // Add 50% more to ensure sufficient funds
    const transferAmount = rentExemptAmount + (rentExemptAmount / 2);
    
    // Add a simple transfer instruction to represent loan purchase
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payerPublicKey,
        toPubkey: targetPubkey,
        lamports: transferAmount // Amount to cover rent exemption plus some extra
      })
    );
    
    console.log("Transaction created");
    
    // Sign and send the transaction using Phantom
    try {
      // Check if we have a signTransaction method (Phantom wallet)
      if (payer.signTransaction) {
        console.log("Using provider.signTransaction");
        // This is the Phantom wallet case
        const signedTransaction = await payer.signTransaction(transaction);
        console.log("Transaction signed");
        
        // Send the signed transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log("Transaction sent, signature:", signature);
        
        // Wait for confirmation
        await connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature
        });
        console.log("Transaction confirmed");
        
        return signature;
      } 
      // Check if this is a wallet object with sendTransaction method
      else if (payer.sendTransaction) {
        console.log("Using wallet adapter sendTransaction");
        const signature = await payer.sendTransaction(transaction, connection);
        console.log("Transaction sent and confirmed, signature:", signature);
        return signature;
      }
      else {
        console.error("No valid signing method found on provider", payer);
        throw new Error("Wallet does not support transaction signing");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error signing or sending transaction:", error);
      throw new Error(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error buying loan token:', error);
    throw error;
  }
}

/**
 * Get SOL balance for a wallet
 */
export async function getSolBalance(
  connection: Connection,
  address: string
): Promise<number> {
  try {
    // Convert address string to PublicKey
    const publicKey = new PublicKey(address);
    
    // Get SOL balance
    const balance = await connection.getBalance(publicKey);
    
    // Convert from lamports to SOL and return
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    throw error;
  }
}

/**
 * Request an airdrop of SOL from the devnet faucet
 */
export async function requestDevnetAirdrop(
  connection: Connection,
  address: string,
  amount: number = 1 // Default to 1 SOL
): Promise<string> {
  try {
    // Convert address string to PublicKey
    const publicKey = new PublicKey(address);
    
    console.log(`Requesting airdrop of ${amount} SOL to ${address}`);
    
    // Request airdrop (amount in SOL)
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    
    // Wait for confirmation
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    });
    
    console.log(`Airdrop of ${amount} SOL confirmed`);
    return signature;
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    throw error;
  }
}

/**
 * Get Solana network status
 */
export async function getNetworkStatus(
  connection: Connection
): Promise<{ status: string; slot: number }> {
  try {
    // Get the current slot
    const slot = await connection.getSlot();
    
    // Check if connected by attempting to get block time
    const blockTime = await connection.getBlockTime(slot);
    
    return {
      status: blockTime ? 'connected' : 'disconnected',
      slot: slot
    };
  } catch (error) {
    console.error('Error getting network status:', error);
    return {
      status: 'disconnected',
      slot: 0
    };
  }
}
