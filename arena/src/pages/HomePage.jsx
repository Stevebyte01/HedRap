import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Swords, Trophy, Vote, Ticket } from 'lucide-react';

function HomePage() {
  const { battles, fetchBattles } = useStore();

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  const liveBattles = battles.filter(b => b.status === 'live');
  const featuredBattle = liveBattles[0];

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
          Welcome to HedRap
        </h1>
        <p className="text-2xl text-gray-300 mb-8">
          Fair. Transparent. Decentralized.
          The Future of Battle Rap.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/battles"
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-bold text-lg transition"
          >
            Watch Battles
          </Link>
          <Link
            to="/rappers"
            className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold text-lg transition"
          >
            Become a Rapper
          </Link>
        </div>
      </div>
      <div className="overflow-hidden mb-12"></div>
      {/* Auto-scrolling Battle Images */}
      <div className="relative overflow-hidden mb-12 h-64 md:h-80 lg:h-96">
        <div className="absolute flex animate-scroll">
          <img
            src="https://versetracker.com/sites/default/files/styles/home_slide/public/battle-feature/houston-bar-code/houston-bar-code-marv-won-vs-q45.jpg?itok=CHTNcdsc"
            alt="Marv Won vs Q45"
            className="h-64 md:h-80 lg:h-96 w-auto object-cover flex-shrink-0"
          />
          <img
            src="https://versetracker.com/sites/default/files/styles/home_slide/public/battle-feature/ibattletv/ibattletv-drugz-vs-los-premee.jpg?itok=SPf44Brq"
            alt="Marv Won vs Q45"
            className="h-64 md:h-80 lg:h-96 w-auto object-cover flex-shrink-0"
          />
          <img
             src="https://versetracker.com/sites/default/files/styles/home_slide/public/battle-feature/houston-bar-code/houston-bar-code-marv-won-vs-q45.jpg?itok=CHTNcdsc"
            alt="Marv Won vs Q45"
            className="h-64 md:h-80 lg:h-96 w-auto object-cover flex-shrink-0"
          />
          {/* Duplicate images for seamless loop */}
          <img
            src="https://versetracker.com/sites/default/files/styles/home_slide/public/battle-feature/houston-bar-code/houston-bar-code-marv-won-vs-q45.jpg?itok=CHTNcdsc"
            alt="Marv Won vs Q45"
            className="h-64 md:h-80 lg:h-96 w-auto object-cover flex-shrink-0"
          />
          <img
            src="https://versetracker.com/sites/default/files/styles/home_slide/public/battle-feature/houston-bar-code/houston-bar-code-marv-won-vs-q45.jpg?itok=CHTNcdsc"
            alt="Marv Won vs Q45"
            className="h-64 md:h-80 lg:h-96 w-auto object-cover flex-shrink-0"
          />
          <img
            src="https://versetracker.com/sites/default/files/styles/home_slide/public/battle-feature/black-ice-cartel/black-ice-cartel-banks-vs-tre-kennedy.jpg?itok=YkCjDBD_"
            alt="Banks vs Tre Kennedy"
            className="h-64 md:h-80 lg:h-96 w-auto object-cover flex-shrink-0"
          />
        </div>
      </div>
      {/* Features */}
      <div className="grid md:grid-cols-4 gap-6 mb-16">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <Swords className="w-12 h-12 mx-auto mb-4 text-purple-400" />
          <h3 className="text-xl font-bold mb-2">Live Battles</h3>
          <p className="text-gray-400">Watch epic rap battles in real-time</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <Vote className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-bold mb-2">Vote</h3>
          <p className="text-gray-400">Support your fav rapper with votes and elect Judges with our Decentralised system</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-bold mb-2">Compete</h3>
          <p className="text-gray-400">Challenge rappers, prove your skills and earn!</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <Ticket className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h3 className="text-xl font-bold mb-2">NFT Tickets</h3>
          <p className="text-gray-400">Exclusive access to premium events</p>
        </div>
      </div>

      {/* Featured Battle */}
      {featuredBattle && (
        <div className="bg-gradient-to-r from-purple-900 to-red-900 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">🔥 Featured Battle</h2>
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-6xl">
                👤
              </div>
              <p className="text-2xl font-bold">{featuredBattle.rappers[0]}</p>
            </div>

            <div className="text-5xl font-bold">VS</div>

            <div className="text-center">
              <div className="w-32 h-32 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-6xl">
                👤
              </div>
              <p className="text-2xl font-bold">{featuredBattle.rappers[1]}</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              to={`/battle/${featuredBattle.id}`}
              className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-lg font-bold text-lg inline-block transition"
            >
              Watch Now
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl font-bold text-purple-400 mb-2">{battles.length}</div>
          <div className="text-gray-400">Total Battles</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl font-bold text-red-400 mb-2">{liveBattles.length}</div>
          <div className="text-gray-400">Live Now</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-2">$10K</div>
          <div className="text-gray-400">Prize Pool</div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
