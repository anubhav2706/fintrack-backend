import mongoose, { Connection } from 'mongoose';
import { env } from './env';

/**
 * MongoDB connection management using Mongoose
 * Handles connection, disconnection, and error events
 */

let isConnected: Connection | null = null;

/**
 * Connect to MongoDB database
 * @returns Promise<Mongoose.Connection>
 */
export async function connectDB(): Promise<Connection> {
  if (isConnected && isConnected.readyState === 1) {
    console.log('📦 MongoDB already connected');
    return isConnected;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    isConnected = conn.connection;
    console.log('✅ MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = null;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return isConnected;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB database
 * @returns Promise<void>
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    isConnected = null;
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Get current connection status
 * @returns number - Connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
 */
export function getConnectionStatus(): number {
  return mongoose.connection.readyState;
}

/**
 * Health check for MongoDB connection
 * @returns Promise<boolean> - True if connected, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Ping the database to verify connection
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      return true;
    }
    return false;
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    return false;
  }
}
