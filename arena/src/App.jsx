import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useStore } from './store';

// Pages
import HomePage from './pages/HomePage';
import BattlesPage from './pages/BattlesPage';
import BattleDetailPage from './pages/BattleDetailPage';
import GovernancePage from './pages/GovernancePage';
import MerchandisePage from './pages/MerchandisePage';
import RappersPage from './pages/RappersPage';
import TicketsPage from './pages/TicketsPage';

// Components
import Navbar from './components/Navbar';
import { LoadingSpinner, ErrorBanner } from './components/UIComponents';

function App() {
  const { restoreWalletSession, isLoading, error, clearError } = useStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        await restoreWalletSession();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initApp();
  }, [restoreWalletSession]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        <Navbar />

        {error && <ErrorBanner message={error} onClose={clearError} />}

        {isLoading && <LoadingSpinner />}

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/battles" element={<BattlesPage />} />
            <Route path="/battle/:id" element={<BattleDetailPage />} />
            <Route path="/governance" element={<GovernancePage />} />
            <Route path="/merchandise" element={<MerchandisePage />} />
            <Route path="/rappers" element={<RappersPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

function Footer() {
  return (
    <footer className="bg-black bg-opacity-50 mt-20 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">HedRap</h3>
            <p className="text-gray-400">
              Decentralized Battle Rap Platform powered by Hedera
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/battles" className="hover:text-white">Battles</Link></li>
              <li><Link to="/rappers" className="hover:text-white">Rappers</Link></li>
              <li><Link to="/governance" className="hover:text-white">Governance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Discord</a></li>
              <li><a href="#" className="hover:text-white">Twitter</a></li>
              <li><a href="#" className="hover:text-white">Telegram</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Documentation</a></li>
              <li><a href="#" className="hover:text-white">GitHub</a></li>
              <li><a href="#" className="hover:text-white">Whitepaper</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; 2025 HedRap. Built on Hedera Network.</p>
        </div>
      </div>
    </footer>
  );
}

export default App;
