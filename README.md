# FinTrack Pro Backend

A comprehensive, production-ready backend API for the FinTrack Pro Android financial tracking application.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- MongoDB 7.0 or higher
- Firebase project (for push notifications)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/fintrack/backend.git
cd fintrack-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Build the project**
```bash
npm run build
```

5. **Start the server**
```bash
npm start
```

The API will be available at `http://localhost:3000`

## 📚 Documentation

- **API Documentation**: [Swagger UI](http://localhost:3000/api-docs)
- **Android Integration Guide**: [docs/ANDROID_INTEGRATION.md](docs/ANDROID_INTEGRATION.md)
- **API Reference**: [API Specs](http://localhost:3000/api-docs.json)

## 🛠 Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.x
- **Database**: MongoDB 7 + Mongoose 8
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Vitest
- **Process Management**: PM2
- **Push Notifications**: Firebase Admin SDK

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # API controllers
├── middleware/       # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── schemas/         # Zod validation schemas
├── services/        # Business logic services
├── jobs/            # Scheduled tasks
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 🔧 Environment Variables

Key environment variables required:

```env
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/fintrack

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EMAIL_VERIFY_SECRET=your-email-verify-secret
JWT_PASSWORD_RESET_SECRET=your-password-reset-secret

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_DATABASE_URL=your-firebase-db-url

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Deployment

### Using PM2

1. **Build the application**
```bash
npm run build
```

2. **Start with PM2**
```bash
pm2 start ecosystem.config.js --env production
```

3. **Monitor the application**
```bash
pm2 monit
```

### Docker Deployment

```bash
# Build the image
docker build -t fintrack-backend .

# Run the container
docker run -p 3000:3000 --env-file .env fintrack-backend
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- Unit tests for services and utilities
- Integration tests for API endpoints
- Test setup with in-memory MongoDB
- Comprehensive test coverage

## 📊 API Features

### Authentication
- User registration and login
- JWT token management
- Password reset functionality
- Passcode support for quick login
- Email verification

### Financial Management
- **Transactions**: Create, read, update, delete transactions
- **Accounts**: Manage bank accounts, credit cards, cash
- **Categories**: Organize expenses with custom categories
- **Goals**: Set and track financial goals
- **Budgets**: Monthly budget planning and tracking
- **Analytics**: Financial reports and insights

### Advanced Features
- **Data Synchronization**: Offline support with sync endpoints
- **Push Notifications**: Budget alerts, goal reminders, bill notifications
- **File Uploads**: Receipt images, transaction imports
- **Recurring Transactions**: Automated recurring expenses/income
- **Split Expenses**: Shared expense tracking
- **Import/Export**: CSV and JSON data import/export

## 🔒 Security

- JWT-based authentication
- Rate limiting (100 requests/15min)
- Input validation with Zod
- CORS protection
- Security headers
- Password hashing with bcryptjs
- Request timeout protection
- File upload validation

## 📈 Performance

- Cluster mode with PM2
- Database indexes for optimal queries
- Lean queries for better performance
- Response caching where appropriate
- Connection pooling
- Memory usage monitoring

## 🔄 Scheduled Jobs

- **Daily**: Budget alerts, bill reminders
- **Weekly**: Financial reports, data cleanup
- **Monthly**: Monthly reports, data archiving
- **Hourly**: Recurring transaction processing

## 📱 Android Integration

The backend is fully prepared for Android integration. See the [Android Integration Guide](docs/ANDROID_INTEGRATION.md) for detailed instructions including:

- API endpoint documentation
- Authentication flow examples
- Error handling patterns
- Push notification setup
- File upload implementation
- Security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `PUT /api/auth/profile` - Update user profile

### Transactions
- `GET /api/transactions` - Get transactions with pagination
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get transaction summary

### Accounts
- `GET /api/accounts` - Get user accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/summary` - Get balance summary

### Categories
- `GET /api/categories` - Get user categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `POST /api/categories/seed` - Seed default categories

### Goals
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/contributions` - Add goal contribution

### Budgets
- `GET /api/budgets` - Get budgets for month/year
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/status` - Get budget utilization

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard summary
- `GET /api/analytics/spending-by-category` - Get spending by category
- `GET /api/analytics/monthly-comparison` - Get monthly trends
- `GET /api/analytics/financial-score` - Get financial health score

### Sync
- `POST /api/sync/pull` - Pull sync data
- `POST /api/sync/push` - Push sync data
- `GET /api/sync/status` - Get sync status

### Notifications
- `POST /api/notifications/test` - Send test notification
- `PUT /api/notifications/settings` - Update notification settings

### Import/Export
- `POST /api/import/transactions` - Import transactions
- `GET /api/export/transactions` - Export transactions
- `GET /api/export/data` - Export all user data

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify network connectivity

2. **JWT Token Issues**
   - Check JWT secrets in .env
   - Ensure token is not expired
   - Verify token format in Authorization header

3. **Firebase Configuration**
   - Verify Firebase project credentials
   - Check service account permissions
   - Ensure Firebase Admin SDK is properly initialized

4. **Rate Limiting**
   - Check rate limit headers in response
   - Implement proper backoff in client
   - Verify rate limit configuration

### Logs

Application logs are written to:
- Console output (development)
- Log files (production with PM2)
- Error logs for debugging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/ANDROID_INTEGRATION.md](docs/ANDROID_INTEGRATION.md)
- **API Reference**: Available at `/api-docs` endpoint
- **Issues**: [GitHub Issues](https://github.com/fintrack/backend/issues)
- **Email**: support@fintrackpro.com

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics with ML insights
- [ ] Multi-currency support
- [ ] Investment portfolio tracking
- [ ] Tax reporting features
- [ ] Multi-tenant architecture
- [ ] Advanced security features

---

**Built with ❤️ for FinTrack Pro**
# fintrack-backend
