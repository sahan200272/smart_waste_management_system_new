import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import socketService from './lib/socket';
import useBinsStore from './store/useBinsStore';
import useMaintenanceStore from './store/useMaintenanceStore';
import useNotificationsStore from './store/useNotificationsStore';
import Toaster from './components/Toaster';
import Dashboard from './pages/Dashboard';
import BinDetail from './pages/BinDetail';
import MaintenanceQueue from './pages/MaintenanceQueue';
import ResidentAppMock from './pages/ResidentAppMock';
import SpecialCollectionManagement from './pages/SpecialCollectionManagement';
import './App.css';

function App() {
  const { setBins, updateBin, addBin } = useBinsStore();
  const { setTickets, addTicket, updateTicket } = useMaintenanceStore();
  const { addNotification } = useNotificationsStore();

  useEffect(() => {
    // Initialize socket connection with error handling
    try {
      const socket = socketService.connect();
      window.socketService = socketService;

      // Set up socket event listeners
      const handleBinUpdate = (bin) => {
        updateBin(bin);
      };

      const handleMaintenanceUpdate = (ticket) => {
        updateTicket(ticket);
      };

      const handleNotificationResident = (notification) => {
        addNotification(notification);
      };

      socket.onBinUpdate(handleBinUpdate);
      socket.onMaintenanceUpdate(handleMaintenanceUpdate);
      socket.onNotificationResident(handleNotificationResident);

      // Cleanup on unmount
      return () => {
        socket.offBinUpdate(handleBinUpdate);
        socket.offMaintenanceUpdate(handleMaintenanceUpdate);
        socket.offNotificationResident(handleNotificationResident);
        socketService.disconnect();
      };
    } catch (error) {
      console.error('Socket connection error:', error);
      // Continue without socket - the app will still work with manual refresh
    }
  }, [updateBin, updateTicket, addNotification]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bin/:binId" element={<BinDetail />} />
          <Route path="/special-collections" element={<SpecialCollectionManagement />} />
          <Route path="/maintenance" element={<MaintenanceQueue />} />
          <Route path="/residents" element={<ResidentAppMock />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
