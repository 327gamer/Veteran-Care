
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedResourcesState {
  savedIds: string[];
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedResources = create<SavedResourcesState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSave: (id: string) => set((state: SavedResourcesState) => {
        const isAlreadySaved = state.savedIds.includes(id);
        if (isAlreadySaved) {
          return { savedIds: state.savedIds.filter((savedId: string) => savedId !== id) };
        } else {
          return { savedIds: [...state.savedIds, id] };
        }
      }),
      isSaved: (id: string) => get().savedIds.includes(id),
    }),
    {
      name: 'veteran-care-saved-resources',
    }
  )
);
