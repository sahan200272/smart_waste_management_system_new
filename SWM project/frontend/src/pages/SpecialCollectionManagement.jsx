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
  Alert,
  Modal
} from 'react-bootstrap';
import SpecialCollectionCard from '../components/SpecialCollectionCard';
import RouteOptimizationPanel from '../components/RouteOptimizationPanel';
import useSpecialCollectionStore from '../store/useSpecialCollectionStore';
import './SpecialCollectionManagement.css';

const SpecialCollectionManagement = () => {
  const [filters, setFilters] = useState({
    status: '',
    wasteType: '',
    priority: '',
    date: ''
  });
  
  const [showMap, setShowMap] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [trafficAlert, setTrafficAlert] = useState(true);
  
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
  }, []);

  useEffect(() => {
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

  const handleRecalculateRoute = () => {
    // Simulate route recalculation
    console.log('Recalculating route...');
    setTrafficAlert(false);
    setTimeout(() => setTrafficAlert(true), 5000);
  };

  const handleRouteAction = (action) => {
    switch(action) {
      case 'recalculate':
        handleRecalculateRoute();
        break;
      case 'avoid-tolls':
        console.log('Avoiding tolls...');
        break;
      case 'fastest':
        console.log('Finding fastest route...');
        break;
      case 'manual':
        setShowMap(true);
        break;
      default:
        break;
    }
  };

  // Mock route data
  const routeData = {
    currentDestination: "Customer X",
    eta: "1h 35m",
    remainingDistance: "45.2 miles",
    upcomingStops: [
      { name: "Warehouse B", eta: "10:30 AM", distance: "12 mi" },
      { name: "Delivery Point C", eta: "11:15 AM", distance: "25 mi" },
      { name: "Customer X", eta: "12:00 PM", distance: "46 mi" }
    ],
    instructions: [
      { action: "Turn left onto", detail: "Main St", active: true },
      { action: "Merge onto", detail: "I-5 North", active: false },
      { action: "Arrive at", detail: "Customer X", active: false }
    ]
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>WastePro</h3>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">📊</span>
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">🛣️</span>
            Routes
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">🚛</span>
            Vehicles
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Container fluid className="py-4">
          <Row className="mb-4">
            <Col>
              <div className="page-header">
                <h1>Special Waste Collection Management</h1>
                <p className="page-subtitle">
                  Manage special waste collection requests and optimize routes using AI
                </p>
              </div>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" dismissible onClose={clearError} className="modern-alert">
              {error}
            </Alert>
          )}

          {/* AI Route Assistant Card */}
          <Card className="ai-route-card mb-4">
            <Card.Body>
              <Row>
                <Col md={8}>
                  <div className="ai-assistant-header">
                    <h5>AI Route Assistant</h5>
                    <p className="text-muted mb-3">Real-time traffic analysis and optimal route suggestions</p>
                  </div>
                  
                  {trafficAlert && (
                    <div className="traffic-alert">
                      <Badge bg="warning" className="traffic-badge">
                        🚨 Traffic detected ahead
                      </Badge>
                    </div>
                  )}
                  
                  <Stack direction="horizontal" gap={2} className="route-actions">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleRouteAction('recalculate')}
                    >
                      Recalculate Route
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleRouteAction('avoid-tolls')}
                    >
                      Avoid Tolls
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleRouteAction('fastest')}
                    >
                      Fastest Route
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleRouteAction('manual')}
                    >
                      Manual Override
                    </Button>
                  </Stack>
                </Col>
                <Col md={4}>
                  <div className="traffic-status">
                    <div className="status-indicator moderate">
                      📊 Real-time Traffic: Moderate
                    </div>
                    <div className="route-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: '65%'}}></div>
                      </div>
                      <div className="progress-text">65% route efficiency</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Row>
            {/* Left Column - Navigation & Info */}
            <Col lg={4}>
              {/* Guided Instructions */}
              <Card className="instructions-panel mb-4">
                <Card.Header>
                  <h6 className="mb-0">🛣️ Guided Instructions</h6>
                </Card.Header>
                <Card.Body>
                  {routeData.instructions.map((instruction, index) => (
                    <div key={index} className={`instruction-step ${instruction.active ? 'active' : ''}`}>
                      <div className="step-icon">
                        {instruction.active ? '↩️' : '🛣️'}
                      </div>
                      <div className="step-content">
                        <div className="step-action">{instruction.action}</div>
                        <div className="step-detail">{instruction.detail}</div>
                      </div>
                    </div>
                  ))}
                  <div className="destination-alert">
                    <Badge bg="success">🎯 Destination on the right in 0.5 miles</Badge>
                  </div>
                </Card.Body>
              </Card>

              {/* Route Summary */}
              <Card className="route-summary mb-4">
                <Card.Header>
                  <h6 className="mb-0">📊 Route Summary</h6>
                </Card.Header>
                <Card.Body>
                  <div className="summary-item">
                    <span className="summary-label">Current Destination</span>
                    <span className="summary-value">{routeData.currentDestination}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">ETA</span>
                    <span className="summary-value">{routeData.eta}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Remaining Distance</span>
                    <span className="summary-value">{routeData.remainingDistance}</span>
                  </div>
                </Card.Body>
              </Card>

              {/* Upcoming Stops */}
              <Card className="upcoming-stops">
                <Card.Header>
                  <h6 className="mb-0">📍 Upcoming Stops</h6>
                </Card.Header>
                <Card.Body>
                  {routeData.upcomingStops.map((stop, index) => (
                    <div key={index} className={`stop-item ${index === 0 ? 'active' : ''}`}>
                      <div className="stop-info">
                        <div className="stop-name">{stop.name}</div>
                        <div className="stop-details">
                          <span className="stop-eta">{stop.eta}</span>
                          <span className="stop-distance">{stop.distance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column - Main Content */}
            <Col lg={8}>
              <Tabs defaultActiveKey="collections" className="modern-tabs mb-4">
                <Tab eventKey="collections" title="📋 Collection Requests">
                  <Row>
                    <Col md={4}>
                      <Card className="filters-panel">
                        <Card.Header>
                          <h6 className="mb-0">🔍 Filters</h6>
                        </Card.Header>
                        <Card.Body>
                          <Stack gap={3}>
                            <Form.Group>
                              <Form.Label>Status</Form.Label>
                              <Form.Select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="modern-select"
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
                                className="modern-select"
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
                                className="modern-select"
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
                                className="modern-input"
                              />
                            </Form.Group>

                            <Button
                              variant="outline-secondary"
                              onClick={handleClearFilters}
                              className="modern-button"
                            >
                              🗑️ Clear Filters
                            </Button>
                          </Stack>
                        </Card.Body>
                      </Card>

                      {/* Statistics Card */}
                      <Card className="mt-3">
                        <Card.Header>
                          <h6 className="mb-0">📈 Statistics</h6>
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

                    <Col md={8}>
                      {loading ? (
                        <div className="loading-state">
                          <div className="spinner"></div>
                          <span>Loading collections...</span>
                        </div>
                      ) : (
                        <div className="collections-grid">
                          {collections.map(collection => (
                            <SpecialCollectionCard
                              key={collection._id}
                              collection={collection}
                              onSchedule={handleScheduleCollection}
                              onStatusUpdate={handleStatusUpdate}
                            />
                          ))}
                          
                          {collections.length === 0 && (
                            <Card className="empty-state">
                              <Card.Body>
                                <div className="empty-icon">📭</div>
                                <h5>No collection requests found</h5>
                                <p className="text-muted">
                                  Adjust your filters or check back later for new requests
                                </p>
                              </Card.Body>
                            </Card>
                          )}
                        </div>
                      )}
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="optimization" title="🚀 Route Optimization">
                  <RouteOptimizationPanel />
                </Tab>
              </Tabs>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Map Modal */}
      <Modal show={showMap} onHide={() => setShowMap(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>🗺️ Manual Route Override</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="map-container">
            <div className="mock-map">
              <div className="map-placeholder">
                <h4>Interactive Map View</h4>
                <p>Drag to adjust route waypoints</p>
                <div className="map-points">
                  <div className="map-point start">📍 Start</div>
                  <div className="map-point waypoint">🔄 Waypoint</div>
                  <div className="map-point destination">🎯 Destination</div>
                </div>
              </div>
            </div>
            <div className="map-controls">
              <Button variant="success" onClick={() => setShowMap(false)}>
                ✅ Apply Route Changes
              </Button>
              <Button variant="outline-secondary" onClick={() => setShowMap(false)}>
                ❌ Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SpecialCollectionManagement;