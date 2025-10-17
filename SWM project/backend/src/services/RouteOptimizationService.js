import axios from 'axios';

class RouteOptimizationService {
  constructor(io, notificationService) {
    this.io = io;
    this.notificationService = notificationService;
  }

  // AI-powered route optimization engine
  async optimizeRoutes(collectionRequests, trucks) {
    try {
      // Fetch real-time data
      const [trafficData, weatherData] = await Promise.all([
        this.fetchTrafficData(),
        this.fetchWeatherData()
      ]);

      // Filter available trucks
      const availableTrucks = trucks.filter(truck => 
        truck.status === 'available' && truck.currentLoad < truck.capacity
      );

      if (availableTrucks.length === 0) {
        throw new Error('No available trucks for route optimization');
      }

      // Group requests by waste type and priority
      const groupedRequests = this.groupRequests(collectionRequests);
      
      // Generate optimized routes
      const optimizedRoutes = await this.generateOptimizedRoutes(
        groupedRequests, 
        availableTrucks, 
        trafficData, 
        weatherData
      );

      // Emit real-time updates
      this.io.emit('route-optimization-update', {
        timestamp: new Date(),
        optimizedRoutes: optimizedRoutes,
        trafficConditions: trafficData.conditions,
        weatherConditions: weatherData.conditions
      });

      return optimizedRoutes;

    } catch (error) {
      console.error('Route optimization error:', error);
      
      // Fallback to static routes
      return this.generateFallbackRoutes(collectionRequests, trucks);
    }
  }

  async fetchTrafficData() {
    try {
      // Mock traffic API integration
      const response = await axios.get(process.env.TRAFFIC_API_URL, {
        params: {
          apiKey: process.env.TRAFFIC_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.warn('Traffic API unavailable, using fallback data');
      return this.getFallbackTrafficData();
    }
  }

  async fetchWeatherData() {
    try {
      // Mock weather API integration
      const response = await axios.get(process.env.WEATHER_API_URL, {
        params: {
          appId: process.env.WEATHER_API_KEY,
          units: 'metric'
        }
      });
      return response.data;
    } catch (error) {
      console.warn('Weather API unavailable, using fallback data');
      return this.getFallbackWeatherData();
    }
  }

  groupRequests(requests) {
    return requests.reduce((groups, request) => {
      const key = `${request.wasteType}-${request.priority}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(request);
      return groups;
    }, {});
  }

  async generateOptimizedRoutes(requests, trucks, trafficData, weatherData) {
  const optimizedRoutes = [];
  const assignedCollectionIds = new Set();

  for (const [groupKey, groupRequests] of Object.entries(requests)) {
    const [wasteType, priority] = groupKey.split('-');
    
    // Find suitable trucks for this waste type
    const suitableTrucks = trucks.filter(truck => 
      truck.specialWasteTypes && truck.specialWasteTypes.includes(wasteType)
    );

    if (suitableTrucks.length === 0) {
      console.warn(`No suitable trucks found for waste type: ${wasteType}`);
      continue;
    }

    // Assign requests to trucks based on capacity and load
    for (const request of groupRequests) {
      if (assignedCollectionIds.has(request._id.toString())) continue;

      const truck = this.findOptimalTruck(suitableTrucks, request);
      if (!truck) continue;

      let route = optimizedRoutes.find(r => r.truckId === truck._id);
      if (!route) {
        route = {
          truckId: truck._id,
          wasteType,
          priority,
          collections: [],
          totalDistance: 0,
          estimatedDuration: 0,
          fuelCost: 0,
          trafficConditions: trafficData.conditions,
          weatherConditions: weatherData.conditions
        };
        optimizedRoutes.push(route);
      }

      const optimizedSequence = await this.optimizeCollectionSequence(
        [...route.collections.map(c => c.collectionId), request._id],
        truck.currentLocation,
        trafficData,
        weatherData
      );

      route.collections = optimizedSequence;
      assignedCollectionIds.add(request._id.toString());
    }
  }

  // Handle unassigned requests with fallback
  const unassignedRequests = Object.values(requests).flat().filter(
    req => !assignedCollectionIds.has(req._id.toString())
  );
  
  if (unassignedRequests.length > 0) {
    const fallbackRoutes = this.generateFallbackRoutes(unassignedRequests, trucks);
    optimizedRoutes.push(...fallbackRoutes);
  }

  return optimizedRoutes;
}

findOptimalTruck(trucks, request) {
  return trucks
    .filter(truck => truck.currentLoad < truck.capacity)
    .sort((a, b) => (b.capacity - b.currentLoad) - (a.capacity - a.currentLoad))[0];
}

  async optimizeCollectionSequence(requests, truckLocation, trafficData, weatherData) {
    // Implement traveling salesman problem with constraints
    // This is a simplified version - real implementation would use proper algorithms
    
    return requests
      .sort((a, b) => {
        // Sort by priority and distance
        const priorityWeight = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      })
      .map((request, index) => ({
        sequence: index + 1,
        collectionId: request._id,
        binId: request.binId,
        estimatedArrival: this.calculateEstimatedArrival(index, trafficData, weatherData),
        specialInstructions: request.specialInstructions
      }));
  }

  calculateEstimatedArrival(sequence, trafficData, weatherData) {
    const baseTimePerStop = 30; // minutes
    const travelTimeFactor = trafficData.congestionLevel || 1;
    const weatherFactor = weatherData.condition === 'rain' ? 1.2 : 1;
    
    const estimatedMinutes = sequence * baseTimePerStop * travelTimeFactor * weatherFactor;
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + estimatedMinutes);
    
    return arrivalTime;
  }

  generateFallbackRoutes(requests, trucks) {
    // Simple round-robin assignment when AI engine fails
    console.log('Using fallback route generation');
    
    return requests.map((request, index) => ({
      truckId: trucks[index % trucks.length]._id,
      collections: [{
        sequence: 1,
        collectionId: request._id,
        binId: request.binId,
        estimatedArrival: new Date(Date.now() + (index * 30 * 60 * 1000)),
        specialInstructions: request.specialInstructions
      }],
      totalDistance: 0,
      estimatedDuration: 30,
      fuelCost: 0,
      trafficConditions: 'unknown',
      weatherConditions: 'unknown',
      isFallback: true
    }));
  }

  getFallbackTrafficData() {
    return {
      conditions: 'moderate',
      congestionLevel: 1.2,
      lastUpdated: new Date()
    };
  }

  getFallbackWeatherData() {
    return {
      condition: 'clear',
      temperature: 25,
      lastUpdated: new Date()
    };
  }
}

export default RouteOptimizationService;