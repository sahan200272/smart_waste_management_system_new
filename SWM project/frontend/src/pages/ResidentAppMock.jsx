import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useNotificationsStore from '../store/useNotificationsStore';
import { reportsApi, binApi } from '../api/http';
import NotificationCard from '../components/NotificationCard';

const ResidentAppMock = () => {
  const {
    notifications,
    setNotifications,
    markAsRead,
    setLoading,
    setError
  } = useNotificationsStore();

  const [bins, setBins] = useState([]);
  const [reportForm, setReportForm] = useState({
    binId: '',
    issue: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notificationsData, binsData] = await Promise.all([
        reportsApi.getNotifications('residents'),
        binApi.getAll()
      ]);
      
      setNotifications(notificationsData);
      setBins(binsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.binId || !reportForm.issue) return;

    try {
      setSubmitting(true);
      await reportsApi.submitManualReport({
        userId: 'residents',
        binId: reportForm.binId,
        issue: reportForm.issue
      });
      
      setReportForm({ binId: '', issue: '' });
      loadData(); // Reload to get updated notifications
      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await reportsApi.markAsRead(notificationId);
      markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resident App</h1>
              <p className="text-gray-600 mt-1">Notifications and waste management</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/payments"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                💳 Make Payment
              </Link>
              <Link
                to="/"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 5h5V1h-5v4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-semibold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-semibold text-gray-900">{unreadNotifications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-semibold text-gray-900">{readNotifications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Segregation Issue</h2>
          
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bin
              </label>
              <select
                value={reportForm.binId}
                onChange={(e) => setReportForm({ ...reportForm, binId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a bin...</option>
                {bins.map(bin => (
                  <option key={bin.binId} value={bin.binId}>
                    {bin.binId} - {bin.category} ({bin.level}% full)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the Issue
              </label>
              <textarea
                value={reportForm.issue}
                onChange={(e) => setReportForm({ ...reportForm, issue: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the segregation issue you observed..."
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="space-y-6">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Unread Notifications ({unreadNotifications.length})
              </h2>
              <div className="space-y-4">
                {unreadNotifications.map(notification => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Read Notifications ({readNotifications.length})
              </h2>
              <div className="space-y-4">
                {readNotifications.map(notification => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Notifications */}
          {notifications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No notifications yet. Start the simulator to see notifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentAppMock;
