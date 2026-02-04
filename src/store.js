import { create } from 'zustand';

export const useGameStore = create((set) => ({
  user: null,
  activeRoomId: null,
  players: {},
  roomData: {},
  
  setUser: (user) => set({ user }),
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setPlayers: (players) => set({ players }),
  setRoomData: (data) => set({ roomData: data }),
  
  // Helper to update a single player efficiently
  updatePlayer: (uid, data) => set((state) => ({
    players: { 
        ...state.players, 
        [uid]: { ...state.players[uid], ...data } 
    }
  })),
  
  resetStore: () => set({ user: null, activeRoomId: null, players: {}, roomData: {} })
}));
