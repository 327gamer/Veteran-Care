
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
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  setLocation: (stateCode: string, state: string, city: string, zip: string) => void;
  completeOnboarding: () => void;
  setInterests: (interests: string[]) => void;
  setServiceProfile: (profile: Partial<ServiceProfile>) => void;
  markWelcomeSeen: () => void;
  markTutorialSeen: () => void;
  resetTutorialSeen: () => void;
  addChatMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void;
  clearChatHistory: () => void;
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
    }),
    {
      name: 'veteran-care-saved-resources',
    }
  )
);
