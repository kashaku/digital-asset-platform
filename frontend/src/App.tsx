import { BrowserRouter } from 'react-router-dom';

import { useWalletUserSession } from './hooks/useWalletUserSession';
import AppRoutes from './routes';

function WalletSessionBridge() {
  useWalletUserSession();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <WalletSessionBridge />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
