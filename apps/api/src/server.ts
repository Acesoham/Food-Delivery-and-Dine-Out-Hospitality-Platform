import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env';
import { connectDB } from './config/database';
import { errorHandler, notFoundHandler } from './middleware';
import { initializeSocket } from './sockets';

// Routes
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';

const app: express.Application = express();
const httpServer = createServer(app);

// ─── Middleware ───
app.use(helmet());
app.use(cors({
  origin: [config.clientUrl, config.merchantUrl],
  credentials: true,
}));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Socket.io ───
const io = initializeSocket(httpServer);
app.set('io', io);

// ─── Health Check ───
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Food Delivery API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ─── API Routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// ─── Error Handling ───
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ───
const startServer = async () => {
  await connectDB();

  httpServer.listen(config.port, () => {
    console.log(`
    ╔══════════════════════════════════════════════╗
    ║  🍕 Food Delivery API Server                ║
    ║  Port: ${config.port}                                ║
    ║  Environment: ${config.nodeEnv.padEnd(30)}║
    ║  Socket.io: Enabled                         ║
    ╚══════════════════════════════════════════════╝
    `);
  });
};

startServer().catch(console.error);

export { app, httpServer };
