import { create } from 'zustand';
import { specialCollectionAPI } from '../api/http';

const useSpecialCollectionStore = create((set, get) => ({
  collections: [],
  currentCollection: null,
  optimizedRoutes: [],
  statistics: {},
  loading: false,
  error: null,

  // Fetch all collections with filters
  fetchCollections: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await specialCollectionAPI.getCollections(filters);
      set({ 
        collections: response.collections || response, // Handle both response structures
        loading: false 
      });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create new special collection request
  createCollection: async (collectionData) => {
    set({ loading: true, error: null });
    try {
      const response = await specialCollectionAPI.createCollection(collectionData);
      set(state => ({
        collections: [response.collection || response, ...state.collections],
        loading: false
      }));
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },


  // Schedule collection
  scheduleCollection: async (collectionId, truckId) => {
    set({ loading: true, error: null });
    try {
      const response = await specialCollectionAPI.scheduleCollection(collectionId, truckId);
      set(state => ({
        collections: state.collections.map(collection =>
          collection._id === collectionId ? (response.collection || response) : collection
        ),
        loading: false
      }));
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Optimize routes
  optimizeRoutes: async (date) => {
    set({ loading: true, error: null });
    try {
      const response = await specialCollectionAPI.optimizeRoutes(date);
      set({ 
        optimizedRoutes: response.optimizedRoutes || [],
        loading: false 
      });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },


  // Update collection status
  updateCollectionStatus: async (collectionId, status, actualDuration) => {
    set({ loading: true, error: null });
    try {
      const response = await specialCollectionAPI.updateCollectionStatus(collectionId, status, actualDuration);
      set(state => ({
        collections: state.collections.map(collection =>
          collection._id === collectionId ? (response.collection || response) : collection
        ),
        loading: false
      }));
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch statistics
  fetchStatistics: async (period) => {
    set({ loading: true, error: null });
    try {
      const response = await specialCollectionAPI.getStatistics(period);
      set({ 
        statistics: response,
        loading: false 
      });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useSpecialCollectionStore;