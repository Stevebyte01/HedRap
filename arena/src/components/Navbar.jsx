import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Wallet, Menu, X, DollarSign, Award } from 'lucide-react';

function Navbar() {
  const {
    isConnected,
    address,
    hbarBalance,
    hedrapBalance,
    isJudge,
    connectWallet,
    disconnectWallet
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleWalletClick = async () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      try {
        await connectWallet();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(2);
  };

  return (
    <nav className="bg-black bg-opacity-50 backdrop-blur-lg border-b border-purple-500 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
            🎤 HedRap
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/battles" className="hover:text-purple-400 transition">
              Battles
            </Link>
            <Link to="/rappers" className="hover:text-purple-400 transition">
              Rappers
            </Link>
            <Link to="/governance" className="hover:text-purple-400 transition">
              Elect Judges
            </Link>
            <Link to="/tickets" className="hover:text-purple-400 transition">
              Tickets
            </Link>
            <Link to="/merchandise" className="hover:text-purple-400 transition">
              Merch
            </Link>
          </div>

          {/* Wallet Section */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected && (
              <>
                {/* Judge Badge */}
                {isJudge && (
                  <div className="flex items-center gap-1 bg-yellow-500 bg-opacity-20 border border-yellow-500 px-3 py-1 rounded-lg">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-semibold">Judge</span>
                  </div>
                )}

                {/* Balances */}
                <div className="flex items-center gap-3 bg-gray-800 bg-opacity-50 px-4 py-2 rounded-lg border border-gray-700">
                  {/* HBAR Balance */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-xs font-bold">H</span>
                    </div>
                    <span className="text-sm font-semibold">{formatBalance(hbarBalance)}</span>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-6 bg-gray-600"></div>

                  {/* HedRap Token Balance */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">HDR</span>
                    <span className="text-sm font-semibold text-purple-400">{formatBalance(hedrapBalance)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Wallet Button */}
            <button
              onClick={handleWalletClick}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
            >
              <Wallet className="w-4 h-4" />
              {isConnected ? (
                <span>{formatAddress(address)}</span>
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-4">
              {/* Mobile Balances */}
              {isConnected && (
                <div className="space-y-2 pb-4 border-b border-gray-800">
                  {isJudge && (
                    <div className="flex items-center gap-2 bg-yellow-500 bg-opacity-20 border border-yellow-500 px-3 py-2 rounded-lg">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm font-semibold">Certified Judge</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-gray-800 bg-opacity-50 px-4 py-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-xs font-bold">H</span>
                      </div>
                      <span className="text-sm">HBAR</span>
                    </div>
                    <span className="font-semibold">{formatBalance(hbarBalance)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-gray-800 bg-opacity-50 px-4 py-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-400" />
                      <span className="text-sm text-purple-400">HedRap</span>
                    </div>
                    <span className="font-semibold text-purple-400">{formatBalance(hedrapBalance)}</span>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <Link to="/battles" className="hover:text-purple-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Battles
              </Link>
              <Link to="/rappers" className="hover:text-purple-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Rappers
              </Link>
              <Link to="/governance" className="hover:text-purple-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Elect Judges
              </Link>
              <Link to="/tickets" className="hover:text-purple-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Tickets
              </Link>
              <Link to="/merchandise" className="hover:text-purple-400 transition" onClick={() => setMobileMenuOpen(false)}>
                Merch
              </Link>

              {/* Mobile Wallet Button */}
              <button
                onClick={handleWalletClick}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition justify-center"
              >
                <Wallet className="w-4 h-4" />
                {isConnected ? (
                  <span>{formatAddress(address)}</span>
                ) : (
                  <span>Connect Wallet</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
