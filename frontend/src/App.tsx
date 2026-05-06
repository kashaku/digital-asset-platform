import React from 'react';
import HeadBar from './components/head-bar';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeadBar />
      <main className="mx-auto max-w-6xl p-6">
        {/* 空白页面，保留 head-bar 以便预览 */}
      </main>
    </div>
  );
}

export default App;
