import React, { PropsWithChildren } from 'react';
import { AppProvider } from '@/store';
import './app.scss';

function App({ children }: PropsWithChildren<any>) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}

export default App;
