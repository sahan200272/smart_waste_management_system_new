// SpecialCollectionCard.jsx (updated styling)
import React from 'react';
import { Card, Badge, Button, Stack } from 'react-bootstrap';

const SpecialCollectionCard = ({ collection, onSchedule, onStatusUpdate }) => {
  const getStatusVariant = (status) => {
    const variants = {
      'pending': 'warning',
      'approved': 'info',
      'scheduled': 'primary',
      'in-progress': 'secondary',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return variants[status] || 'secondary';
  };

  const getPriorityVariant = (priority) => {
    const variants = {
      'low': 'secondary',
      'medium': 'info',
      'high': 'warning',
      'urgent': 'danger'
    };
    return variants[priority] || 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="collection-card">
      <Card.Header className="card-header-modern">
        <Stack direction="horizontal" className="justify-content-between">
          <Badge bg={getPriorityVariant(collection.priority)} className="priority-badge">
            {collection.priority.toUpperCase()}
          </Badge>
          <Badge bg={getStatusVariant(collection.status)} className="status-badge">
            {collection.status.replace('-', ' ').toUpperCase()}
          </Badge>
        </Stack>
      </Card.Header>
      
      <Card.Body>
        <Card.Title className="collection-title">
          {collection.wasteType} Waste Collection
        </Card.Title>
        
        <Card.Text className="collection-description">
          {collection.description}
        </Card.Text>
        
        <Stack gap={2} className="collection-details">
          <div className="detail-item">
            <small className="detail-label">Scheduled Date</small>
            <div className="detail-value">{formatDate(collection.scheduledDate)}</div>
          </div>
          
          {collection.specialInstructions && (
            <div className="detail-item">
              <small className="detail-label">Special Instructions</small>
              <div className="detail-value">{collection.specialInstructions}</div>
            </div>
          )}
          
          {collection.assignedTruck && (
            <div className="detail-item">
              <small className="detail-label">Assigned Truck</small>
              <div className="detail-value">{collection.assignedTruck.licensePlate}</div>
            </div>
          )}
        </Stack>
      </Card.Body>
      
      <Card.Footer className="card-footer-modern">
        <Stack direction="horizontal" gap={2} className="action-buttons">
          {collection.status === 'pending' && onSchedule && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => onSchedule(collection)}
              className="action-btn"
            >
              Schedule
            </Button>
          )}
          
          {['scheduled', 'in-progress'].includes(collection.status) && onStatusUpdate && (
            <Button 
              variant="success" 
              size="sm"
              onClick={() => onStatusUpdate(collection._id, 'completed')}
              className="action-btn"
            >
              Mark Complete
            </Button>
          )}
          
          <Button 
            variant="outline-secondary" 
            size="sm"
            className="action-btn"
            onClick={() => {/* View details */}}
          >
            Details
          </Button>
        </Stack>
      </Card.Footer>
    </Card>
  );
};

export default SpecialCollectionCard;