const MaintenanceTicketCard = ({ ticket, onSchedule, onClose }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-500 text-green-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 border-purple-500 text-purple-800';
      case 'done':
        return 'bg-green-100 border-green-500 text-green-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'inconsistent_data':
        return '📊';
      case 'device_offline':
        return '📡';
      case 'mechanism_fault':
        return '⚙️';
      case 'manual_report':
        return '👤';
      default:
        return '🔧';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatScheduledDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-800">{ticket.ticketId}</h3>
        <span className="text-2xl">{getReasonIcon(ticket.reason)}</span>
      </div>

      <div className="space-y-3">
        {/* Status and Priority */}
        <div className="flex gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
            {ticket.status.toUpperCase()}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority.toUpperCase()}
          </span>
        </div>

        {/* Bin ID */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Bin:</span> {ticket.binId}
        </div>

        {/* Reason */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Reason:</span> {ticket.reason.replace('_', ' ')}
        </div>

        {/* Created At */}
        <div className="text-sm text-gray-500">
          <span className="font-medium">Created:</span> {formatDate(ticket.createdAt)}
        </div>

        {/* Scheduled At */}
        {ticket.scheduledAt && (
          <div className="text-sm text-gray-500">
            <span className="font-medium">Scheduled:</span> {formatScheduledDate(ticket.scheduledAt)}
          </div>
        )}

        {/* Notes */}
        {ticket.notes && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {ticket.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {ticket.status === 'open' && onSchedule && (
            <button
              onClick={() => onSchedule(ticket)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              Schedule
            </button>
          )}
          {ticket.status !== 'done' && onClose && (
            <button
              onClick={() => onClose(ticket)}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              Mark Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTicketCard;
