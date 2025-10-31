import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Swords, Trophy, Users, Calendar } from 'lucide-react';
import CreateBattleModal from '../components/CreateBattleModal';

function BattlesPage() {
  const { battles, fetchBattles, isLoading } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl">Loading battles...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Battle Arena</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          Create Battle
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {battles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Swords className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No battles yet. Create the first one!</p>
          </div>
        ) : (
          battles.map((battle) => (
            <Link
              key={battle.id}
              to={`/battle/${battle.id}`}
              className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition"
            >
              {battle.videoUrl && (
                <div className="aspect-video">
                  <iframe
                    src={battle.videoUrl}
                    title={battle.title}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      battle.status === "live"
                        ? "bg-red-600"
                        : battle.status === "upcoming"
                        ? "bg-blue-600"
                        : "bg-gray-600"
                    }`}
                  >
                    {battle.status}
                  </span>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>

                <h3 className="text-xl font-bold mb-3">{battle.title}</h3>
                <p className="text-gray-400 mb-4 line-clamp-2">
                  {battle.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {battle.rappers[0]} vs {battle.rappers[1]}
                    </span>
                  </div>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <CreateBattleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default BattlesPage;
