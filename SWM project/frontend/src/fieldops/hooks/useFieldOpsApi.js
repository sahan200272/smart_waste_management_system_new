/**
 * @fileoverview React Query Hooks for Field Operations API
 * Centralized API hooks with caching, error handling, and offline support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldOpsApi } from '../api/fieldOpsApi';
import { useOfflineQueue } from './useOfflineQueue';

/**
 * Custom hook for fetching tasks
 * Supports filtering, caching, and offline fallback
 */
export const useTasks = (options = {}) => {
  const { filter = 'today', collectorId } = options;
  
  return useQuery({
    queryKey: ['tasks', filter, collectorId],
    queryFn: () => fieldOpsApi.getTasks({ filter, collectorId }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options
  });
};

/**
 * Custom hook for task details
 */
export const useTask = (taskId, options = {}) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fieldOpsApi.getTask(taskId),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options
  });
};

/**
 * Custom hook for QR scan validation
 * Includes offline queuing for when network is unavailable
 */
export const useScan = () => {
  const queryClient = useQueryClient();
  const { queueOperation } = useOfflineQueue();

  return useMutation({
    mutationFn: (scanData) => fieldOpsApi.validateScan(scanData),
    onSuccess: (data, variables) => {
      // Update related queries
      if (data.success && data.bin) {
        queryClient.setQueryData(['bin', data.bin._id], data.bin);
      }
      
      // Invalidate tasks if scan was part of a task
      if (variables.taskId) {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['task', variables.taskId]);
      }
    },
    onError: (error, variables) => {
      // Queue for offline retry if network error
      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        queueOperation({
          type: 'VALIDATE_SCAN',
          payload: variables,
          retryable: true
        });
      }
    }
  });
};

/**
 * Custom hook for starting collection
 * Optimistic updates with rollback on error
 */
export const useStartCollection = () => {
  const queryClient = useQueryClient();
  const { queueOperation } = useOfflineQueue();

  return useMutation({
    mutationFn: (collectionData) => fieldOpsApi.startCollection(collectionData),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['tasks']);
      
      // Snapshot current tasks
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically update task status
      if (variables.taskId && previousTasks) {
        queryClient.setQueryData(['tasks'], (old) => 
          old.map(task => 
            task._id === variables.taskId 
              ? { ...task, status: 'InProgress' }
              : task
          )
        );
      }
      
      return { previousTasks };
    },
    onSuccess: (data, variables) => {
      // Update with server response
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['events']);
      
      // Cache the new event
      if (data.event) {
        queryClient.setQueryData(['event', data.event._id], data.event);
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      
      // Queue for offline retry
      if (error.message.includes('NetworkError')) {
        queueOperation({
          type: 'START_COLLECTION',
          payload: variables,
          retryable: true
        });
      }
    }
  });
};

/**
 * Custom hook for recording measurements
 */
export const useRecordMeasurement = () => {
  const queryClient = useQueryClient();
  const { queueOperation } = useOfflineQueue();

  return useMutation({
    mutationFn: (measurementData) => fieldOpsApi.recordMeasurement(measurementData),
    onMutate: async (variables) => {
      // Optimistically update event
      const eventId = variables.eventId;
      await queryClient.cancelQueries(['event', eventId]);
      
      const previousEvent = queryClient.getQueryData(['event', eventId]);
      
      if (previousEvent) {
        queryClient.setQueryData(['event', eventId], {
          ...previousEvent,
          measured: {
            weightKg: variables.weightKg,
            fillPct: variables.fillPct,
            wasteType: variables.wasteType,
            photos: variables.photos || []
          }
        });
      }
      
      return { previousEvent };
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(['event', data.event._id], data.event);
      queryClient.invalidateQueries(['events']);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousEvent) {
        queryClient.setQueryData(['event', variables.eventId], context.previousEvent);
      }
      
      // Queue for offline retry
      if (error.message.includes('NetworkError')) {
        queueOperation({
          type: 'RECORD_MEASUREMENT',
          payload: variables,
          retryable: true
        });
      }
    }
  });
};

/**
 * Custom hook for completing collection
 */
export const useCompleteCollection = () => {
  const queryClient = useQueryClient();
  const { queueOperation } = useOfflineQueue();

  return useMutation({
    mutationFn: (completionData) => fieldOpsApi.completeCollection(completionData),
    onSuccess: (data, variables) => {
      // Update event status
      queryClient.setQueryData(['event', variables.eventId], data.event);
      
      // Invalidate related queries
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['stats']);
    },
    onError: (error, variables) => {
      // Queue for offline retry
      if (error.message.includes('NetworkError')) {
        queueOperation({
          type: 'COMPLETE_COLLECTION',
          payload: variables,
          retryable: true
        });
      }
    }
  });
};

