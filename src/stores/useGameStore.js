import { create } from 'zustand';

export const useGameStore = create((set) => ({
  // Global State
  user: null,
  activeRoomId: '',
  players: {},
  roomData: {},

  // Actions
  setUser: (user) => set({ user }),
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  setPlayers: (players) => set({ players }),
  setRoomData: (roomData) => set({ roomData }),
}));
