
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedResourcesState {
  savedIds: string[];
  userLocation: {
    state: string;
    stateCode: string;
    city: string;
    zip: string;
  };
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  setLocation: (stateCode: string, state: string, city: string, zip: string) => void;
}

export const useSavedResources = create<SavedResourcesState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      userLocation: { state: "", stateCode: "", city: "", zip: "" },
      toggleSave: (id: string) => set((state: SavedResourcesState) => {
        const isAlreadySaved = state.savedIds.includes(id);
        if (isAlreadySaved) {
          return { savedIds: state.savedIds.filter((savedId: string) => savedId !== id) };
        } else {
          return { savedIds: [...state.savedIds, id] };
        }
      }),
      isSaved: (id: string) => get().savedIds.includes(id),
      setLocation: (stateCode: string, state: string, city: string, zip: string) => set(() => ({
        userLocation: { stateCode, state, city, zip }
      })),
    }),
    {
      name: 'veteran-care-saved-resources',
    }
  )
);
