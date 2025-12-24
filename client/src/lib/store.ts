
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedResourcesState {
  savedIds: string[];
  userLocation: {
    state: string;
    city: string;
  };
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  setLocation: (state: string, city: string) => void;
}

export const useSavedResources = create<SavedResourcesState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      userLocation: { state: "Texas", city: "Austin" },
      toggleSave: (id: string) => set((state: SavedResourcesState) => {
        const isAlreadySaved = state.savedIds.includes(id);
        if (isAlreadySaved) {
          return { savedIds: state.savedIds.filter((savedId: string) => savedId !== id) };
        } else {
          return { savedIds: [...state.savedIds, id] };
        }
      }),
      isSaved: (id: string) => get().savedIds.includes(id),
      setLocation: (state: string, city: string) => set(() => ({ userLocation: { state, city } })),
    }),
    {
      name: 'veteran-care-saved-resources',
    }
  )
);
