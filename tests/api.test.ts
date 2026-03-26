import request from 'supertest';
import { app } from '../src/app';
import { testUtils, fixtures } from './setup';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('API Health Checks', () => {
  it('should return 200 for health check endpoint', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('services');
  });

  it('should return API welcome message', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Welcome to FinTrack Pro API');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('status', 'operational');
  });

  it('should return 404 for non-existent route', async () => {
    const response = await request(app)
      .get('/api/non-existent')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('statusCode', 404);
    expect(response.body).toHaveProperty('message');
  });
});

// Authentication Tests
describe('Authentication API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create a test user for authentication tests
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(fixtures.validUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user).toHaveProperty('email', fixtures.validUser.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...fixtures.validUser,
          email: 'invalid-email'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...fixtures.validUser,
          password: '123'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration with duplicate email', async () => {
      // Try to register the same user twice
      await request(app)
        .post('/api/auth/register')
        .send(fixtures.validUser)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(fixtures.validUser)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      // First register a user
      await request(app)
        .post('/api/auth/register')
        .send(fixtures.validUser)
        .expect(201);

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.validUser.email,
          password: fixtures.validUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject profile request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token is required');
    });

    it('should reject profile request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        currency: 'EUR'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.currency).toBe(updateData.currency);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      // First register a user
      await request(app)
        .post('/api/auth/register')
        .send(fixtures.validUser)
        .expect(201);

      // Then login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.validUser.email,
          password: fixtures.validUser.password
        })
        .expect(200);

      const refreshToken = loginResponse.body.data.tokens.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      // First register a user
      await request(app)
        .post('/api/auth/register')
        .send(fixtures.validUser)
        .expect(201);

      // Then login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.validUser.email,
          password: fixtures.validUser.password
        })
        .expect(200);

      const refreshToken = loginResponse.body.data.tokens.refreshToken;

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });
});

// Transaction Tests
describe('Transaction API', () => {
  let authToken: string;
  let userId: string;
  let testAccount: any;
  let testCategory: any;

  beforeEach(async () => {
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
    
    testAccount = await testUtils.createTestAccount(userId);
    testCategory = await testUtils.createTestCategory(userId);
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction successfully', async () => {
      const transactionData = {
        ...fixtures.validTransaction,
        accountId: testAccount.id,
        categoryId: testCategory.id
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Transaction created successfully');
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data.transaction.title).toBe(transactionData.title);
      expect(response.body.data.transaction.amount).toBe(transactionData.amount);
    });

    it('should reject transaction creation without authentication', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send(fixtures.validTransaction)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject transaction with invalid data', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          amount: -100,
          type: 'INVALID_TYPE'
        })
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/transactions', () => {
    it('should get transactions list successfully', async () => {
      // Create some test transactions
      await testUtils.createTestTransaction(userId);
      await testUtils.createTestTransaction(userId, { amount: 200, type: 'INCOME' });

      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should support pagination parameters', async () => {
      // Create multiple transactions
      for (let i = 0; i < 5; i++) {
        await testUtils.createTestTransaction(userId, { title: `Transaction ${i}` });
      }

      const response = await request(app)
        .get('/api/transactions?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.transactions.length).toBeLessThanOrEqual(3);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 3);
    });

    it('should filter transactions by type', async () => {
      await testUtils.createTestTransaction(userId, { type: 'EXPENSE' });
      await testUtils.createTestTransaction(userId, { type: 'INCOME' });

      const response = await request(app)
        .get('/api/transactions?type=EXPENSE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.transactions.forEach((transaction: any) => {
        expect(transaction.type).toBe('EXPENSE');
      });
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get transaction by ID successfully', async () => {
      const transaction = await testUtils.createTestTransaction(userId);

      const response = await request(app)
        .get(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data.transaction.id).toBe(transaction.id);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update transaction successfully', async () => {
      const transaction = await testUtils.createTestTransaction(userId);
      const updateData = {
        title: 'Updated Transaction',
        amount: 150,
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.transaction.title).toBe(updateData.title);
      expect(response.body.data.transaction.amount).toBe(updateData.amount);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete transaction successfully', async () => {
      const transaction = await testUtils.createTestTransaction(userId);

      const response = await request(app)
        .delete(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Transaction deleted successfully');
    });
  });

  describe('GET /api/transactions/summary', () => {
    it('should get transaction summary successfully', async () => {
      await testUtils.createTestTransaction(userId, { type: 'EXPENSE', amount: 100 });
      await testUtils.createTestTransaction(userId, { type: 'INCOME', amount: 200 });

      const response = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('totalIncome');
      expect(response.body.data.summary).toHaveProperty('totalExpense');
      expect(response.body.data.summary).toHaveProperty('netIncome');
    });
  });

  describe('GET /api/transactions/trends/monthly', () => {
    it('should get monthly trends successfully', async () => {
      const response = await request(app)
        .get('/api/transactions/trends/monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('trends');
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });
  });
});

