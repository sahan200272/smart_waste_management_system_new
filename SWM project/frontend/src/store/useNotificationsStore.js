import { create } from 'zustand';

const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Actions
  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read).length
  }),
  
  addNotification: (newNotification) => set((state) => ({
    notifications: [newNotification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  
  markAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map(notification => 
      notification._id === notificationId 
        ? { ...notification, read: true }
        : notification
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(notification => ({
      ...notification,
      read: true
    })),
    unreadCount: 0
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  // Computed values
  getUnreadNotifications: () => {
    const { notifications } = get();
    return notifications.filter(notification => !notification.read);
  },
  
  getNotificationsByType: (type) => {
    const { notifications } = get();
    return notifications.filter(notification => notification.type === type);
  },
  
  getLevelNotifications: () => {
    const { notifications } = get();
    return notifications.filter(notification => notification.type === 'level');
  },
  
  getSegregationNotifications: () => {
    const { notifications } = get();
    return notifications.filter(notification => notification.type === 'segregation');
  },
  
  getMaintenanceNotifications: () => {
    const { notifications } = get();
    return notifications.filter(notification => notification.type === 'maintenance');
  },
  
  getTotalNotifications: () => {
    const { notifications } = get();
    return notifications.length;
  }
}));

export default useNotificationsStore;
