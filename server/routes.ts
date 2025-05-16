import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLoanSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all loans
  app.get("/api/loans", async (req, res) => {
    try {
      const loans = await storage.getAllLoans();
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  // Get loan by id
  app.get("/api/loans/:id", async (req, res) => {
    try {
      const loanId = parseInt(req.params.id);
      const loan = await storage.getLoanById(loanId);
      
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      res.json(loan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  // Create new loan
  app.post("/api/loans", async (req, res) => {
    try {
      console.log("Received loan creation request:", req.body);
      
      // Ensure that numeric fields are in the correct format
      const cleanData = {
        ...req.body,
        loanAmount: req.body.loanAmount.toString(),
        collateralAmount: req.body.collateralAmount.toString(),
        apr: req.body.apr.toString(),
        termDays: parseInt(req.body.termDays)
      };
      
      console.log("Cleaned loan data:", cleanData);
      
      const loanData = insertLoanSchema.parse(cleanData);
      const newLoan = await storage.createLoan(loanData);
      res.status(201).json(newLoan);
    } catch (error) {
      console.error("Loan creation error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid loan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  // Update loan status
  app.patch("/api/loans/:id/status", async (req, res) => {
    try {
      const loanId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedLoan = await storage.updateLoanStatus(loanId, status);
      
      if (!updatedLoan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      res.json(updatedLoan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update loan status" });
    }
  });

  // Get loans by creator wallet address
  app.get("/api/loans/creator/:address", async (req, res) => {
    try {
      const creatorAddress = req.params.address;
      const loans = await storage.getLoansByCreator(creatorAddress);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  // Get loans by owner wallet address
  app.get("/api/loans/owner/:address", async (req, res) => {
    try {
      const ownerAddress = req.params.address;
      const loans = await storage.getLoansByOwner(ownerAddress);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch owned loans" });
    }
  });

  // Update loan owner (purchase a loan)
  app.post("/api/loans/:id/purchase", async (req, res) => {
    try {
      const loanId = parseInt(req.params.id);
      const { ownerAddress, transactionHash } = req.body;
      
      if (!ownerAddress || !transactionHash) {
        return res.status(400).json({ 
          message: "Missing required fields",
          details: "ownerAddress and transactionHash are required" 
        });
      }
      
      console.log(`Purchasing loan ${loanId} for wallet ${ownerAddress} with tx ${transactionHash}`);
      
      const updatedLoan = await storage.updateLoanOwner(loanId, ownerAddress, transactionHash);
      
      if (!updatedLoan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      // Verify the update was successful
      const verifiedLoan = await storage.getLoanById(loanId);
      console.log("Loan after purchase update:", verifiedLoan);
      
      // Also log all loans by this owner
      const ownedLoans = await storage.getLoansByOwner(ownerAddress);
      console.log(`Loans owned by ${ownerAddress}:`, ownedLoans.length);
      
      res.json(updatedLoan);
    } catch (error) {
      console.error("Error purchasing loan:", error);
      res.status(500).json({ message: "Failed to purchase loan" });
    }
  });

  // Special dev endpoint to reset database for testing
  app.post("/api/dev/reset", async (req, res) => {
    try {
      // Clear storage
      await storage.clearAllLoans();
      
      // Retrieve the user's wallet address from the request body
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          message: "Missing required field", 
          details: "walletAddress is required" 
        });
      }
      
      const userWalletAddress = walletAddress;
      
      // Create a loan created by the user
      await storage.createLoan({
        loanToken: "USDC",
        loanAmount: "5000",
        collateralToken: "SOL",
        collateralAmount: "8.2",
        apr: "12.5",
        termDays: 30,
        creator: userWalletAddress, // Created by the user
        tokenAddress: "4Kj8o7aSBXQec1zs8Q9ZNpV5un4LPRiUJyJpzZqsJoWw",
        status: "active"
      });
      
      // Create loans from other accounts to purchase
      await storage.createLoan({
        loanToken: "SOL",
        loanAmount: "150",
        collateralToken: "BTC",
        collateralAmount: "0.12",
        apr: "9.2",
        termDays: 60,
        creator: "DT4n6ABtRRJ1AXe9CpLnSmTADQAvYTRKwPg2qdms7ZLw", // Created by another user
        tokenAddress: "8rVJM94XZz2CrVL7P1Vnpd4tGFqmX3vGBvCzzQhLELP3",
        status: "active"
      });
      
      await storage.createLoan({
        loanToken: "USDT",
        loanAmount: "10000",
        collateralToken: "SOL",
        collateralAmount: "20.5",
        apr: "14.8",
        termDays: 90,
        creator: "2gVkYWexTHR5Hb2aLeQN3tnngvWzisFKXDUPqHxLYUSx", // Created by yet another user
        tokenAddress: "7aSBXQec1zs8Q9ZNpV5un4LPRiUJyJpzZqsJoWw4Kj8o",
        status: "active"
      });
      
      // Create a purchased loan for the user
      const purchasedLoan = await storage.createLoan({
        loanToken: "ETH",
        loanAmount: "2.5",
        collateralToken: "SOL",
        collateralAmount: "50",
        apr: "8.75",
        termDays: 45,
        creator: "2gVkYWexTHR5Hb2aLeQN3tnngvWzisFKXDUPqHxLYUSx",
        tokenAddress: "9vYWKtgmPvEFJvP4X3c8gX4mZ3SjUMT11WQKjaMr1e7k",
        status: "active"
      });
      
      if (purchasedLoan) {
        await storage.updateLoanOwner(
          purchasedLoan.id, 
          userWalletAddress, 
          "2ZgydTugHJKQjGGkonjRPSGp6RvKmKRt2yzX3tp1FjASNLHf7n6QcKR8u4F7RpXktvA2VGLo2Bn7M3"
        );
      }
      
      // Return the new loans
      const loans = await storage.getAllLoans();
      res.json(loans);
    } catch (error) {
      console.error("Error resetting database:", error);
      res.status(500).json({ message: "Failed to reset database" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}