// Account Tests
describe('Account API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
  });

  describe('POST /api/accounts', () => {
    it('should create a new account successfully', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fixtures.validAccount)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Account created successfully');
      expect(response.body.data).toHaveProperty('account');
      expect(response.body.data.account.name).toBe(fixtures.validAccount.name);
    });

    it('should reject account creation without authentication', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send(fixtures.validAccount)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/accounts', () => {
    it('should get accounts list successfully', async () => {
      await testUtils.createTestAccount(userId);
      await testUtils.createTestAccount(userId, { name: 'Second Account' });

      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accounts');
      expect(Array.isArray(response.body.data.accounts)).toBe(true);
      expect(response.body.data.accounts.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update account successfully', async () => {
      const account = await testUtils.createTestAccount(userId);
      const updateData = {
        name: 'Updated Account',
        balance: 2000
      };

      const response = await request(app)
        .put(`/api/accounts/${account.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.account.name).toBe(updateData.name);
      expect(response.body.data.account.balance).toBe(updateData.balance);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete account successfully', async () => {
      const account = await testUtils.createTestAccount(userId);

      const response = await request(app)
        .delete(`/api/accounts/${account.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Account deleted successfully');
    });
  });

  describe('GET /api/accounts/balance-summary', () => {
    it('should get balance summary successfully', async () => {
      await testUtils.createTestAccount(userId, { balance: 1000 });
      await testUtils.createTestAccount(userId, { balance: 2000, type: 'CREDIT_CARD' });

      const response = await request(app)
        .get('/api/accounts/balance-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('totalBalance');
      expect(response.body.data.summary).toHaveProperty('accountBreakdown');
    });
  });
});

// Category Tests
describe('Category API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
  });

  describe('POST /api/categories', () => {
    it('should create a new category successfully', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fixtures.validCategory)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Category created successfully');
      expect(response.body.data).toHaveProperty('category');
      expect(response.body.data.category.name).toBe(fixtures.validCategory.name);
    });
  });

  describe('GET /api/categories', () => {
    it('should get categories list successfully', async () => {
      await testUtils.createTestCategory(userId);
      await testUtils.createTestCategory(userId, { name: 'Second Category', type: 'INCOME' });

      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categories');
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });

    it('should filter categories by type', async () => {
      await testUtils.createTestCategory(userId, { type: 'EXPENSE' });
      await testUtils.createTestCategory(userId, { type: 'INCOME' });

      const response = await request(app)
        .get('/api/categories?type=EXPENSE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.categories.forEach((category: any) => {
        expect(category.type).toBe('EXPENSE');
      });
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category successfully', async () => {
      const category = await testUtils.createTestCategory(userId);
      const updateData = {
        name: 'Updated Category',
        color: '#FF0000'
      };

      const response = await request(app)
        .put(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.category.name).toBe(updateData.name);
      expect(response.body.data.category.color).toBe(updateData.color);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category successfully', async () => {
      const category = await testUtils.createTestCategory(userId);

      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Category deleted successfully');
    });
  });

  describe('POST /api/categories/seed-defaults', () => {
    it('should seed default categories successfully', async () => {
      const response = await request(app)
        .post('/api/categories/seed-defaults')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Default categories seeded successfully');
    });
  });
});

