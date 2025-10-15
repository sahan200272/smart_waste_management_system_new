import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import binRoutes, { setBinController } from './src/routes/binRoutes.js';
import maintenanceRoutes, { setMaintenanceController } from './src/routes/maintenanceRoutes.js';
import reportRoutes, { setReportController } from './src/routes/reportRoutes.js';

// Import controllers
import BinController from './src/controllers/binController.js';
import MaintenanceController from './src/controllers/maintenanceController.js';
import ReportController from './src/controllers/reportController.js';

// Import services
import NotificationService from './src/services/NotificationService.js';
import HeartbeatService from './src/services/HeartbeatService.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.VITE_API_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.VITE_API_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const notificationService = new NotificationService(io);
const heartbeatService = new HeartbeatService(io, notificationService);

// Initialize controllers
const binController = new BinController(io, notificationService);
const maintenanceController = new MaintenanceController(io);
const reportController = new ReportController(io, notificationService);

// Set controllers in routes
setBinController(binController);
setMaintenanceController(maintenanceController);
setReportController(reportController);

// Routes
app.use('/api/bins', binRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join rooms for different types of updates
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-waste-management';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start heartbeat monitoring
    heartbeatService.start();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server ready`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  heartbeatService.stop();
  mongoose.connection.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };