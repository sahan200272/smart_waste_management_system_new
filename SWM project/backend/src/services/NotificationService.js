import ResidentNotification from '../model/ResidentNotification.js';

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async notifyResident({ userId, binId, type, message }) {
    try {
      // Save notification to database
      const notification = new ResidentNotification({
        userId,
        binId,
        type,
        message,
        read: false
      });

      await notification.save();

      // Emit socket event for real-time updates
      this.io.emit('notification:resident', {
        userId,
        binId,
        type,
        message,
        createdAt: notification.createdAt
      });

      console.log(`Notification sent to resident ${userId}: ${message}`);
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async notifyBinAlert({ binId, message, type = 'alert' }) {
    try {
      // Emit bin alert for dashboard toasts
      this.io.emit('bin:alert', {
        binId,
        message,
        type,
        timestamp: new Date()
      });

      console.log(`Bin alert emitted for ${binId}: ${message}`);
    } catch (error) {
      console.error('Error emitting bin alert:', error);
      throw error;
    }
  }

  async getNotificationsForUser(userId, limit = 50) {
    try {
      return await ResidentNotification
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      return await ResidentNotification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

export default NotificationService;
