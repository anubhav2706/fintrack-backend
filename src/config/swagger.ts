import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';

/**
 * Swagger Configuration
 * Sets up API documentation using Swagger/OpenAPI
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinTrack Pro API',
      version: '1.0.0',
      description: 'Comprehensive finance tracking API for FinTrack Pro Android application',
      contact: {
        name: 'FinTrack Pro Support',
        email: 'support@fintrackpro.com',
        url: 'https://fintrackpro.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: env.NODE_ENV === 'production' 
          ? 'https://api.fintrackpro.com' 
          : `http://localhost:${env.PORT}`,
        description: env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
      },
      {
        url: 'https://staging-api.fintrackpro.com',
        description: 'Staging server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            currency: {
              type: 'string',
              length: 3,
              description: 'User preferred currency (ISO code)',
              example: 'USD',
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Whether user email is verified',
              example: true,
            },
            onboardingDone: {
              type: 'boolean',
              description: 'Whether user has completed onboarding',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User account creation date',
              example: '2023-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last profile update date',
              example: '2023-01-20T14:22:00.000Z',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Transaction unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              description: 'Transaction title or description',
              example: 'Grocery Shopping',
            },
            amount: {
              type: 'number',
              description: 'Transaction amount',
              example: 125.50,
            },
            type: {
              type: 'string',
              enum: ['EXPENSE', 'INCOME', 'TRANSFER'],
              description: 'Transaction type',
              example: 'EXPENSE',
            },
            categoryId: {
              type: 'string',
              description: 'Category identifier',
              example: '507f1f77bcf86cd799439012',
            },
            accountId: {
              type: 'string',
              description: 'Account identifier',
              example: '507f1f77bcf86cd799439013',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction date',
              example: '2023-01-15T10:30:00.000Z',
            },
            notes: {
              type: 'string',
              description: 'Additional notes about the transaction',
              example: 'Weekly grocery shopping at supermarket',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Transaction tags',
              example: ['groceries', 'weekly'],
            },
            paymentMethod: {
              type: 'string',
              enum: ['CASH', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'CHEQUE', 'WALLET', 'EMI', 'OTHER'],
              description: 'Payment method used',
              example: 'DEBIT_CARD',
            },
            isRecurring: {
              type: 'boolean',
              description: 'Whether this is a recurring transaction',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction creation date',
              example: '2023-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
              example: '2023-01-15T10:30:00.000Z',
            },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Account unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Account name',
              example: 'Main Checking Account',
            },
            type: {
              type: 'string',
              enum: ['CASH', 'BANK', 'CREDIT', 'INVESTMENT', 'SAVINGS'],
              description: 'Account type',
              example: 'BANK',
            },
            balance: {
              type: 'number',
              description: 'Current account balance',
              example: 5250.75,
            },
            currency: {
              type: 'string',
              length: 3,
              description: 'Account currency (ISO code)',
              example: 'USD',
            },
            color: {
              type: 'string',
              description: 'Account color for UI',
              example: '#5B5FEF',
            },
            icon: {
              type: 'string',
              description: 'Account icon name',
              example: 'account_balance_wallet',
            },
            isDefault: {
              type: 'boolean',
              description: 'Whether this is the default account',
              example: true,
            },
            includeInTotal: {
              type: 'boolean',
              description: 'Whether to include in total balance calculation',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
              example: '2023-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
              example: '2023-01-20T14:22:00.000Z',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Category unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Food & Dining',
            },
            icon: {
              type: 'string',
              description: 'Category icon name',
              example: 'restaurant',
            },
            color: {
              type: 'string',
              description: 'Category color for UI',
              example: '#FF6D00',
            },
            type: {
              type: 'string',
              enum: ['EXPENSE', 'INCOME', 'BOTH'],
              description: 'Category type',
              example: 'EXPENSE',
            },
            monthlyBudget: {
              type: 'number',
              description: 'Monthly budget limit for this category',
              example: 500.00,
            },
            parentId: {
              type: 'string',
              description: 'Parent category ID for subcategories',
              example: '507f1f77bcf86cd799439012',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category creation date',
              example: '2023-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
              example: '2023-01-20T14:22:00.000Z',
            },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Goal unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Goal name',
              example: 'Emergency Fund',
            },
            targetAmount: {
              type: 'number',
              description: 'Target amount to save',
              example: 10000.00,
            },
            currentSaved: {
              type: 'number',
              description: 'Current amount saved',
              example: 3500.00,
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              description: 'Goal deadline',
              example: '2023-12-31T23:59:59.000Z',
            },
            icon: {
              type: 'string',
              description: 'Goal icon name',
              example: 'flag',
            },
            color: {
              type: 'string',
              description: 'Goal color for UI',
              example: '#4CAF50',
            },
            priority: {
              type: 'integer',
              minimum: 0,
              maximum: 10,
              description: 'Goal priority (0-10)',
              example: 8,
            },
            isAchieved: {
              type: 'boolean',
              description: 'Whether goal is achieved',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Goal creation date',
              example: '2023-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
              example: '2023-01-20T14:22:00.000Z',
            },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Budget unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            categoryId: {
              type: 'string',
              description: 'Category identifier',
              example: '507f1f77bcf86cd799439012',
            },
            monthlyLimit: {
              type: 'number',
              description: 'Monthly budget limit',
              example: 500.00,
            },
            month: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Budget month (1-12)',
              example: 1,
            },
            year: {
              type: 'integer',
              description: 'Budget year',
              example: 2023,
            },
            rolloverEnabled: {
              type: 'boolean',
              description: 'Whether unused budget rolls over to next month',
              example: false,
            },
            alertThreshold: {
              type: 'integer',
              minimum: 10,
              maximum: 100,
              description: 'Alert threshold percentage',
              example: 80,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Budget creation date',
              example: '2023-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
              example: '2023-01-20T14:22:00.000Z',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
              example: true,
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 200,
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data',
              example: {},
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
              example: false,
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 400,
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name where error occurred',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    description: 'Error message for the field',
                    example: 'Email is required',
                  },
                  code: {
                    type: 'string',
                    description: 'Error code',
                    example: 'REQUIRED',
                  },
                },
              },
              description: 'Array of validation errors',
              example: [],
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
              example: true,
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 200,
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Data retrieved successfully',
            },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                  description: 'Array of items',
                  example: [],
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Current page number',
                      example: 1,
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page',
                      example: 20,
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of items',
                      example: 150,
                    },
                    totalPages: {
                      type: 'integer',
                      description: 'Total number of pages',
                      example: 8,
                    },
                    hasNextPage: {
                      type: 'boolean',
                      description: 'Whether there is a next page',
                      example: true,
                    },
                    hasPrevPage: {
                      type: 'boolean',
                      description: 'Whether there is a previous page',
                      example: false,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management',
      },
      {
        name: 'Transactions',
        description: 'Transaction management and operations',
      },
      {
        name: 'Accounts',
        description: 'Account management and operations',
      },
      {
        name: 'Categories',
        description: 'Category management and operations',
      },
      {
        name: 'Goals',
        description: 'Goal management and tracking',
      },
      {
        name: 'Budgets',
        description: 'Budget management and tracking',
      },
      {
        name: 'Analytics',
        description: 'Financial analytics and reports',
      },
      {
        name: 'Notifications',
        description: 'Push notification management',
      },
      {
        name: 'Sync',
        description: 'Data synchronization operations',
      },
      {
        name: 'Import/Export',
        description: 'Data import and export operations',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };

/**
 * Custom Swagger UI options
 */
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { margin: 20px 0 }
  `,
  customSiteTitle: 'FinTrack Pro API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  },
};
