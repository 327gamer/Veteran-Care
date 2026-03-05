import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ServiceProfile {
  branch: string;
  era: string;
  rank: string;
  mos: string;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

interface SavedResourcesState {
  savedIds: string[];
  userLocation: {
    state: string;
    stateCode: string;
    city: string;
    zip: string;
  };
  onboardingComplete: boolean;
  interests: string[];
  serviceProfile: ServiceProfile;
  hasSeenWelcome: boolean;
  hasSeenTutorial: boolean;
  chatHistory: ChatMessage[];
  authToken: string | null;
  deviceMigrated: boolean;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  setSavedIds: (ids: string[]) => void;
  setLocation: (stateCode: string, state: string, city: string, zip: string) => void;
  completeOnboarding: () => void;
  setInterests: (interests: string[]) => void;
  setServiceProfile: (profile: Partial<ServiceProfile>) => void;
  markWelcomeSeen: () => void;
  markTutorialSeen: () => void;
  resetTutorialSeen: () => void;
  addChatMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void;
  clearChatHistory: () => void;
  setAuthToken: (token: string | null) => void;
  markDeviceMigrated: () => void;
  clearAuthState: () => void;
}

async function serverToggleSave(token: string, resourceId: string, action: "save" | "unsave"): Promise<string[] | null> {
  try {
    const res = await fetch("/api/saved-resources/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ resource_id: resourceId, action }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ids;
  } catch {
    return null;
  }
}

export const useSavedResources = create<SavedResourcesState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      userLocation: { state: "", stateCode: "", city: "", zip: "" },
      onboardingComplete: false,
      interests: [],
      serviceProfile: { branch: "", era: "", rank: "", mos: "" },
      hasSeenWelcome: false,
      hasSeenTutorial: false,
      chatHistory: [],
      authToken: null,
      deviceMigrated: false,
      toggleSave: (id: string) => {
        const state = get();
        const isAlreadySaved = state.savedIds.includes(id);
        const newIds = isAlreadySaved
          ? state.savedIds.filter((savedId: string) => savedId !== id)
          : [...state.savedIds, id];
        set({ savedIds: newIds });

        if (state.authToken) {
          serverToggleSave(state.authToken, id, isAlreadySaved ? "unsave" : "save")
            .then((serverIds) => {
              if (serverIds) {
                set({ savedIds: serverIds });
              }
            });
        }
      },
      isSaved: (id: string) => get().savedIds.includes(id),
      setSavedIds: (ids: string[]) => set({ savedIds: ids }),
      setLocation: (stateCode: string, state: string, city: string, zip: string) => set(() => ({
        userLocation: { stateCode, state, city, zip }
      })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      setInterests: (interests: string[]) => set({ interests }),
      setServiceProfile: (profile: Partial<ServiceProfile>) => set((state) => ({
        serviceProfile: { ...state.serviceProfile, ...profile }
      })),
      markWelcomeSeen: () => set({ hasSeenWelcome: true }),
      markTutorialSeen: () => set({ hasSeenTutorial: true }),
      resetTutorialSeen: () => set({ hasSeenTutorial: false }),
      addChatMessage: (msg) => set((state) => ({
        chatHistory: [...state.chatHistory, { ...msg, timestamp: Date.now() }]
      })),
      clearChatHistory: () => set({ chatHistory: [] }),
      setAuthToken: (token: string | null) => set({ authToken: token }),
      markDeviceMigrated: () => set({ deviceMigrated: true }),
      clearAuthState: () => set({ authToken: null, savedIds: [], deviceMigrated: false }),
    }),
    {
      name: 'veteran-care-saved-resources',
    }
  )
);

export async function syncSavedOnLogin(token: string): Promise<string[]> {
  const store = useSavedResources.getState();
  const localIds = store.savedIds;

  try {
    const res = await fetch("/api/saved-resources/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ localIds: store.deviceMigrated ? [] : localIds }),
    });
    if (!res.ok) return localIds;
    const data = await res.json();
    const serverIds: string[] = data.ids;

    useSavedResources.setState({
      savedIds: serverIds,
      authToken: token,
      deviceMigrated: true,
    });
    return serverIds;
  } catch {
    return localIds;
  }
}

export async function fetchSavedFromServer(token: string): Promise<string[]> {
  try {
    const res = await fetch("/api/saved-resources", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.ids;
  } catch {
    return [];
  }
}
