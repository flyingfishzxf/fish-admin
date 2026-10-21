import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Accent, ThemeMode } from '@/config/theme'

interface ThemeState {
  mode: ThemeMode
  accent: Accent
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: Accent) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      accent: 'violet',
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
    }),
    {
      name: 'fish-admin:theme',
      version: 1,
    },
  ),
)
