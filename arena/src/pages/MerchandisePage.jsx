import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShoppingCart, Plus, Minus, ExternalLink, Loader } from 'lucide-react';
//import { walletService } from '../services/walletService.js';

function MerchandisePage() {
  const [merchItems, setMerchItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [cart, setCart] = useState({});
  const [filter, setFilter] = useState('all'); // all, hoodies, tees, accessories

  useEffect(() => {
    loadMerchItems();
  }, []);

  const loadMerchItems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/merch`);
      const data = await response.json();
      setMerchItems(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load merchandise:', error);
      setLoading(false);
    }
  };

  const addToCart = (itemId) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const handlePurchase = async (item) => {
    if (!walletService.isConnected()) {
      alert('Please connect your HashPack wallet first!');
      return;
    }

    const quantity = cart[item.id] || 1;
    const shippingInfo = prompt('Enter shipping info (will be encrypted):');

    if (!shippingInfo) return;

    setPurchasing(item.id);

    try {
      // Purchase through Hedera smart contract
      const result = await walletService.purchaseMerch(
        item.contractItemId,
        quantity,
        shippingInfo
      );

      alert(`Purchase successful!\n\n` +
        `Item: ${item.name} x${quantity}\n` +
        `Total: ${item.price * quantity} ℏ\n` +
        `Rapper receives: ${(item.price * quantity * 0.95).toFixed(2)} ℏ (95%)\n` +
        `Platform fee: ${(item.price * quantity * 0.05).toFixed(2)} ℏ (5%)\n\n` +
        `Transaction: ${result.transactionId}\n\n` +
        `View on HashScan: ${result.mirrorUrl}`
      );

      // Clear cart for this item
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      });

      // Reload items to update stock
      await loadMerchItems();
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setPurchasing(null);
    }
  };

  const filteredItems = merchItems.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalCartValue = merchItems.reduce((sum, item) => {
    return sum + (item.price * (cart[item.id] || 0));
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Rapper Merchandise
        </h1>
        <p className="text-lg text-gray-300 mb-4">
          Support your favorite rappers by buying their merch with HBAR
        </p>
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Revenue Split:</span>
                <span className="font-semibold text-green-400">95% to Rapper</span>
                <span className="text-gray-400">|</span>
                <span className="font-semibold text-purple-400">5% Platform Fee</span>
              </div>
            </div>
            {totalCartItems > 0 && (
              <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg">
                <ShoppingCart className="w-4 h-4" />
                <span className="font-semibold">{totalCartItems} items</span>
                <span className="text-gray-400">|</span>
                <span className="font-semibold">{totalCartValue.toFixed(2)} ℏ</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'hoodies', 'tees', 'caps', 'accessories'].map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-6 py-2 rounded-lg font-medium transition-all capitalize whitespace-nowrap ${
              filter === category
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Merch Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-purple-900/30 rounded-2xl border border-purple-500/30">
          <ShoppingBag className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <p className="text-xl text-purple-300">No items in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30 overflow-hidden hover:scale-105 transition-transform"
            >
              {/* Item Image */}
              <div className="aspect-square bg-purple-950/50 flex items-center justify-center text-6xl">
                {item.image || '👕'}
              </div>

              {/* Item Details */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-purple-400">by {item.rapperName}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-purple-400">
                    {item.price} ℏ
                  </div>
                  <div className="text-sm text-gray-400">
                    {item.stock} in stock
                  </div>
                </div>

                {/* Quantity Controls */}
                {cart[item.id] > 0 && (
                  <div className="flex items-center justify-between bg-purple-950/50 rounded-lg p-2">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-purple-500/30 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold">{cart[item.id]}</span>
                    <button
                      onClick={() => addToCart(item.id)}
                      className="p-1 hover:bg-purple-500/30 rounded"
                      disabled={cart[item.id] >= item.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!cart[item.id] ? (
                    <button
                      onClick={() => addToCart(item.id)}
                      disabled={item.stock === 0}
                      className="w-full py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg font-semibold transition-all border border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={purchasing === item.id}
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {purchasing === item.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          Buy Now ({(item.price * cart[item.id]).toFixed(2)} ℏ)
                        </>
                      )}
                    </button>
                  )}

                  {/* View Rapper Profile */}
                  <button
                    onClick={() => window.location.href = `/rappers#${item.rapperAccountId}`}
                    className="w-full py-2 bg-purple-900/30 hover:bg-purple-900/50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    View Rapper
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Revenue Breakdown */}
                {cart[item.id] > 0 && (
                  <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-purple-500/30">
                    <div className="flex justify-between">
                      <span>Rapper receives:</span>
                      <span className="text-green-400 font-semibold">
                        {(item.price * cart[item.id] * 0.95).toFixed(2)} ℏ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee:</span>
                      <span className="text-purple-400 font-semibold">
                        {(item.price * cart[item.id] * 0.05).toFixed(2)} ℏ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-12 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-4xl mb-2">🛍️</div>
            <h4 className="font-semibold mb-2">Browse & Add to Cart</h4>
            <p className="text-gray-400">
              Browse merchandise from your favorite rappers and add items to your cart
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">💳</div>
            <h4 className="font-semibold mb-2">Pay with HBAR</h4>
            <p className="text-gray-400">
              Connect your HashPack wallet and pay instantly with HBAR - no credit card needed
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">📦</div>
            <h4 className="font-semibold mb-2">Get Your Merch</h4>
            <p className="text-gray-400">
              95% goes directly to the rapper. Your order is processed and shipped to you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MerchandisePage;
