# FinTrack Pro Backend - Android Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the FinTrack Pro Android application with the backend API. The backend is built with Node.js, Express.js, TypeScript, and MongoDB, providing a robust REST API for all financial tracking operations.

## Table of Contents

1. [API Base URL](#api-base-url)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Data Synchronization](#data-synchronization)
7. [Push Notifications](#push-notifications)
8. [File Uploads](#file-uploads)
9. [Security Considerations](#security-considerations)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

## API Base URL

### Development Environment
```
https://api-dev.fintrackpro.com
```

### Production Environment
```
https://api.fintrackpro.com
```

### Staging Environment
```
https://api-staging.fintrackpro.com
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid access token in the Authorization header.

### Authentication Flow

1. **User Registration**
   ```http
   POST /api/auth/register
   ```

2. **User Login**
   ```http
   POST /api/auth/login
   ```

3. **Token Refresh**
   ```http
   POST /api/auth/refresh
   ```

### Authorization Header

Include the JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Management

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Passcode**: Optional 4-digit PIN for quick login

### Example Authentication Implementation

```kotlin
class AuthManager {
    private var accessToken: String? = null
    private var refreshToken: String? = null
    
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.success) {
                accessToken = response.data.tokens.accessToken
                refreshToken = response.data.tokens.refreshToken
                // Store tokens securely
                Result.success(response)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun refreshAccessToken(): Result<String> {
        return try {
            val response = apiService.refreshToken(refreshToken ?: return Result.failure(Exception("No refresh token")))
            if (response.success) {
                accessToken = response.data.tokens.accessToken
                Result.success(accessToken!!)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "currency": "USD"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "email_verification_token"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123"
}
```

### Transaction Endpoints

#### Get Transactions
```http
GET /api/transactions?page=1&limit=20&from=2023-01-01&to=2023-12-31
Authorization: Bearer <access_token>
```

#### Create Transaction
```http
POST /api/transactions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Grocery Shopping",
  "amount": 125.50,
  "type": "EXPENSE",
  "categoryId": "category_id",
  "accountId": "account_id",
  "date": "2023-01-15T10:30:00.000Z",
  "notes": "Weekly grocery shopping",
  "tags": ["groceries", "weekly"],
  "paymentMethod": "DEBIT_CARD"
}
```

#### Update Transaction
```http
PUT /api/transactions/{transactionId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Transaction",
  "amount": 150.00,
  "notes": "Updated notes"
}
```

#### Delete Transaction
```http
DELETE /api/transactions/{transactionId}
Authorization: Bearer <access_token>
```

### Account Endpoints

#### Get Accounts
```http
GET /api/accounts
Authorization: Bearer <access_token>
```

#### Create Account
```http
POST /api/accounts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Main Checking Account",
  "type": "BANK",
  "balance": 5000.00,
  "currency": "USD",
  "color": "#5B5FEF",
  "icon": "account_balance_wallet",
  "isDefault": true
}
```

### Category Endpoints

#### Get Categories
```http
GET /api/categories
Authorization: Bearer <access_token>
```

#### Create Category
```http
POST /api/categories
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Food & Dining",
  "icon": "restaurant",
  "color": "#FF6D00",
  "type": "EXPENSE",
  "monthlyBudget": 500.00
}
```

### Goal Endpoints

#### Get Goals
```http
GET /api/goals
Authorization: Bearer <access_token>
```

#### Create Goal
```http
POST /api/goals
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Emergency Fund",
  "targetAmount": 10000.00,
  "currentSaved": 0,
  "deadline": "2023-12-31T23:59:59.000Z",
  "icon": "flag",
  "color": "#4CAF50",
  "priority": 8
}
```

### Budget Endpoints

#### Get Budgets
```http
GET /api/budgets?month=1&year=2023
Authorization: Bearer <access_token>
```

#### Create Budget
```http
POST /api/budgets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "categoryId": "category_id",
  "monthlyLimit": 500.00,
  "month": 1,
  "year": 2023,
  "rolloverEnabled": false,
  "alertThreshold": 80
}
```

## Error Handling

The API returns consistent error responses with the following structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "REQUIRED"
    }
  ]
}
```

### Common Error Codes

- **400**: Bad Request - Validation errors
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Duplicate resource
- **422**: Unprocessable Entity - Business logic errors
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error

### Error Handling Implementation

```kotlin
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(
        val statusCode: Int,
        val message: String,
        val errors: List<FieldError> = emptyList()
    ) : ApiResult<Nothing>()
}

data class FieldError(
    val field: String,
    val message: String,
    val code: String
)

class ApiErrorHandler {
    fun handleError(response: Response<*>): ApiResult.Error {
        return try {
            val errorBody = response.errorBody()?.string()
            val errorResponse = Gson().fromJson(errorBody, ErrorResponse::class.java)
            ApiResult.Error(
                statusCode = errorResponse.statusCode,
                message = errorResponse.message,
                errors = errorResponse.errors
            )
        } catch (e: Exception) {
            ApiResult.Error(
                statusCode = response.code(),
                message = "Unknown error occurred"
            )
        }
    }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **Password Reset**: 3 requests per hour
- **File Upload**: 5 requests per hour

### Rate Limit Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

```kotlin
class RateLimitHandler {
    fun handleRateLimit(response: Response<*>) {
        val limit = response.header("X-RateLimit-Limit")?.toIntOrNull()
        val remaining = response.header("X-RateLimit-Remaining")?.toIntOrNull()
        val reset = response.header("X-RateLimit-Reset")?.toLongOrNull()
        
        if (response.code() == 429) {
            // Implement exponential backoff
            val retryAfter = response.header("Retry-After")?.toLongOrNull() ?: 60
            // Schedule retry after retryAfter seconds
        }
    }
}
```

## Data Synchronization

The API provides synchronization endpoints for offline data management.

### Pull Sync
```http
POST /api/sync/pull
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceId": "unique_device_id",
  "lastSyncAt": "2023-01-15T10:30:00.000Z",
  "collections": ["transactions", "accounts", "categories"]
}
```

### Push Sync
```http
POST /api/sync/push
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceId": "unique_device_id",
  "changes": {
    "transactions": [
      {
        "id": "transaction_id",
        "action": "create",
        "data": { /* transaction data */ }
      }
    ]
  }
}
```

### Sync Implementation

```kotlin
class SyncManager {
    suspend fun pullSync(lastSyncAt: Date?): Result<SyncResponse> {
        return try {
            val request = SyncRequest(
                deviceId = getDeviceId(),
                lastSyncAt = lastSyncAt,
                collections = listOf("transactions", "accounts", "categories", "goals", "budgets")
            )
            val response = apiService.pullSync(request)
            if (response.success) {
                // Process sync data
                processSyncData(response.data.data)
                // Update last sync time
                updateLastSyncTime(response.data.serverTime)
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun processSyncData(data: SyncData) {
        // Process transactions
        data.transactions?.forEach { transaction ->
            when (transaction.action) {
                "create" -> localDatabase.insertTransaction(transaction.data)
                "update" -> localDatabase.updateTransaction(transaction.data)
                "delete" -> localDatabase.deleteTransaction(transaction.id)
            }
        }
        
        // Process other collections...
    }
}
```

## Push Notifications

The backend supports push notifications via Firebase Cloud Messaging (FCM).

### Updating FCM Token
```http
PUT /api/auth/fcm-token
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fcmToken": "fcm_device_token"
}
```

### Notification Types

- **Budget Alerts**: When budget limits are exceeded
- **Goal Reminders**: When goal deadlines approach
- **Bill Reminders**: When bills are due
- **Transaction Confirmations**: For large transactions
- **Weekly Reports**: Financial summaries

### Notification Handling

```kotlin
class NotificationManager {
    fun handleNotification(message: RemoteMessage) {
        val notificationType = message.data["type"]
        val title = message.notification?.title
        val body = message.notification?.body
        
        when (notificationType) {
            "budget_alert" -> handleBudgetAlert(message.data)
            "goal_reminder" -> handleGoalReminder(message.data)
            "bill_reminder" -> handleBillReminder(message.data)
            "weekly_report" -> handleWeeklyReport(message.data)
        }
        
        // Show notification
        showNotification(title, body)
    }
    
    private fun showNotification(title: String?, body: String?) {
        val notificationBuilder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
        
        with(NotificationManagerCompat.from(context)) {
            notify(notificationId++, notificationBuilder.build())
        }
    }
}
```

## File Uploads

The API supports file uploads for receipts and transaction imports.

### Upload Receipt
```http
POST /api/transactions/{transactionId}/receipt
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

receipt: <image_file>
```

### Import Transactions
```http
POST /api/import/transactions
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <csv_or_json_file>
dateCol: "date"
amountCol: "amount"
titleCol: "title"
categoryCol: "category"
```

### File Upload Implementation

```kotlin
class FileUploadManager {
    suspend fun uploadReceipt(transactionId: String, imageUri: Uri): Result<String> {
        return try {
            val file = createTempFileFromUri(imageUri)
            val requestBody = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("receipt", file.name, file.asRequestBody())
                .build()
            
            val response = apiService.uploadReceipt(transactionId, requestBody)
            if (response.success) {
                Result.success(response.data.receiptUrl)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun createTempFileFromUri(uri: Uri): File {
        // Convert URI to File
        // Implementation depends on Android version and URI scheme
        return File(context.cacheDir, "temp_receipt.jpg")
    }
}
```

## Security Considerations

### Token Storage

Store tokens securely using Android's KeyStore:

```kotlin
class SecureStorage {
    private val keyAlias = "fintrack_tokens"
    
    fun storeTokens(accessToken: String, refreshToken: String) {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        
        val sharedPreferences = EncryptedSharedPreferences.create(
            context,
            "secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        
        sharedPreferences.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)
            .apply()
    }
    
    fun getAccessToken(): String? {
        // Retrieve from secure storage
        return sharedPreferences.getString("access_token", null)
    }
}
```

### Certificate Pinning

Implement certificate pinning for enhanced security:

```kotlin
class CertificatePinner {
    private val certificatePinner = CertificatePinner.Builder()
        .add("api.fintrackpro.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        .build()
    
    fun createOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .build()
    }
}
```

### Request Validation

Always validate user input before sending to API:

```kotlin
class RequestValidator {
    fun validateEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
    
    fun validatePassword(password: String): Boolean {
        return password.length >= 8 && 
               password.any { it.isUpperCase() } &&
               password.any { it.isLowerCase() } &&
               password.any { it.isDigit() }
    }
    
    fun validateAmount(amount: String): Boolean {
        return try {
            val value = amount.toDouble()
            value > 0 && value <= 999999.99
        } catch (e: NumberFormatException) {
            false
        }
    }
}
```

## Testing

### Unit Testing API Calls

```kotlin
@Test
fun `login should return success for valid credentials`() = runTest {
    // Given
    val mockApiService = mock<ApiService>()
    val authManager = AuthManager(mockApiService)
    val loginResponse = LoginResponse(
        success = true,
        data = LoginData(
            user = User(id = "1", name = "Test User", email = "test@example.com"),
            tokens = Tokens(accessToken = "access_token", refreshToken = "refresh_token")
        )
    )
    
    whenever(mockApiService.login(any())).thenReturn(Response.success(loginResponse))
    
    // When
    val result = authManager.login("test@example.com", "password123")
    
    // Then
    assertTrue(result.isSuccess)
    assertEquals("access_token", authManager.accessToken)
}
```

### Integration Testing

```kotlin
@Test
fun `create transaction should work end-to-end`() = runTest {
    // Given
    val authManager = AuthManager(apiService)
    val loginResult = authManager.login("test@example.com", "password123")
    assertTrue(loginResult.isSuccess)
    
    // When
    val transactionRequest = CreateTransactionRequest(
        title = "Test Transaction",
        amount = 100.0,
        type = "EXPENSE",
        categoryId = "category_id",
        accountId = "account_id",
        date = Date()
    )
    
    val result = apiService.createTransaction(transactionRequest)
    
    // Then
    assertTrue(result.isSuccessful)
    assertEquals(201, result.code())
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Token Expired
**Problem**: 401 Unauthorized errors
**Solution**: Implement automatic token refresh:

```kotlin
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)
        
        if (response.code == 401) {
            // Refresh token and retry
            val refreshed = authManager.refreshAccessToken()
            if (refreshed.isSuccess) {
                val newRequest = request.newBuilder()
                    .header("Authorization", "Bearer ${authManager.accessToken}")
                    .build()
                return chain.proceed(newRequest)
            }
        }
        
        return response
    }
}
```

#### 2. Network Timeouts
**Problem**: Request timeouts
**Solution**: Configure appropriate timeouts:

```kotlin
val okHttpClient = OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .writeTimeout(30, TimeUnit.SECONDS)
    .build()
```

#### 3. Large File Uploads
**Problem**: File upload failures
**Solution**: Implement chunked uploads:

```kotlin
class ChunkedUploader {
    suspend fun uploadLargeFile(file: File, chunkSize: Int = 1024 * 1024): Result<String> {
        val chunks = file.readBytes().chunked(chunkSize)
        val uploadId = UUID.randomUUID().toString()
        
        try {
            chunks.forEachIndexed { index, chunk ->
                val response = apiService.uploadChunk(uploadId, index, chunk)
                if (!response.success) {
                    throw Exception("Chunk upload failed")
                }
            }
            
            val completeResponse = apiService.completeUpload(uploadId)
            return Result.success(completeResponse.data.fileUrl)
        } catch (e: Exception) {
            return Result.failure(e)
        }
    }
}
```

#### 4. Sync Conflicts
**Problem**: Data synchronization conflicts
**Solution**: Implement conflict resolution:

```kotlin
class ConflictResolver {
    suspend fun resolveConflict(localItem: Transaction, remoteItem: Transaction): Transaction {
        return when {
            localItem.updatedAt > remoteItem.updatedAt -> localItem
            remoteItem.updatedAt > localItem.updatedAt -> remoteItem
            else -> {
                // Same timestamp, use server version
                remoteItem
            }
        }
    }
}
```

### Debug Logging

Implement comprehensive logging for debugging:

```kotlin
class ApiLogger {
    fun logRequest(request: Request) {
        Log.d("FinTrackAPI", "Request: ${request.method} ${request.url}")
        request.headers.forEach { (name, value) ->
            Log.d("FinTrackAPI", "Header: $name = $value")
        }
    }
    
    fun logResponse(response: Response) {
        Log.d("FinTrackAPI", "Response: ${response.code} ${response.message}")
        response.headers.forEach { (name, value) ->
            Log.d("FinTrackAPI", "Header: $name = $value")
        }
    }
    
    fun logError(error: Throwable) {
        Log.e("FinTrackAPI", "API Error", error)
    }
}
```

## Support

For additional support or questions:

- **Email**: support@fintrackpro.com
- **Documentation**: https://docs.fintrackpro.com
- **API Reference**: https://api.fintrackpro.com/api-docs
- **Status Page**: https://status.fintrackpro.com

## Version History

- **v1.0.0**: Initial API release
- **v1.1.0**: Added synchronization endpoints
- **v1.2.0**: Enhanced file upload support
- **v1.3.0**: Added push notifications
- **v1.4.0**: Improved rate limiting and security

---

*This guide is maintained by the FinTrack Pro development team. Last updated: January 2024*
