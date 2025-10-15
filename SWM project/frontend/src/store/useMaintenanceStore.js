import { create } from 'zustand';

const useMaintenanceStore = create((set, get) => ({
  tickets: [],
  loading: false,
  error: null,

  // Actions
  setTickets: (tickets) => set({ tickets }),
  
  addTicket: (newTicket) => set((state) => ({
    tickets: [newTicket, ...state.tickets]
  })),
  
  updateTicket: (updatedTicket) => set((state) => ({
    tickets: state.tickets.map(ticket => 
      ticket.ticketId === updatedTicket.ticketId ? updatedTicket : ticket
    )
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  // Computed values
  getTicketsByStatus: (status) => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.status === status);
  },
  
  getOpenTickets: () => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.status === 'open');
  },
  
  getScheduledTickets: () => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.status === 'scheduled');
  },
  
  getCompletedTickets: () => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.status === 'done');
  },
  
  getTicketsByPriority: (priority) => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.priority === priority);
  },
  
  getHighPriorityTickets: () => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.priority === 'high');
  },
  
  getTotalTickets: () => {
    const { tickets } = get();
    return tickets.length;
  },
  
  getOpenTicketCount: () => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.status === 'open').length;
  },
  
  getScheduledTicketCount: () => {
    const { tickets } = get();
    return tickets.filter(ticket => ticket.status === 'scheduled').length;
  }
}));

export default useMaintenanceStore;
