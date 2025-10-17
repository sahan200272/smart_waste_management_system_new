import React, { useState } from 'react';
import { Card, Button, Form, Alert, Stack, Badge } from 'react-bootstrap';
import useSpecialCollectionStore from '../store/useSpecialCollectionStore';

const RouteOptimizationPanel = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { optimizedRoutes, loading, error, optimizeRoutes } = useSpecialCollectionStore();

  const handleOptimizeRoutes = async () => {
    try {
      await optimizeRoutes(selectedDate);
    } catch (error) {
      console.error('Route optimization failed:', error);
    }
  };

  const calculateTotalSavings = (routes) => {
    return routes.reduce((total, route) => {
      const fuelSavings = route.isFallback ? 0 : route.fuelCost * 0.15; // 15% savings estimate
      const timeSavings = route.isFallback ? 0 : route.estimatedDuration * 0.2; // 20% time savings
      return total + fuelSavings + timeSavings;
    }, 0);
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">AI Route Optimization</h5>
      </Card.Header>
      
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Stack gap={3}>
          <Form.Group>
            <Form.Label>Optimization Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            onClick={handleOptimizeRoutes}
            disabled={loading}
          >
            {loading ? 'Optimizing...' : 'Generate Optimized Routes'}
          </Button>
          
          {optimizedRoutes.length > 0 && (
            <div>
              <h6>Optimized Routes</h6>
              <Stack gap={2}>
                {optimizedRoutes.map((route, index) => (
                  <Card key={index} className="bg-light">
                    <Card.Body>
                      <Stack direction="horizontal" className="justify-content-between">
                        <div>
                          <strong>Truck {route.truckId.slice(-4)}</strong>
                          <div className="text-muted">
                            {route.collections.length} collections • {route.totalDistance} km
                          </div>
                        </div>
                        <Stack gap={1}>
                          <Badge bg={route.isFallback ? 'warning' : 'success'}>
                            {route.isFallback ? 'Fallback' : 'AI Optimized'}
                          </Badge>
                          <div className="text-muted small">
                            Est. {route.estimatedDuration} min
                          </div>
                        </Stack>
                      </Stack>
                      
                      {route.trafficConditions && (
                        <div className="mt-2 small">
                          <strong>Conditions:</strong> {route.trafficConditions}, {route.weatherConditions}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </Stack>
              
              <div className="mt-3 p-3 bg-success text-white rounded">
                <strong>Estimated Savings:</strong> ${calculateTotalSavings(optimizedRoutes).toFixed(2)}
              </div>
            </div>
          )}
        </Stack>
      </Card.Body>
    </Card>
  );
};

export default RouteOptimizationPanel;