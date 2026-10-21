import { create } from 'zustand'

interface UiState {
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  toggleCommand: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),
}))
