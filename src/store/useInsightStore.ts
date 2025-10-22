import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Insight {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source?: string; // e.g., "Podcast: Naval Ravikant — 32:10"
  createdAt: Date;
  updatedAt: Date;
}

interface InsightState {
  insights: Insight[];
  currentInsight: Insight | null;
  saveStatus: 'idle' | 'saving' | 'saved';
  addInsight: (insight: Omit<Insight, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInsight: (id: string, updates: Partial<Insight>) => void;
  deleteInsight: (id: string) => void;
  setCurrentInsight: (insight: Insight | null) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void;
}

export const useInsightStore = create<InsightState>()(
  persist(
    (set) => ({
      insights: [],
      currentInsight: null,
      saveStatus: 'idle',
      
      addInsight: (insight) => set((state) => {
        const newInsight: Insight = {
          ...insight,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return {
          insights: [newInsight, ...state.insights],
          currentInsight: newInsight,
        };
      }),
      
      updateInsight: (id, updates) => set((state) => ({
        insights: state.insights.map((insight) =>
          insight.id === id
            ? { ...insight, ...updates, updatedAt: new Date() }
            : insight
        ),
        currentInsight: state.currentInsight?.id === id
          ? { ...state.currentInsight, ...updates, updatedAt: new Date() }
          : state.currentInsight,
      })),
      
      deleteInsight: (id) => set((state) => ({
        insights: state.insights.filter((insight) => insight.id !== id),
        currentInsight: state.currentInsight?.id === id ? null : state.currentInsight,
      })),
      
      setCurrentInsight: (insight) => set({ currentInsight: insight }),
      
      setSaveStatus: (status) => set({ saveStatus: status }),
    }),
    {
      name: 'insight-storage',
    }
  )
);
