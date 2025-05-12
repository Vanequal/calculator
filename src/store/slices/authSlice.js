import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthModalOpen: false,
  mode: 'login', 
  isAwaitingConfirmation: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    toggleAuthModal(state, action) {
      state.isAuthModalOpen = action.payload ?? !state.isAuthModalOpen;
    },
    setAuthMode(state, action) {
      state.mode = action.payload;
    },
    logout(state) {
      state.user = null;
    },
    setAwaitingConfirmation(state, action) {
        state.isAwaitingConfirmation = action.payload;
      },
  },
});

export const { setUser, toggleAuthModal, setAuthMode, logout, setAwaitingConfirmation } = authSlice.actions;
export default authSlice.reducer;
