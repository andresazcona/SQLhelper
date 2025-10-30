import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { MainLayout } from './components';
import './styles/main.scss';

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
