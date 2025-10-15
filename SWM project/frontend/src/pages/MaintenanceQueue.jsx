import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useMaintenanceStore from '../store/useMaintenanceStore';
import { maintenanceApi } from '../api/http';
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

  const [filter, setFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '',
    notes: ''
  });

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
            <Link
              to="/"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </Link>
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
    </div>
  );
};

export default MaintenanceQueue;
