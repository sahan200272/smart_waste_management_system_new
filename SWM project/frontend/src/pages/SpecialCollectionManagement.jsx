import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Stack,
  Badge,
  Tabs,
  Tab,
  Alert
} from 'react-bootstrap';
import SpecialCollectionCard from '../components/SpecialCollectionCard';
import RouteOptimizationPanel from '../components/RouteOptimizationPanel';
import useSpecialCollectionStore from '../store/useSpecialCollectionStore';

const SpecialCollectionManagement = () => {
  const [filters, setFilters] = useState({
    status: '',
    wasteType: '',
    priority: '',
    date: ''
  });
  
  const {
    collections,
    statistics,
    loading,
    error,
    fetchCollections,
    fetchStatistics,
    scheduleCollection,
    updateCollectionStatus,
    clearError
  } = useSpecialCollectionStore();

  useEffect(() => {
    fetchCollections(filters);
    fetchStatistics('month');
  }, []); // Remove filters from dependency to prevent infinite loops

  useEffect(() => {
    // Debounced filter updates
    const timeoutId = setTimeout(() => {
      fetchCollections(filters);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      wasteType: '',
      priority: '',
      date: ''
    });
  };

  const handleScheduleCollection = async (collection) => {
    try {
      // In a real app, you'd select from available trucks via a modal
      const truckId = 'mock-truck-id'; 
      await scheduleCollection(collection._id, truckId);
    } catch (error) {
      console.error('Failed to schedule collection:', error);
    }
  };

  const handleStatusUpdate = async (collectionId, status) => {
    try {
      await updateCollectionStatus(collectionId, status);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Special Waste Collection Management</h1>
          <p className="text-muted">
            Manage special waste collection requests and optimize routes using AI
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={clearError}>
          {error}
        </Alert>
      )}

      <Tabs defaultActiveKey="collections" className="mb-4">
        <Tab eventKey="collections" title="Collection Requests">
          <Row>
            <Col md={3}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Filters</h6>
                </Card.Header>
                <Card.Body>
                  <Stack gap={3}>
                    <Form.Group>
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Waste Type</Form.Label>
                      <Form.Select
                        value={filters.wasteType}
                        onChange={(e) => handleFilterChange('wasteType', e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="hazardous">Hazardous</option>
                        <option value="bulk">Bulk</option>
                        <option value="electronic">Electronic</option>
                        <option value="construction">Construction</option>
                        <option value="other">Other</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Priority</Form.Label>
                      <Form.Select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                      >
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                      />
                    </Form.Group>

                    <Button
                      variant="outline-secondary"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </Button>
                  </Stack>
                </Card.Body>
              </Card>

              {/* Statistics Card */}
              <Card className="mt-3">
                <Card.Header>
                  <h6 className="mb-0">Statistics</h6>
                </Card.Header>
                <Card.Body>
                  {statistics.overall && (
                    <Stack gap={2}>
                      <div className="d-flex justify-content-between">
                        <span>Total Collections:</span>
                        <Badge bg="primary">{statistics.overall.totalCollections || 0}</Badge>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Completion Rate:</span>
                        <Badge bg="success">
                          {((statistics.overall.completionRate || 0) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </Stack>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={9}>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Row>
                  {collections.map(collection => (
                    <Col key={collection._id} lg={6} className="mb-3">
                      <SpecialCollectionCard
                        collection={collection}
                        onSchedule={handleScheduleCollection}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    </Col>
                  ))}
                  
                  {collections.length === 0 && (
                    <Col>
                      <Card className="text-center py-5">
                        <Card.Body>
                          <h5>No collection requests found</h5>
                          <p className="text-muted">
                            Adjust your filters or check back later for new requests
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                </Row>
              )}
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="optimization" title="Route Optimization">
          <Row>
            <Col lg={8}>
              <RouteOptimizationPanel />
            </Col>
            <Col lg={4}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Optimization Benefits</h6>
                </Card.Header>
                <Card.Body>
                  <Stack gap={3}>
                    <div>
                      <strong>Cost Reduction</strong>
                      <p className="text-muted small mb-0">
                        AI optimization reduces fuel costs by 15-20% through efficient routing
                      </p>
                    </div>
                    <div>
                      <strong>Time Savings</strong>
                      <p className="text-muted small mb-0">
                        Optimized routes save 20-30% in collection time
                      </p>
                    </div>
                    <div>
                      <strong>Real-time Adaptation</strong>
                      <p className="text-muted small mb-0">
                        Dynamic adjustments for traffic and weather conditions
                      </p>
                    </div>
                    <div>
                      <strong>Fallback Support</strong>
                      <p className="text-muted small mb-0">
                        Static route generation when AI services are unavailable
                      </p>
                    </div>
                  </Stack>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default SpecialCollectionManagement;