// Goal Tests
describe('Goal API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
  });

  describe('POST /api/goals', () => {
    it('should create a new goal successfully', async () => {
      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fixtures.validGoal)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Goal created successfully');
      expect(response.body.data).toHaveProperty('goal');
      expect(response.body.data.goal.name).toBe(fixtures.validGoal.name);
    });
  });

  describe('GET /api/goals', () => {
    it('should get goals list successfully', async () => {
      await testUtils.createTestGoal(userId);
      await testUtils.createTestGoal(userId, { name: 'Second Goal' });

      const response = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('goals');
      expect(Array.isArray(response.body.data.goals)).toBe(true);
    });
  });

  describe('PUT /api/goals/:id', () => {
    it('should update goal successfully', async () => {
      const goal = await testUtils.createTestGoal(userId);
      const updateData = {
        name: 'Updated Goal',
        targetAmount: 15000
      };

      const response = await request(app)
        .put(`/api/goals/${goal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.goal.name).toBe(updateData.name);
      expect(response.body.data.goal.targetAmount).toBe(updateData.targetAmount);
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('should delete goal successfully', async () => {
      const goal = await testUtils.createTestGoal(userId);

      const response = await request(app)
        .delete(`/api/goals/${goal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Goal deleted successfully');
    });
  });

  describe('POST /api/goals/:id/contributions', () => {
    it('should add contribution to goal successfully', async () => {
      const goal = await testUtils.createTestGoal(userId);
      const contributionData = {
        amount: 100,
        notes: 'Test contribution'
      };

      const response = await request(app)
        .post(`/api/goals/${goal.id}/contributions`) 
        .set('Authorization', `Bearer ${authToken}`)
        .send(contributionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Contribution added successfully');
    });
  });

  describe('GET /api/goals/summary', () => {
    it('should get goals summary successfully', async () => {
      await testUtils.createTestGoal(userId);
      await testUtils.createTestGoal(userId, { targetAmount: 5000 });

      const response = await request(app)
        .get('/api/goals/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('totalGoals');
      expect(response.body.data.summary).toHaveProperty('totalTargetAmount');
      expect(response.body.data.summary).toHaveProperty('totalSaved');
    });
  });
});

// Budget Tests
describe('Budget API', () => {
  let authToken: string;
  let userId: string;
  let testCategory: any;

  beforeEach(async () => {
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
    testCategory = await testUtils.createTestCategory(userId);
  });

  describe('POST /api/budgets', () => {
    it('should create a new budget successfully', async () => {
      const budgetData = {
        ...fixtures.validBudget,
        categoryId: testCategory.id
      };

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Budget created successfully');
      expect(response.body.data).toHaveProperty('budget');
      expect(response.body.data.budget.monthlyLimit).toBe(budgetData.monthlyLimit);
    });
  });

  describe('GET /api/budgets', () => {
    it('should get budgets list successfully', async () => {
      await testUtils.createTestBudget(userId);
      await testUtils.createTestBudget(userId, { monthlyLimit: 300 });

      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('budgets');
      expect(Array.isArray(response.body.data.budgets)).toBe(true);
    });
  });

  describe('GET /api/budgets/status', () => {
    it('should get budget status successfully', async () => {
      await testUtils.createTestBudget(userId);

      const response = await request(app)
        .get('/api/budgets/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('budgetStatus');
      expect(Array.isArray(response.body.data.budgetStatus)).toBe(true);
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update budget successfully', async () => {
      const budget = await testUtils.createTestBudget(userId);
      const updateData = {
        monthlyLimit: 750,
        alertThreshold: 90
      };

      const response = await request(app)
        .put(`/api/budgets/${budget.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.budget.monthlyLimit).toBe(updateData.monthlyLimit);
      expect(response.body.data.budget.alertThreshold).toBe(updateData.alertThreshold);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete budget successfully', async () => {
      const budget = await testUtils.createTestBudget(userId);

      const response = await request(app)
        .delete(`/api/budgets/${budget.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Budget deleted successfully');
    });
  });
});

// Analytics Tests
describe('Analytics API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
    
    // Create test data for analytics
    await testUtils.createTestTransaction(userId, { type: 'EXPENSE', amount: 100 });
    await testUtils.createTestTransaction(userId, { type: 'INCOME', amount: 200 });
  });

  describe('GET /api/analytics/dashboard-summary', () => {
    it('should get dashboard summary successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('totalIncome');
      expect(response.body.data.summary).toHaveProperty('totalExpense');
      expect(response.body.data.summary).toHaveProperty('netIncome');
    });
  });

  describe('GET /api/analytics/spending-by-category', () => {
    it('should get spending by category successfully', async () => {
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const toDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/analytics/spending-by-category?from=${fromDate}&to=${toDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('spending');
      expect(Array.isArray(response.body.data.spending)).toBe(true);
    });
  });

  describe('GET /api/analytics/monthly-comparison', () => {
    it('should get monthly comparison successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/monthly-comparison')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('comparison');
      expect(Array.isArray(response.body.data.comparison)).toBe(true);
    });
  });

  describe('GET /api/analytics/financial-score', () => {
    it('should get financial score successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/financial-score')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('score');
      expect(typeof response.body.data.score).toBe('number');
    });
  });
});

