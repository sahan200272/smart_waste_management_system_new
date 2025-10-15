import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnection attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after', this.maxReconnectAttempts, 'attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event subscription methods
  onBinUpdate(callback) {
    if (this.socket) {
      this.socket.on('bin:update', callback);
    }
  }

  onBinAlert(callback) {
    if (this.socket) {
      this.socket.on('bin:alert', callback);
    }
  }

  onMaintenanceUpdate(callback) {
    if (this.socket) {
      this.socket.on('maintenance:update', callback);
    }
  }

  onNotificationResident(callback) {
    if (this.socket) {
      this.socket.on('notification:resident', callback);
    }
  }

  // Event unsubscription methods
  offBinUpdate(callback) {
    if (this.socket) {
      this.socket.off('bin:update', callback);
    }
  }

  offBinAlert(callback) {
    if (this.socket) {
      this.socket.off('bin:alert', callback);
    }
  }

  offMaintenanceUpdate(callback) {
    if (this.socket) {
      this.socket.off('maintenance:update', callback);
    }
  }

  offNotificationResident(callback) {
    if (this.socket) {
      this.socket.off('notification:resident', callback);
    }
  }

  // Join room for specific updates
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', room);
    }
  }

  // Leave room
  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', room);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
