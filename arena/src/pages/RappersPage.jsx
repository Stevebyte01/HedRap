import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Trophy, Music, Star, Plus } from 'lucide-react';

function RappersPage() {
  const { rappers, fetchRappers, isLoading, isConnected, connectWallet } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchRappers();
  }, [fetchRappers]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl">Loading rappers...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Rappers</h1>
          <p className="text-gray-400">Discover and support talented battle rappers</p>
        </div>
        <button
          onClick={() => {
            if (!isConnected) {
              connectWallet();
            } else {
              setShowCreateForm(!showCreateForm);
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {isConnected ? 'Register as Rapper' : 'Connect Wallet'}
        </button>
      </div>

      {/* Create Rapper Form */}
      {showCreateForm && <CreateRapperForm onClose={() => setShowCreateForm(false)} />}

      {/* Rappers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rappers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No rappers registered yet. Be the first!</p>
          </div>
        ) : (
          rappers.map((rapper) => (
            <RapperCard key={rapper.id} rapper={rapper} />
          ))
        )}
      </div>
    </div>
  );
}

function RapperCard({ rapper }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition">
      <div className="p-6">
        {/* Avatar */}
        <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-6xl">
          {rapper.avatar || '👤'}
        </div>

        {/* Name */}
        <h3 className="text-2xl font-bold text-center mb-2">{rapper.name}</h3>

        {/* Stage Name */}
        {rapper.stageName && (
          <p className="text-purple-400 text-center mb-3">"{rapper.stageName}"</p>
        )}

        {/* Bio */}
        <p className="text-gray-400 text-center mb-4 line-clamp-3">
          {rapper.bio || 'No bio available'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-bold">{rapper.wins || 0}</span>
            </div>
            <span className="text-xs text-gray-400">Wins</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Music className="w-4 h-4 text-blue-500" />
              <span className="font-bold">{rapper.battles || 0}</span>
            </div>
            <span className="text-xs text-gray-400">Battles</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-purple-500" />
              <span className="font-bold">{rapper.rating || '0.0'}</span>
            </div>
            <span className="text-xs text-gray-400">Rating</span>
          </div>
        </div>

        {/* Social Links */}
        {rapper.socialLinks && (
          <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-700">
            {rapper.socialLinks.twitter && (
              <a
                href={rapper.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400"
              >
                𝕏
              </a>
            )}
            {rapper.socialLinks.instagram && (
              <a
                href={rapper.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400"
              >
                📷
              </a>
            )}
            {rapper.socialLinks.youtube && (
              <a
                href={rapper.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-400"
              >
                ▶
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateRapperForm({ onClose }) {
  const { createRapper, address, isLoading } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    stageName: '',
    bio: '',
    avatar: '👤',
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRapper({
        ...formData,
        walletAddress: address,
        wins: 0,
        battles: 0,
        rating: 0
      });
      alert('Rapper profile created successfully!');
      onClose();
    } catch (error) {
      alert('Failed to create rapper profile: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const avatarOptions = ['👤', '🎤', '👨‍🎤', '👩‍🎤', '🦸', '🦹', '👑', '⚡', '🔥', '💀'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Register as Rapper</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Choose Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar: emoji }))}
                    className={`text-4xl p-4 rounded-lg border-2 transition ${
                      formData.avatar === emoji
                        ? 'border-purple-500 bg-purple-900'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Real Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="John Doe"
              />
            </div>

            {/* Stage Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Stage Name *</label>
              <input
                type="text"
                name="stageName"
                value={formData.stageName}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="MC Flows"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold mb-2">Bio *</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                required
                rows="4"
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                placeholder="Tell us about your rap journey..."
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-semibold mb-2">Social Links (Optional)</label>
              <div className="space-y-3">
                <input
                  type="url"
                  name="social_twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Twitter/X URL"
                />
                <input
                  type="url"
                  name="social_instagram"
                  value={formData.socialLinks.instagram}
                  onChange={handleChange}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Instagram URL"
                />
                <input
                  type="url"
                  name="social_youtube"
                  value={formData.socialLinks.youtube}
                  onChange={handleChange}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="YouTube URL"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg font-bold transition"
              >
                {isLoading ? 'Creating...' : 'Create Profile'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-bold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RappersPage;