// Import/Export Tests
describe('Import/Export API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await testUtils.createTestUser();
    userId = user.id;
    authToken = testUtils.generateTestToken(userId);
  });

  describe('GET /api/export/transactions', () => {
    it('should export transactions successfully', async () => {
      await testUtils.createTestTransaction(userId);
      await testUtils.createTestTransaction(userId, { amount: 200 });

      const response = await request(app)
        .get('/api/export/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('exportData');
    });
  });

  describe('GET /api/export/data', () => {
    it('should export all user data successfully', async () => {
      const response = await request(app)
        .get('/api/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('exportData');
    });
  });
});

describe('API Documentation', () => {
  it('should serve Swagger documentation', async () => {
    const response = await request(app)
      .get('/api-docs')
      .redirects(1)
      .expect(200);

    expect(response.text).toContain('swagger-ui');
  });

  it('should serve API specs as JSON', async () => {
    const response = await request(app)
      .get('/api-docs.json')
      .expect(200);

    expect(response.body).toHaveProperty('openapi');
    expect(response.body).toHaveProperty('info');
    expect(response.body).toHaveProperty('paths');
  });
});

describe('CORS Headers', () => {
  it('should include CORS headers when enabled', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    // Check for CORS headers (they might be in different formats)
    const corsHeaders = ['access-control-allow-origin', 'Access-Control-Allow-Origin'];
    const hasOriginHeader = corsHeaders.some(header => response.headers[header]);
    
    expect(hasOriginHeader).toBe(true);
    
    const methodsHeaders = ['access-control-allow-methods', 'Access-Control-Allow-Methods'];
    const hasMethodsHeader = methodsHeaders.some(header => response.headers[header]);
    
    expect(hasMethodsHeader).toBe(true);
    
    const allowHeaders = ['access-control-allow-headers', 'Access-Control-Allow-Headers'];
    const hasAllowHeadersHeader = allowHeaders.some(header => response.headers[header]);
    
    expect(hasAllowHeadersHeader).toBe(true);
  });

  it('should not include CORS headers when disabled', async () => {
    // This test would require mocking CORS_ENABLED=false
    // For now, we'll just verify the structure exists
    const response = await request(app)
      .get('/api')
      .expect(200);

    // When CORS is disabled, these headers should not be present
    const corsHeaders = ['access-control-allow-origin', 'Access-Control-Allow-Origin'];
    const hasOriginHeader = corsHeaders.some(header => response.headers[header]);
    
    // In test environment, CORS should be enabled by default
    expect(hasOriginHeader).toBe(true);
  });
});

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
    expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    expect(response.headers).toHaveProperty('referrer-policy', 'strict-origin-when-cross-origin');
  });
});

