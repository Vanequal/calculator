import React from 'react';
import LoopCardList from './components/LoopCardList';
import Header from './components/Header';
const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-4">
        <LoopCardList />
      </main>
    </div>
  );
};

export default App;
