import { create } from 'zustand';

const useBinsStore = create((set, get) => ({
  bins: [],
  selectedBin: null,
  loading: false,
  error: null,

  // Actions
  setBins: (bins) => set({ bins }),
  
  setSelectedBin: (bin) => set({ selectedBin: bin }),
  
  updateBin: (updatedBin) => set((state) => ({
    bins: state.bins.map(bin => 
      bin.binId === updatedBin.binId ? updatedBin : bin
    ),
    selectedBin: state.selectedBin?.binId === updatedBin.binId ? updatedBin : state.selectedBin
  })),
  
  addBin: (newBin) => set((state) => ({
    bins: [...state.bins, newBin]
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  // Computed values
  getBinsByStatus: (status) => {
    const { bins } = get();
    return bins.filter(bin => bin.status === status);
  },
  
  getBinsRequiringSegregation: () => {
    const { bins } = get();
    return bins.filter(bin => bin.status === 'segregation_required');
  },
  
  getBinsNeedingMaintenance: () => {
    const { bins } = get();
    return bins.filter(bin => bin.status === 'maintenance_needed');
  },
  
  getHighFillBins: () => {
    const { bins } = get();
    return bins.filter(bin => bin.level >= 85);
  },
  
  getTotalBins: () => {
    const { bins } = get();
    return bins.length;
  },
  
  getAlertCount: () => {
    const { bins } = get();
    return bins.filter(bin => 
      bin.status === 'segregation_required' || 
      bin.status === 'maintenance_needed' ||
      bin.level >= 85
    ).length;
  }
}));

export default useBinsStore;
