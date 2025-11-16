import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.router';
import courseRouter from './routes/course.router'; // <-- ADD THIS LINE

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Parses incoming JSON requests

// --- API Routes ---

// Root health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is healthy' });
});

// Auth routes
app.use('/api/auth', authRouter);

// Course routes
app.use('/api/courses', courseRouter); // <-- ADD THIS LINE

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});