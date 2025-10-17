import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useBinsStore from '../store/useBinsStore';
import useMaintenanceStore from '../store/useMaintenanceStore';
import useNotificationsStore from '../store/useNotificationsStore';
import { binApi, maintenanceApi, reportsApi } from '../api/http';
import BinCard from '../components/BinCard';

const Dashboard = () => {
  const {
    bins,
    loading,
    error,
    setBins,
    setLoading,
    setError,
    getBinsRequiringSegregation,
    getBinsNeedingMaintenance,
    getHighFillBins,
    getTotalBins,
    getAlertCount
  } = useBinsStore();

  const { getOpenTicketCount } = useMaintenanceStore();
  const { unreadCount } = useNotificationsStore();

  const [stats, setStats] = useState({
    totalBins: 0,
    alerts: 0,
    openTickets: 0,
    unreadNotifications: 0
  });
  
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading dashboard data...');
      
      // Load data with individual error handling
      let binsData = [];
      let ticketsData = [];
      let notificationsData = [];

      try {
        console.log('Fetching bins...');
        binsData = await binApi.getAll();
        console.log('Bins loaded:', binsData);
        setBins(binsData);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Error loading bins:', error);
        setConnectionStatus('disconnected');
        // Continue with empty bins array
      }

      try {
        console.log('Fetching tickets...');
        ticketsData = await maintenanceApi.getAll();
        console.log('Tickets loaded:', ticketsData);
      } catch (error) {
        console.error('Error loading tickets:', error);
        // Continue with empty tickets array
      }

      try {
        console.log('Fetching notifications...');
        notificationsData = await reportsApi.getNotifications();
        console.log('Notifications loaded:', notificationsData);
      } catch (error) {
        console.error('Error loading notifications:', error);
        // Continue with empty notifications array
      }

      // Update stats after bins are set
      const newStats = {
        totalBins: binsData.length,
        alerts: binsData.filter(bin => 
          bin.status === 'segregation_required' || 
          bin.status === 'maintenance_needed' ||
          bin.level >= 85
        ).length,
        openTickets: ticketsData.filter(t => t.status === 'open').length,
        unreadNotifications: notificationsData.filter(n => !n.read).length
      };
      
      console.log('Stats updated:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const segregationBins = getBinsRequiringSegregation();
  const maintenanceBins = getBinsNeedingMaintenance();
  const highFillBins = getHighFillBins();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Smart Waste Management</h1>
              <p className="text-gray-600 mt-1">Real-time bin monitoring and maintenance</p>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-sm"
              >
                Refresh Data
              </button>
              <Link
                to="/maintenance"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Maintenance
              </Link>
              <Link
                to="/residents"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Residents
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bins</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.alerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.openTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 5h5V1h-5v4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unreadNotifications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Sections */}
        {segregationBins.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              Bins Requiring Segregation ({segregationBins.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segregationBins.map(bin => (
                <BinCard key={bin.binId} bin={bin} />
              ))}
            </div>
          </div>
        )}

        {maintenanceBins.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-yellow-500 mr-2">🔧</span>
              Bins Needing Maintenance ({maintenanceBins.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {maintenanceBins.map(bin => (
                <BinCard key={bin.binId} bin={bin} />
              ))}
            </div>
          </div>
        )}

        {highFillBins.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-orange-500 mr-2">📊</span>
              High Fill Level Bins ({highFillBins.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highFillBins.map(bin => (
                <BinCard key={bin.binId} bin={bin} />
              ))}
            </div>
          </div>
        )}

        {/* All Bins */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Bins ({bins.length})</h2>
          {bins.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bins Found</h3>
              <p className="text-gray-500">No bin data available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bins.map(bin => (
                <BinCard key={bin.binId} bin={bin} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
