import Bin from '../model/Bin.js';
import MaintenanceTicket from '../model/MaintenanceTicket.js';

class HeartbeatService {
  constructor(io, notificationService) {
    this.io = io;
    this.notificationService = notificationService;
    this.intervalId = null;
    this.TIMEOUT_MINUTES = 3; // 3 minutes timeout
  }

  start() {
    // Check every 2 minutes
    this.intervalId = setInterval(async () => {
      await this.checkHeartbeats();
    }, 2 * 60 * 1000);

    console.log('Heartbeat monitoring started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Heartbeat monitoring stopped');
    }
  }

  async checkHeartbeats() {
    try {
      const timeoutThreshold = new Date(Date.now() - this.TIMEOUT_MINUTES * 60 * 1000);
      
      // Find bins that haven't been seen for more than 3 minutes
      const offlineBins = await Bin.find({
        lastSeenAt: { $lt: timeoutThreshold },
        status: { $ne: 'maintenance_needed' }
      });

      for (const bin of offlineBins) {
        await this.handleOfflineBin(bin);
      }
    } catch (error) {
      console.error('Error checking heartbeats:', error);
    }
  }

  async handleOfflineBin(bin) {
    try {
      // Update bin status
      bin.status = 'maintenance_needed';
      bin.faultCode = 'device_offline';
      await bin.save();

      // Create maintenance ticket
      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ticket = new MaintenanceTicket({
        ticketId,
        binId: bin.binId,
        reason: 'device_offline',
        priority: 'high',
        status: 'open',
        notes: `Device offline for more than ${this.TIMEOUT_MINUTES} minutes`
      });

      await ticket.save();

      // Emit updates
      this.io.emit('bin:update', bin);
      this.io.emit('maintenance:update', ticket);

      // Notify residents
      await this.notificationService.notifyResident({
        userId: 'residents', // Generic residents group
        binId: bin.binId,
        type: 'maintenance',
        message: `Bin ${bin.binId} is offline and requires maintenance`
      });

      console.log(`Bin ${bin.binId} marked as offline and maintenance ticket created`);
    } catch (error) {
      console.error(`Error handling offline bin ${bin.binId}:`, error);
    }
  }
}

export default HeartbeatService;
