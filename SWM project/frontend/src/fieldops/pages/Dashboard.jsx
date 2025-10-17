import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  TruckIcon, 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null);

  // Get user info from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fieldops_auth');
      if (stored) {
        const authData = JSON.parse(stored);
        setUser(authData);
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('fieldops_auth');
      navigate('/fieldops/login');
    }
  };

  // Check for success/error messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'info'
      });
      
      // Clear the navigation state to prevent message from persisting
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  // Mock data - replace with actual API calls later
  const stats = {
    totalTasks: 12,
    completedToday: 8,
    pendingTasks: 4,
    avgCollectionTime: 12
  };

  const recentTasks = [
    { id: 1, binId: 'BIN001', status: 'completed', location: 'Main Street', completedAt: '10:30 AM' },
    { id: 2, binId: 'BIN002', status: 'in-progress', location: 'Park Avenue', startedAt: '11:00 AM' },
    { id: 3, binId: 'BIN003', status: 'pending', location: 'Oak Street', scheduledAt: '12:00 PM' }
  ];

  const quickActions = [
    { 
      title: 'Start Route', 
      description: 'Begin your collection route', 
      link: '/fieldops/start-route',
      icon: TruckIcon,
      color: 'bg-blue-500'
    },
    { 
      title: 'Scan Bin', 
      description: 'Scan a bin QR code', 
      link: '/fieldops/scan',
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500'
    },
    { 
      title: 'Report Issue', 
      description: 'Report a maintenance issue', 
      link: '/fieldops/report-issue',
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500'
    },
    { 
      title: 'View History', 
      description: 'Check collection history', 
      link: '/fieldops/history',
      icon: ChartBarIcon,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Field Operations</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.employeeId || 'Employee'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <ArrowRightOnRectangleIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-md flex items-center justify-between ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 
            notification.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
              {notification.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5 mr-2" />}
              <span>{notification.message}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Field Operations Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your collection overview for today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Today
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completedToday}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.pendingTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Collection Time
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.avgCollectionTime} min
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${action.color} rounded-md p-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Tasks
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your latest collection activities
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTasks.map((task) => (
              <div key={task.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {task.binId} - {task.location}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.completedAt && `Completed at ${task.completedAt}`}
                        {task.startedAt && `Started at ${task.startedAt}`}
                        {task.scheduledAt && `Scheduled for ${task.scheduledAt}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;