/**
 * Custom hook for skipping collection
 */
export const useSkipCollection = () => {
  const queryClient = useQueryClient();
  const { queueOperation } = useOfflineQueue();

  return useMutation({
    mutationFn: (skipData) => fieldOpsApi.skipCollection(skipData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['stats']);
    },
    onError: (error, variables) => {
      if (error.message.includes('NetworkError')) {
        queueOperation({
          type: 'SKIP_COLLECTION',
          payload: variables,
          retryable: true
        });
      }
    }
  });
};

/**
 * Custom hook for creating maintenance tickets
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const { queueOperation } = useOfflineQueue();

  return useMutation({
    mutationFn: (ticketData) => fieldOpsApi.createTicket(ticketData),
    onSuccess: (data) => {
      // Cache new ticket
      queryClient.setQueryData(['ticket', data.ticket._id], data.ticket);
      
      // Invalidate tickets list
      queryClient.invalidateQueries(['tickets']);
      queryClient.invalidateQueries(['stats']);
    },
    onError: (error, variables) => {
      if (error.message.includes('NetworkError')) {
        queueOperation({
          type: 'CREATE_TICKET',
          payload: variables,
          retryable: true
        });
      }
    }
  });
};

/**
 * Custom hook for updating ticket status
 */
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  const { queueOperation } = useOfflineQueue();

  return useMutation({
    mutationFn: (updateData) => fieldOpsApi.updateTicketStatus(updateData),
    onMutate: async (variables) => {
      // Optimistically update ticket
      const ticketId = variables.ticketId;
      await queryClient.cancelQueries(['ticket', ticketId]);
      
      const previousTicket = queryClient.getQueryData(['ticket', ticketId]);
      
      if (previousTicket) {
        queryClient.setQueryData(['ticket', ticketId], {
          ...previousTicket,
          status: variables.newStatus,
          updatedAt: new Date().toISOString()
        });
      }
      
      return { previousTicket };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ticket', data.ticket._id], data.ticket);
      queryClient.invalidateQueries(['tickets']);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', variables.ticketId], context.previousTicket);
      }
      
      if (error.message.includes('NetworkError')) {
        queueOperation({
          type: 'UPDATE_TICKET_STATUS',
          payload: variables,
          retryable: true
        });
      }
    }
  });
};

/**
 * Custom hook for fetching collector statistics
 */
export const useCollectorStats = (collectorId, options = {}) => {
  return useQuery({
    queryKey: ['stats', 'collector', collectorId],
    queryFn: () => fieldOpsApi.getCollectorStats(collectorId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};

/**
 * Custom hook for fetching events/history
 */
export const useEvents = (filters = {}, options = {}) => {
  const { collectorId, page = 1, limit = 20 } = filters;
  
  return useQuery({
    queryKey: ['events', collectorId, page, limit, filters],
    queryFn: () => fieldOpsApi.getEvents({ collectorId, page, limit, ...filters }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true, // For pagination
    ...options
  });
};

/**
 * Custom hook for fetching event details
 */
export const useEvent = (eventId, options = {}) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fieldOpsApi.getEvent(eventId),
    enabled: !!eventId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options
  });
};

/**
 * Custom hook for fetching nearby bins
 */
export const useNearbyBins = (coordinates, radius = 0.5, options = {}) => {
  const { latitude, longitude } = coordinates || {};
  
  return useQuery({
    queryKey: ['bins', 'nearby', latitude, longitude, radius],
    queryFn: () => fieldOpsApi.getNearbyBins(latitude, longitude, radius),
    enabled: !!(latitude && longitude),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Custom hook for fetching bin details
 */
export const useBin = (binId, options = {}) => {
  return useQuery({
    queryKey: ['bin', binId],
    queryFn: () => fieldOpsApi.getBin(binId),
    enabled: !!binId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
};

/**
 * Custom hook for bulk sync operations
 */
export const useBulkSync = () => {
  const queryClient = useQueryClient();
  const { clearQueue } = useOfflineQueue();

  return useMutation({
    mutationFn: (operations) => fieldOpsApi.bulkSync(operations),
    onSuccess: (data) => {
      // Clear successfully synced operations
      if (data.results?.length > 0) {
        clearQueue('completed');
      }
      
      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['tickets']);
      queryClient.invalidateQueries(['stats']);
    }
  });
};