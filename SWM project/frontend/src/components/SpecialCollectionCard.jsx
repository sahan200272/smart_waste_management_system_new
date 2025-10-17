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
    <Card className="h-100 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <Badge bg={getPriorityVariant(collection.priority)}>
          {collection.priority.toUpperCase()}
        </Badge>
        <Badge bg={getStatusVariant(collection.status)}>
          {collection.status.replace('-', ' ').toUpperCase()}
        </Badge>
      </Card.Header>
      
      <Card.Body>
        <Card.Title className="text-capitalize">
          {collection.wasteType} Waste Collection
        </Card.Title>
        
        <Card.Text>
          <strong>Description:</strong> {collection.description}
        </Card.Text>
        
        <Stack gap={2}>
          <div>
            <small className="text-muted">Scheduled Date</small>
            <div>{formatDate(collection.scheduledDate)}</div>
          </div>
          
          {collection.specialInstructions && (
            <div>
              <small className="text-muted">Special Instructions</small>
              <div>{collection.specialInstructions}</div>
            </div>
          )}
          
          {collection.assignedTruck && (
            <div>
              <small className="text-muted">Assigned Truck</small>
              <div>{collection.assignedTruck.licensePlate}</div>
            </div>
          )}
        </Stack>
      </Card.Body>
      
      <Card.Footer>
        <Stack direction="horizontal" gap={2}>
          {collection.status === 'pending' && onSchedule && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => onSchedule(collection)}
            >
              Schedule
            </Button>
          )}
          
          {['scheduled', 'in-progress'].includes(collection.status) && onStatusUpdate && (
            <Button 
              variant="success" 
              size="sm"
              onClick={() => onStatusUpdate(collection._id, 'completed')}
            >
              Mark Complete
            </Button>
          )}
          
          <Button 
            variant="outline-secondary" 
            size="sm"
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