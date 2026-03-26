import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Set test environment variables before any other imports
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-chars-minimum';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-minimum';
process.env.JWT_EMAIL_VERIFY_SECRET = 'test-email-verify-secret-32-chars';
process.env.JWT_PASSWORD_RESET_SECRET = 'test-password-reset-secret-32-chars';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.PORT = '3001';
process.env.HOST = 'localhost';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

/**
 * Test Setup
 * Global test configuration and utilities
 */

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Disconnect from the database
  await mongoose.disconnect();
  
  // Stop the in-memory MongoDB server
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterEach(async () => {
  // Additional cleanup if needed
});

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Create a test user
   */
  async createTestUser(userData: any = {}) {
    const { User } = await import('../src/models');
    const bcrypt = require('bcryptjs');
    
    const passwordHash = await bcrypt.hash('TestPassword123', 10);
    
    return await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
      currency: 'USD',
      isEmailVerified: true,
      onboardingDone: true,
      ...userData
    });
  },

  /**
   * Generate test JWT token
   */
  generateTestToken(userId: string): string {
    const jwt = require('jsonwebtoken');
    
    return jwt.sign(
      { userId },
      process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-chars-minimum',
      { expiresIn: '15m' }
    );
  },

  /**
   * Create test transaction
   */
  async createTestTransaction(userId: string, transactionData: any = {}) {
    const { Transaction, Account, Category } = await import('../src/models');
    
    // Create test account
    const account = await Account.create({
      userId,
      name: 'Test Account',
      type: 'BANK',
      balance: 1000,
      currency: 'USD',
      color: '#5B5FEF',
      icon: 'account_balance_wallet',
      isDefault: true,
      includeInTotal: true
    });
    
    // Create test category
    const category = await Category.create({
      userId,
      name: 'Test Category',
      icon: 'restaurant',
      color: '#FF6D00',
      type: 'EXPENSE'
    });
    
    return await Transaction.create({
      userId,
      title: 'Test Transaction',
      amount: 100,
      type: 'EXPENSE',
      categoryId: category.id,
      accountId: account.id,
      date: new Date(),
      ...transactionData
    });
  },

  /**
   * Create test account
   */
  async createTestAccount(userId: string, accountData: any = {}) {
    const { Account } = await import('../src/models');
    
    return await Account.create({
      userId,
      name: 'Test Account',
      type: 'BANK',
      balance: 1000,
      currency: 'USD',
      color: '#5B5FEF',
      icon: 'account_balance_wallet',
      isDefault: false,
      includeInTotal: true,
      ...accountData
    });
  },

  /**
   * Create test category
   */
  async createTestCategory(userId: string, categoryData: any = {}) {
    const { Category } = await import('../src/models');
    
    return await Category.create({
      userId,
      name: 'Test Category',
      icon: 'restaurant',
      color: '#FF6D00',
      type: 'EXPENSE',
      ...categoryData
    });
  },

  /**
   * Create test goal
   */
  async createTestGoal(userId: string, goalData: any = {}) {
    const { Goal } = await import('../src/models');
    
    return await Goal.create({
      userId,
      name: 'Test Goal',
      targetAmount: 1000,
      currentSaved: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      icon: 'flag',
      color: '#4CAF50',
      priority: 5,
      ...goalData
    });
  },

  /**
   * Create test budget
   */
  async createTestBudget(userId: string, budgetData: any = {}) {
    const { Budget, Category } = await import('../src/models');
    
    // Create test category
    const category = await Category.create({
      userId,
      name: 'Test Category',
      icon: 'restaurant',
      color: '#FF6D00',
      type: 'EXPENSE'
    });
    
    const now = new Date();
    return await Budget.create({
      userId,
      categoryId: category.id,
      monthlyLimit: 500,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      rolloverEnabled: false,
      alertThreshold: 80,
      ...budgetData
    });
  },

  /**
   * Wait for a specified time
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Clean up database collections
   */
  async cleanupDatabase(): Promise<void> {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  },

  /**
   * Generate random test data
   */
  generateRandomData() {
    return {
      email: `test${Math.random()}@example.com`,
      name: `Test User ${Math.random()}`,
      amount: Math.floor(Math.random() * 1000) + 1,
      title: `Test Transaction ${Math.random()}`,
      notes: `Test notes ${Math.random()}`
    };
  }
};

/**
 * Global test fixtures
 */
export const fixtures = {
  validUser: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'TestPassword123',
    currency: 'USD'
  },
  validTransaction: {
    title: 'Grocery Shopping',
    amount: 125.50,
    type: 'EXPENSE',
    date: new Date().toISOString(),
    notes: 'Weekly grocery shopping'
  },
  validAccount: {
    name: 'Main Checking',
    type: 'BANK',
    balance: 5000,
    currency: 'USD',
    color: '#5B5FEF',
    icon: 'account_balance_wallet'
  },
  validCategory: {
    name: 'Food & Dining',
    icon: 'restaurant',
    color: '#FF6D00',
    type: 'EXPENSE'
  },
  validGoal: {
    name: 'Emergency Fund',
    targetAmount: 10000,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    icon: 'flag',
    color: '#4CAF50',
    priority: 8
  },
  validBudget: {
    monthlyLimit: 500,
    rolloverEnabled: false,
    alertThreshold: 80
  }
};
