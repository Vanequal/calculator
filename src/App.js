import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setAwaitingConfirmation } from './store/slices/authSlice';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectPage from './pages/ProjectPage';
import LoopCardList from './components/LoopCardList';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import AwaitingConfirmationModal from './components/AwaitingConfirmationModal';
import AddProjectCard from './components/AddProjectCard';

import { supabase } from './supabase';
import LoopCardListTwo from './components/LoopCardListTwo';
import LoopCardListThree from './components/LoopCardListThree';

const App = () => {
  const dispatch = useDispatch();
  const isAwaiting = useSelector(state => state.auth.isAwaitingConfirmation);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      dispatch(setUser(session?.user || null));
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setUser(session?.user || null));
    });

    return () => subscription.unsubscribe();
  }, []);


  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        <AuthModal />
        <AwaitingConfirmationModal />

        <main className="p-4 flex justify-center">
          <div className="w-full max-w-[1200px]">
            <Routes>
              <Route path="/" element={<LoopCardList />} />
              <Route path="/projects" element={<AddProjectCard />} />
              <Route path="/watersupplies" element={<LoopCardListTwo />} />
              <Route path="/radiator" element={<LoopCardListThree />} />
            </Routes>
          </div>
        </main>

      </div>
    </Router>
  );
};

export default App;
