// ========================
// SERVER ENTRY POINT
// ========================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import lostReportRoutes from './routes/lostReportRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// ========================
// DATABASE CONNECTION
// ========================
connectDB();

// ========================
// ROUTES (MVC Pattern)
// ========================
app.get('/', (req, res) => {
  res.json({ message: 'Back2U API Server - MVC Architecture' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/lost-reports', lostReportRoutes);
app.use('/api/users', userRoutes);

// ========================
// ERROR HANDLING MIDDLEWARE
// ========================
app.use(errorHandler);

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

export default app;
