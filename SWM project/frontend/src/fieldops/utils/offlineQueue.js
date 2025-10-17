/**
 * @fileoverview IndexedDB Offline Queue Management
 * Handles offline operation queuing with automatic retry and conflict resolution
 */

import { openDB } from 'idb';

const DB_NAME = 'FieldOpsOfflineDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'operationQueue';
const CACHE_STORE = 'dataCache';

/**
 * IndexedDB database initialization
 */
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Operation queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        
        queueStore.createIndex('status', 'status');
        queueStore.createIndex('type', 'type');
        queueStore.createIndex('userId', 'userId');
        queueStore.createIndex('createdAt', 'createdAt');
        queueStore.createIndex('retryCount', 'retryCount');
      }
      
      // Data cache store
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        const cacheStore = db.createObjectStore(CACHE_STORE, {
          keyPath: 'key'
        });
        
        cacheStore.createIndex('category', 'category');
        cacheStore.createIndex('expiresAt', 'expiresAt');
      }
    }
  });
};

/**
 * Offline Queue Manager Class
 * Handles operation queuing, retry logic, and sync management
 */
class OfflineQueueManager {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.retryTimeouts = new Map();
    
    this.init();
    this.setupEventListeners();
  }

  /**
   * Initialize the database connection
   */
  async init() {
    try {
      this.db = await initDB();
      console.log('OfflineQueueManager initialized');
    } catch (error) {
      console.error('Failed to initialize OfflineQueueManager:', error);
    }
  }

  /**
   * Setup online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingOperations();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Queue an operation for later execution
   */
  async queueOperation(operation) {
    if (!this.db) await this.init();
    
    const queueItem = {
      ...operation,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: operation.maxRetries || 3,
      userId: operation.userId || this.getCurrentUserId()
    };

    try {
      const tx = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const id = await store.add(queueItem);
      
      console.log(`Operation queued with ID: ${id}`, queueItem);
      
      // Try to process immediately if online
      if (this.isOnline) {
        setTimeout(() => this.processPendingOperations(), 100);
      }
      
      return id;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }

  /**
   * Process all pending operations
   */
  async processPendingOperations() {
    if (!this.db || this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    
    try {
      const tx = this.db.transaction([QUEUE_STORE], 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const index = store.index('status');
      const pendingOps = await index.getAll('pending');
      
      console.log(`Processing ${pendingOps.length} pending operations`);
      
      for (const operation of pendingOps) {
        await this.executeOperation(operation);
      }
    } catch (error) {
      console.error('Failed to process pending operations:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Execute a single operation
   */
  async executeOperation(operation) {
    try {
      await this.updateOperationStatus(operation.id, 'processing');
      
      const result = await this.performOperation(operation);
      
      if (result.success) {
        await this.updateOperationStatus(operation.id, 'completed', { result });
        console.log(`Operation ${operation.id} completed successfully`);
      } else {
        await this.handleOperationFailure(operation, result.error);
      }
    } catch (error) {
      await this.handleOperationFailure(operation, error);
    }
  }

  /**
   * Perform the actual operation based on type
   */
  async performOperation(operation) {
    const { fieldOpsApi } = await import('../api/fieldOpsApi');
    
    try {
      switch (operation.type) {
        case 'VALIDATE_SCAN':
          return { success: true, data: await fieldOpsApi.validateScan(operation.payload) };
          
        case 'START_COLLECTION':
          return { success: true, data: await fieldOpsApi.startCollection(operation.payload) };
          
        case 'RECORD_MEASUREMENT':
          return { success: true, data: await fieldOpsApi.recordMeasurement(operation.payload) };
          
        case 'COMPLETE_COLLECTION':
          return { success: true, data: await fieldOpsApi.completeCollection(operation.payload) };
          
        case 'SKIP_COLLECTION':
          return { success: true, data: await fieldOpsApi.skipCollection(operation.payload) };
          
        case 'CREATE_TICKET':
          return { success: true, data: await fieldOpsApi.createTicket(operation.payload) };
          
        case 'UPDATE_TICKET_STATUS':
          return { success: true, data: await fieldOpsApi.updateTicketStatus(operation.payload) };
          
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Handle operation failure with retry logic
   */
  async handleOperationFailure(operation, error) {
    const isRetryable = this.isRetryableError(error);
    const canRetry = operation.retryCount < operation.maxRetries;
    
    if (isRetryable && canRetry) {
      const retryDelay = this.calculateRetryDelay(operation.retryCount);
      
      await this.updateOperationStatus(operation.id, 'pending', {
        retryCount: operation.retryCount + 1,
        lastError: error.message,
        nextRetryAt: new Date(Date.now() + retryDelay).toISOString()
      });
      
      // Schedule retry
      this.retryTimeouts.set(operation.id, setTimeout(() => {
        this.executeOperation({ ...operation, retryCount: operation.retryCount + 1 });
      }, retryDelay));
      
      console.log(`Operation ${operation.id} will retry in ${retryDelay}ms (attempt ${operation.retryCount + 1})`);
    } else {
      await this.updateOperationStatus(operation.id, 'failed', {
        error: error.message,
        finalRetryCount: operation.retryCount
      });
      
      console.error(`Operation ${operation.id} failed permanently:`, error);
    }
  }

  /**
   * Update operation status in database
   */
  async updateOperationStatus(id, status, updates = {}) {
    const tx = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    
    const operation = await store.get(id);
    if (!operation) return;
    
    const updatedOperation = {
      ...operation,
      ...updates,
      status,
      updatedAt: new Date().toISOString()
    };
    
    await store.put(updatedOperation);
  }

  /**
   * Get queue status and statistics
   */
  async getQueueStatus(userId = null) {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction([QUEUE_STORE], 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    
    let operations;
    if (userId) {
      const index = store.index('userId');
      operations = await index.getAll(userId);
    } else {
      operations = await store.getAll();
    }
    
    const stats = {
      total: operations.length,
      pending: operations.filter(op => op.status === 'pending').length,
      processing: operations.filter(op => op.status === 'processing').length,
      completed: operations.filter(op => op.status === 'completed').length,
      failed: operations.filter(op => op.status === 'failed').length,
      lastSync: this.getLastSyncTime(operations)
    };
    
    return stats;
  }

  /**
   * Clear completed or failed operations
   */
  async clearQueue(statusFilter = 'completed') {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const index = store.index('status');
    
    let operations;
    if (statusFilter === 'all') {
      operations = await store.getAll();
    } else {
      operations = await index.getAll(statusFilter);
    }
    
    let cleared = 0;
    for (const operation of operations) {
      await store.delete(operation.id);
      cleared++;
    }
    
    console.log(`Cleared ${cleared} operations with status: ${statusFilter}`);
    return cleared;
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key, data, category = 'general', ttl = 60 * 60 * 1000) {
    if (!this.db) await this.init();
    
    const cacheItem = {
      key,
      data,
      category,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl).toISOString()
    };
    
    const tx = this.db.transaction([CACHE_STORE], 'readwrite');
    const store = tx.objectStore(CACHE_STORE);
    await store.put(cacheItem);
  }

  /**
   * Retrieve cached data
   */
  async getCachedData(key) {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction([CACHE_STORE], 'readonly');
    const store = tx.objectStore(CACHE_STORE);
    const item = await store.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (new Date(item.expiresAt) < new Date()) {
      await store.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction([CACHE_STORE], 'readwrite');
    const store = tx.objectStore(CACHE_STORE);
    const index = store.index('expiresAt');
    
    const now = new Date().toISOString();
    const expiredItems = await index.getAll(IDBKeyRange.upperBound(now));
    
    for (const item of expiredItems) {
      await store.delete(item.key);
    }
    
    return expiredItems.length;
  }

  /**
   * Utility methods
   */
  calculateRetryDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  isRetryableError(error) {
    const retryablePatterns = [
      'NetworkError',
      'fetch',
      'timeout',
      '500',
      '502',
      '503',
      '504'
    ];
    
    return retryablePatterns.some(pattern => 
      error.message?.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  getLastSyncTime(operations) {
    const completed = operations.filter(op => op.status === 'completed');
    if (completed.length === 0) return null;
    
    return completed.reduce((latest, op) => {
      const opTime = new Date(op.updatedAt);
      return opTime > latest ? opTime : latest;
    }, new Date(0));
  }

  getCurrentUserId() {
    // In a real app, get from auth context
    return localStorage.getItem('userId') || 'anonymous';
  }
}

// Create singleton instance
const offlineQueueManager = new OfflineQueueManager();

export default offlineQueueManager;