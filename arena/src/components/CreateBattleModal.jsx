import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';

function CreateBattleModal({ isOpen, onClose }) {
  const { createBattle, isLoading, isConnected } = useStore();

  const [formData, setFormData] = useState({
    rapper1Name: '',
    rapper2Name: '',
    rapper1Address: '',
    rapper2Address: '',
    durationMinutes: 10080, // 7 days default
    videoUrl: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.rapper1Name || !formData.rapper2Name) {
      alert('Please enter both rapper names');
      return;
    }

    if (!formData.rapper1Address || !formData.rapper2Address) {
      alert('Please enter both rapper wallet addresses');
      return;
    }

    if (formData.rapper1Address === formData.rapper2Address) {
      alert('Rapper addresses must be different');
      return;
    }

    try {
      await createBattle(formData);
      alert('Battle created successfully on the blockchain!');
      onClose();
      // Reset form
      setFormData({
        rapper1Name: '',
        rapper2Name: '',
        rapper1Address: '',
        rapper2Address: '',
        durationMinutes: 10080,
        videoUrl: '',
        description: '',
      });
    } catch (error) {
      alert('Failed to create battle: ' + error.message);
    }
  };

  if (!isOpen) return null;

  const durationOptions = [
    { value: 1440, label: '1 Day' },
    { value: 4320, label: '3 Days' },
    { value: 10080, label: '1 Week' },
    { value: 20160, label: '2 Weeks' },
    { value: 43200, label: '1 Month' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Create New Battle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rapper 1 Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-purple-400">Rapper 1</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rapper1Name"
                value={formData.rapper1Name}
                onChange={handleChange}
                placeholder="e.g., MC Flow"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rapper1Address"
                value={formData.rapper1Address}
                onChange={handleChange}
                placeholder="0x..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Hedera EVM address for receiving prize funds
              </p>
            </div>
          </div>

          {/* Rapper 2 Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-400">Rapper 2</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rapper2Name"
                value={formData.rapper2Name}
                onChange={handleChange}
                placeholder="e.g., Lyric King"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rapper2Address"
                value={formData.rapper2Address}
                onChange={handleChange}
                placeholder="0x..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Hedera EVM address for receiving prize funds
              </p>
            </div>
          </div>

          {/* Battle Details */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-xl font-semibold">Battle Details</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the battle theme, rules, or context..."
                rows="3"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Battle Video URL
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Link to YouTube, Vimeo, or other video platform
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Voting Duration <span className="text-red-500">*</span>
              </label>
              <select
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                How long fans and judges can vote on this battle
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">📝 Note</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Battle will be created on Hedera blockchain</li>
              <li>• Both rappers will receive 35% of voting fees each</li>
              <li>• Platform takes 30% for operations</li>
              <li>• Votes are weighted: 70% judges, 30% fans</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isConnected}
              className="flex-1 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
            >
              {isLoading ? 'Creating Battle...' : 'Create Battle'}
            </button>
          </div>

          {!isConnected && (
            <p className="text-center text-sm text-red-400">
              Please connect your wallet to create a battle
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default CreateBattleModal;
