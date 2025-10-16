import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useMaintenanceStore from '../store/useMaintenanceStore';
import useBinsStore from '../store/useBinsStore';
import { maintenanceApi, binApi } from '../api/http';
import MaintenanceTicketCard from '../components/MaintenanceTicketCard';

const MaintenanceQueue = () => {
  const {
    tickets,
    setTickets,
    setLoading,
    setError,
    getOpenTickets,
    getScheduledTickets,
    getCompletedTickets
  } = useMaintenanceStore();

  const { addBin, setBins } = useBinsStore();

  const [filter, setFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddBinModal, setShowAddBinModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '',
    notes: ''
  });
  const [newBinData, setNewBinData] = useState({
    binId: '',
    category: 'biodegradable',
    level: 0,
    mixed: false,
    location: {
      address: '',
      lat: '',
      lng: ''
    }
  });
  const [submittingBin, setSubmittingBin] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsData = await maintenanceApi.getAll();
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Failed to load maintenance tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = (ticket) => {
    setSelectedTicket(ticket);
    setScheduleData({
      scheduledAt: '',
      notes: ''
    });
    setShowScheduleModal(true);
  };

  const handleClose = async (ticket) => {
    try {
      const updatedTicket = await maintenanceApi.close(ticket.ticketId, {
        notes: 'Ticket closed manually'
      });
      console.log('Ticket closed:', updatedTicket);
      loadTickets(); // Reload to get updated data
    } catch (error) {
      console.error('Error closing ticket:', error);
      setError('Failed to close ticket');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !scheduleData.scheduledAt) return;

    try {
      const updatedTicket = await maintenanceApi.schedule(selectedTicket.ticketId, scheduleData);
      console.log('Ticket scheduled:', updatedTicket);
      setShowScheduleModal(false);
      loadTickets(); // Reload to get updated data
    } catch (error) {
      console.error('Error scheduling ticket:', error);
      setError('Failed to schedule ticket');
    }
  };

  const handleAddBin = () => {
    setNewBinData({
      binId: '',
      category: 'biodegradable',
      level: 0,
      mixed: false,
      location: {
        address: '',
        lat: '',
        lng: ''
      }
    });
    setShowAddBinModal(true);
  };

  const handleAddBinSubmit = async (e) => {
    e.preventDefault();
    if (!newBinData.binId || !newBinData.category) return;

    try {
      setSubmittingBin(true);
      
      // Prepare the data
      const binData = {
        binId: newBinData.binId.trim(),
        category: newBinData.category,
        level: parseInt(newBinData.level) || 0,
        mixed: newBinData.mixed
      };

      // Add location if provided
      if (newBinData.location.address || newBinData.location.lat || newBinData.location.lng) {
        binData.location = {
          address: newBinData.location.address || `Location for ${binData.binId}`,
          lat: parseFloat(newBinData.location.lat) || (6.9271 + (Math.random() - 0.5) * 0.1),
          lng: parseFloat(newBinData.location.lng) || (79.8612 + (Math.random() - 0.5) * 0.1)
        };
      }

      console.log('Creating bin with data:', binData);
      
      const newBin = await binApi.create(binData);
      console.log('Bin created successfully:', newBin);
      
      // Add to local store
      addBin(newBin);
      
      // Refresh bins list
      const binsResponse = await binApi.getAll();
      const bins = Array.isArray(binsResponse) ? binsResponse : binsResponse?.bins || [];
      setBins(bins);
      
      setShowAddBinModal(false);
      alert(`Bin ${newBin.binId} created successfully!`);
      
    } catch (error) {
      console.error('Error creating bin:', error);
      alert(`Failed to create bin: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmittingBin(false);
    }
  };

  const getFilteredTickets = () => {
    switch (filter) {
      case 'open':
        return getOpenTickets();
      case 'scheduled':
        return getScheduledTickets();
      case 'done':
        return getCompletedTickets();
      default:
        return tickets;
    }
  };

  const getFilterCounts = () => {
    return {
      all: tickets.length,
      open: getOpenTickets().length,
      scheduled: getScheduledTickets().length,
      done: getCompletedTickets().length
    };
  };

  const counts = getFilterCounts();
  const filteredTickets = getFilteredTickets();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Maintenance Queue</h1>
              <p className="text-gray-600 mt-1">Manage maintenance tickets and schedules</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddBin}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Bin
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All', count: counts.all },
                { key: 'open', label: 'Open', count: counts.open },
                { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
                { key: 'done', label: 'Done', count: counts.done }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No tickets found for the selected filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map(ticket => (
              <MaintenanceTicketCard
                key={ticket.ticketId}
                ticket={ticket}
                onSchedule={handleSchedule}
                onClose={handleClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Schedule Ticket: {selectedTicket.ticketId}
              </h3>
              
              <form onSubmit={handleScheduleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleData.scheduledAt}
                    onChange={(e) => setScheduleData({
                      ...scheduleData,
                      scheduledAt: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={scheduleData.notes}
                    onChange={(e) => setScheduleData({
                      ...scheduleData,
                      notes: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any additional notes..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Bin Modal */}
      {showAddBinModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Bin
              </h3>
              
              <form onSubmit={handleAddBinSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bin ID *
                    </label>
                    <input
                      type="text"
                      value={newBinData.binId}
                      onChange={(e) => setNewBinData({
                        ...newBinData,
                        binId: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., BIN-007"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={newBinData.category}
                      onChange={(e) => setNewBinData({
                        ...newBinData,
                        category: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="biodegradable">Biodegradable</option>
                      <option value="recyclable">Recyclable</option>
                      <option value="non_biodegradable">Non-Biodegradable</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Fill Level (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newBinData.level}
                      onChange={(e) => setNewBinData({
                        ...newBinData,
                        level: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-4 pt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="mixed"
                          checked={!newBinData.mixed}
                          onChange={() => setNewBinData({
                            ...newBinData,
                            mixed: false
                          })}
                          className="mr-2"
                        />
                        Normal
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="mixed"
                          checked={newBinData.mixed}
                          onChange={() => setNewBinData({
                            ...newBinData,
                            mixed: true
                          })}
                          className="mr-2"
                        />
                        Mixed Waste
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={newBinData.location.address}
                    onChange={(e) => setNewBinData({
                      ...newBinData,
                      location: {
                        ...newBinData.location,
                        address: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Main Street, Colombo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newBinData.location.lat}
                      onChange={(e) => setNewBinData({
                        ...newBinData,
                        location: {
                          ...newBinData.location,
                          lat: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="6.9271"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newBinData.location.lng}
                      onChange={(e) => setNewBinData({
                        ...newBinData,
                        location: {
                          ...newBinData.location,
                          lng: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="79.8612"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBinModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    disabled={submittingBin}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                    disabled={submittingBin}
                  >
                    {submittingBin ? 'Creating...' : 'Create Bin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceQueue;
