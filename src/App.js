import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setAwaitingConfirmation  } from './store/slices/authSlice';

import LoopCardList from './components/LoopCardList';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import AwaitingConfirmationModal from './components/AwaitingConfirmationModal';

import { supabase } from './supabase';

const App = () => {
  const dispatch = useDispatch();
  const isAwaiting = useSelector(state => state.auth.isAwaitingConfirmation);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      if (user) {
        dispatch(setUser(user));
        if (isAwaiting) {
          dispatch(setAwaitingConfirmation(false));
          window.location.reload(); 
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      if (user) {
        dispatch(setUser(user));
        if (isAwaiting) {
          dispatch(setAwaitingConfirmation(false));
          window.location.reload();
        }
      } else {
        dispatch(setUser(null));
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, [dispatch, isAwaiting]);
  

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <AuthModal />
      <AwaitingConfirmationModal />
      <main className="p-4">
        <LoopCardList />
      </main>
    </div>
  );
};

export default App;