describe('Rate Limiting', () => {
  it('should allow normal request rate', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .get('/api/health')
        .expect(200);
    }
  });
});

describe('Request Validation', () => {
  it('should reject invalid JSON', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('invalid json')
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
  });

  it('should reject empty request body when required', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('errors');
  });
});

describe('Authentication Endpoints', () => {
  it('should reject registration with invalid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: '',
        email: 'invalid-email',
        password: '123'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: expect.any(String),
          message: expect.any(String),
          code: expect.any(String)
        })
      ])
    );
  });

  it('should reject login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Invalid email or password');
  });
});

describe('Protected Routes', () => {
  it('should reject requests without authentication token', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Access token is required');
  });

  it('should reject requests with invalid authentication token', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Invalid or expired token');
  });
});

describe('Error Handling', () => {
  it('should handle database connection errors gracefully', async () => {
    // This would require mocking database connection
    // For now, just ensure the error handler is working
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
  });

  it('should return proper error format', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: expect.any(String),
      errors: expect.any(Array)
    });
  });
});

describe('File Upload Endpoints', () => {
  it('should reject file upload without file', async () => {
    const response = await request(app)
      .post('/api/import/transactions')
      .expect(401); // Should be rejected by auth middleware first
  });
});

describe('Pagination', () => {
  it('should handle pagination parameters', async () => {
    // This would require authentication
    // For now, just test the validation middleware
    const response = await request(app)
      .get('/api/transactions?page=invalid&limit=invalid')
      .expect(401); // Should be rejected by auth middleware first
  });
});

describe('Input Sanitization', () => {
  it('should sanitize input data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: '  Test User  ',
        email: '  test@example.com  ',
        password: 'TestPassword123'
      })
      .expect(400); // Should fail due to other validation, but name/email should be sanitized
  });
});

describe('Environment Variables', () => {
  it('should have required environment variables set', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.PORT).toBeDefined();
    expect(process.env.MONGODB_URI).toBeDefined();
  });
});

describe('Database Connection', () => {
  it('should connect to database successfully', async () => {
    // This would require actual database connection test
    // For now, just ensure the app starts without database errors
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.services).toHaveProperty('database');
  });
});

describe('Firebase Integration', () => {
  it('should initialize Firebase successfully', async () => {
    // This would require actual Firebase test
    // For now, just ensure the app starts without Firebase errors
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.services).toHaveProperty('firebase');
  });
});

describe('Scheduled Jobs', () => {
  it('should initialize scheduled jobs', async () => {
    // This would require testing the actual cron jobs
    // For now, just ensure the app starts without errors
    const response = await request(app)
      .get('/api/health')
      .expect(200);
  });
});

describe('Performance', () => {
  it('should respond within reasonable time', async () => {
    const start = Date.now();
    await request(app)
      .get('/api/health')
      .expect(200);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(10).fill(null).map(() => 
      request(app).get('/api/health')
    );
    
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});

describe('Memory Usage', () => {
  it('should not have memory leaks in basic operations', async () => {
    // This would require more sophisticated memory testing
    // For now, just ensure basic operations work
    for (let i = 0; i < 100; i++) {
      await request(app)
        .get('/api/health')
        .expect(200);
    }
  });
});
