import { users, type User, type InsertUser, loans, type Loan, type InsertLoan } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Loan related methods
  createLoan(loan: InsertLoan): Promise<Loan>;
  getLoanById(id: number): Promise<Loan | undefined>;
  getAllLoans(): Promise<Loan[]>;
  updateLoanStatus(id: number, status: string): Promise<Loan | undefined>;
  getLoansByCreator(creatorAddress: string): Promise<Loan[]>;
  updateLoanOwner(id: number, ownerAddress: string, transactionHash: string): Promise<Loan | undefined>;
  getLoansByOwner(ownerAddress: string): Promise<Loan[]>;
  clearAllLoans(): Promise<void>; // New method to clear all loans
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private loans: Map<number, Loan>;
  userCurrentId: number;
  loanCurrentId: number;

  constructor() {
    this.users = new Map();
    this.loans = new Map();
    this.userCurrentId = 1;
    this.loanCurrentId = 1;
    
    // Add example loans to the marketplace
    this.addExampleLoans();
  }
  
  // Add example loans for demonstration purposes
  private addExampleLoans() {
    const exampleLoans: InsertLoan[] = [
      {
        loanToken: "USDC",
        loanAmount: "5000",
        collateralToken: "SOL",
        collateralAmount: "100",
        apr: "8.5",
        termDays: 30,
        creator: "5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CerVckCBAnj", // Different creator for marketplace
        tokenAddress: "CT5zKYSQHNmP6TXc5n1nqP9V1CZL15gyY6DoBP3qKhry",
        status: "active"
      },
      {
        loanToken: "USDT",
        loanAmount: "10000",
        collateralToken: "BTC",
        collateralAmount: "0.25",
        apr: "12.0",
        termDays: 60,
        creator: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", // Different creator for marketplace
        tokenAddress: "FcVprKm3RChe8jDEhjnzWYRcGdUxGMgfaC1YZgPXLGfx",
        status: "active"
      },
      {
        loanToken: "SOL",
        loanAmount: "1000",
        collateralToken: "ETH",
        collateralAmount: "15",
        apr: "9.75",
        termDays: 45,
        creator: "2KW2XRd9kwqet15Aha2oK3tYvd3nWbTFH1MBiRAv1BE1", // Different creator for marketplace
        tokenAddress: "G15NVgQS9NUo8exjr7JTjA2zy3ajL4DgYJNnEVzfbZ5a",
        status: "active"
      },
      {
        loanToken: "USDC",
        loanAmount: "25000",
        collateralToken: "SOL",
        collateralAmount: "500",
        apr: "7.2",
        termDays: 90,
        creator: "F9TechAtLAS1giauHmE2WvjpdeH9of4XWzWxXxxDh24Z", // Different creator for marketplace
        tokenAddress: "Dj84BA7c425RTLv9jTYJBMhSKf8rxUbHyPdkFMjLHKP4",
        status: "active"
      }
    ];
    
    // Add each example loan to the map
    exampleLoans.forEach(loan => {
      const id = this.loanCurrentId++;
      this.loans.set(id, { 
        ...loan, 
        id, 
        owner: null, 
        transactionHash: null,
        createdAt: new Date(),
        purchasedAt: null,
        status: loan.status || "active" // Ensure status is always set
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Loan CRUD operations
  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    const id = this.loanCurrentId++;
    // Ensure we have a status field with default 'active'
    const status = insertLoan.status || 'active';
    
    const loan: Loan = { 
      ...insertLoan, 
      id, 
      status,
      createdAt: new Date(),
      owner: null,
      transactionHash: null,
      purchasedAt: null
    };
    
    this.loans.set(id, loan);
    return loan;
  }
  
  async getLoanById(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }
  
  async getAllLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values());
  }
  
  async updateLoanStatus(id: number, status: string): Promise<Loan | undefined> {
    const loan = this.loans.get(id);
    
    if (!loan) {
      return undefined;
    }
    
    const updatedLoan = { ...loan, status };
    this.loans.set(id, updatedLoan);
    
    return updatedLoan;
  }
  
  async getLoansByCreator(creatorAddress: string): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.creator === creatorAddress
    );
  }

  async updateLoanOwner(id: number, ownerAddress: string, transactionHash: string): Promise<Loan | undefined> {
    const loan = this.loans.get(id);
    
    if (!loan) {
      return undefined;
    }
    
    const updatedLoan: Loan = {
      ...loan,
      owner: ownerAddress,
      transactionHash: transactionHash,
      purchasedAt: new Date(),
      status: 'purchased'
    };
    
    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }
  
  async getLoansByOwner(ownerAddress: string): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(loan => loan.owner === ownerAddress);
  }
  
  async clearAllLoans(): Promise<void> {
    this.loans.clear();
    this.loanCurrentId = 1;
    console.log("All loans cleared from database");
  }
}

export const storage = new MemStorage();
