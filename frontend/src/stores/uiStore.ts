import { create } from "zustand";

export type SidebarTab = "files" | "search" | "git" | "agents" | "settings";

interface UIState {
  // Sidebar
  sidebarTab: SidebarTab;
  isSidebarOpen: boolean;

  // Right panel (AI Chat)
  isRightPanelOpen: boolean;

  // Bottom panel (Terminal)
  isBottomPanelOpen: boolean;

  // Connection
  isConnected: boolean;

  // Command palette
  isCommandPaletteOpen: boolean;

  // Actions
  setSidebarTab: (tab: SidebarTab) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setIsConnected: (connected: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarTab: "files",
  isSidebarOpen: true,
  isRightPanelOpen: true,
  isBottomPanelOpen: true,
  isConnected: false,
  isCommandPaletteOpen: false,

  setSidebarTab: (tab) =>
    set((state) => ({
      sidebarTab: tab,
      isSidebarOpen: state.sidebarTab === tab ? !state.isSidebarOpen : true,
    })),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleRightPanel: () =>
    set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),

  toggleBottomPanel: () =>
    set((state) => ({ isBottomPanelOpen: !state.isBottomPanelOpen })),

  setIsConnected: (connected) => set({ isConnected: connected }),

  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
}));
