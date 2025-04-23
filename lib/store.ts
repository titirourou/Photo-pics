import { create } from 'zustand';

interface SearchStore {
  pendingSearch: string | null;
  setPendingSearch: (search: string | null) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  pendingSearch: null,
  setPendingSearch: (search: string | null) => set({ pendingSearch: search }),
})); 