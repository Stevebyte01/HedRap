import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Trophy, Users, Clock, Award, TrendingUp } from 'lucide-react';

function BattleDetailPage() {
  const { id } = useParams();
  const {
    fetchBattle,
    voteBattle,
    checkHasVoted,
    isConnected,
    connectWallet,
    isLoading,
    isJudge,
    votingFee
  } = useStore();

  const [battle, setBattle] = useState(null);
  const [selectedRapper, setSelectedRapper] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    loadBattle();
  }, [id]);

  useEffect(() => {
    if (battle && isConnected) {
      checkVoteStatus();
    }
  }, [battle, isConnected]);

  useEffect(() => {
    if (battle?.endTime) {
      const timer = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [battle]);

  const loadBattle = async () => {
    try {
      const data = await fetchBattle(id);
      setBattle(data);
    } catch (error) {
      console.error('Failed to load battle:', error);
    }
  };

  const checkVoteStatus = async () => {
    try {
      const voted = await checkHasVoted(id);
      setHasVoted(voted);
    } catch (error) {
      console.error('Failed to check vote status:', error);
    }
  };

  const updateTimeRemaining = () => {
    if (!battle?.endTime) return;

    const now = Date.now();
    const end = new Date(battle.endTime).getTime();
    const diff = end - now;

    if (diff <= 0) {
      setTimeRemaining('Voting ended');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }
  };

  const handleVote = async (rapperChoice) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (hasVoted) {
      alert('You have already voted on this battle!');
      return;
    }

    try {
      await voteBattle(id, rapperChoice);
      await loadBattle();
      setHasVoted(true);
      alert('Vote recorded successfully on the blockchain!');
    } catch (error) {
      alert('Failed to vote: ' + error.message);
    }
  };

  if (isLoading || !battle) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl">Loading battle...</div>
      </div>
    );
  }

  // Calculate vote data from on-chain data
  const totalFanVotes = (battle.rapper1FanVotes || 0) + (battle.rapper2FanVotes || 0);
  const totalJudgeVotes = (battle.rapper1JudgeVotes || 0) + (battle.rapper2JudgeVotes || 0);
  const totalVotes = totalFanVotes + totalJudgeVotes;

  // Get weighted scores (from smart contract)
  const rapper1Score = battle.rapper1Score || 0;
  const rapper2Score = battle.rapper2Score || 0;
  const rapper1Percentage = battle.rapper1Percentage || 0;
  const rapper2Percentage = battle.rapper2Percentage || 0;

  const isActive = battle.status === 'active' || battle.status === 0;
  const isEnded = battle.status === 'ended' || battle.status === 1;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Battle Header */}
      <div className="bg-gradient-to-r from-purple-900 to-red-900 rounded-lg p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">
              {battle.rapper1Name} vs {battle.rapper2Name}
            </h1>
            {battle.description && (
              <p className="text-xl text-gray-200 mb-4">{battle.description}</p>
            )}
          </div>
          {isEnded && battle.winner && (
            <div className="bg-yellow-500 bg-opacity-20 border-2 border-yellow-500 px-4 py-2 rounded-lg flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="font-bold text-yellow-400">Winner Declared</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className={isActive ? 'text-green-400' : 'text-gray-400'}>
              {isActive ? `Ends in: ${timeRemaining}` : 'Battle Ended'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{totalVotes} total votes</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span>{totalJudgeVotes} judge votes</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>{totalFanVotes} fan votes</span>
          </div>
        </div>

        {battle.videoUrl && (
          <div className="mt-6">
            <a
              href={battle.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 px-4 py-2 rounded-lg transition"
            >
              🎥 Watch Battle Video
            </a>
          </div>
        )}
      </div>

      {/* Voting Section */}
      {isConnected && isJudge && (
        <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">
              You're voting as a Certified Judge (70% weight)
            </span>
          </div>
        </div>
      )}

      {hasVoted && (
        <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4 mb-6 text-center">
          <span className="text-green-400 font-semibold">
            ✓ You have already voted on this battle
          </span>
        </div>
      )}

      {/* Rappers */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Rapper 1 */}
        <div
          className={`bg-gray-800 rounded-lg p-6 cursor-pointer transition ${
            selectedRapper === 1 ? 'ring-4 ring-purple-500' : 'hover:ring-2 hover:ring-purple-500'
          } ${hasVoted || !isActive ? 'opacity-75 cursor-not-allowed' : ''}`}
          onClick={() => !hasVoted && isActive && setSelectedRapper(1)}
        >
          <div className="text-center mb-4">
            <div className="w-32 h-32 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-6xl">
              🎤
            </div>
            <h3 className="text-2xl font-bold">{battle.rapper1Name}</h3>
            {isEnded && battle.winner === battle.rapper1Address && (
              <div className="mt-2 flex items-center justify-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Winner!</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Weighted Score */}
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Final Score</span>
                <span className="font-bold text-xl text-purple-400">{rapper1Percentage}%</span>
              </div>
              <div className="bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${rapper1Percentage}%` }}
                />
              </div>
            </div>

            {/* Vote Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-900 rounded p-2">
                <div className="text-gray-400 text-xs">Judge Votes</div>
                <div className="font-bold text-yellow-400">{battle.rapper1JudgeVotes || 0}</div>
              </div>
              <div className="bg-gray-900 rounded p-2">
                <div className="text-gray-400 text-xs">Fan Votes</div>
                <div className="font-bold text-purple-400">{battle.rapper1FanVotes || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rapper 2 */}
        <div
          className={`bg-gray-800 rounded-lg p-6 cursor-pointer transition ${
            selectedRapper === 2 ? 'ring-4 ring-red-500' : 'hover:ring-2 hover:ring-red-500'
          } ${hasVoted || !isActive ? 'opacity-75 cursor-not-allowed' : ''}`}
          onClick={() => !hasVoted && isActive && setSelectedRapper(2)}
        >
          <div className="text-center mb-4">
            <div className="w-32 h-32 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-6xl">
              🎤
            </div>
            <h3 className="text-2xl font-bold">{battle.rapper2Name}</h3>
            {isEnded && battle.winner === battle.rapper2Address && (
              <div className="mt-2 flex items-center justify-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Winner!</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Weighted Score */}
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Final Score</span>
                <span className="font-bold text-xl text-red-400">{rapper2Percentage}%</span>
              </div>
              <div className="bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all"
                  style={{ width: `${rapper2Percentage}%` }}
                />
              </div>
            </div>

            {/* Vote Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-900 rounded p-2">
                <div className="text-gray-400 text-xs">Judge Votes</div>
                <div className="font-bold text-yellow-400">{battle.rapper2JudgeVotes || 0}</div>
              </div>
              <div className="bg-gray-900 rounded p-2">
                <div className="text-gray-400 text-xs">Fan Votes</div>
                <div className="font-bold text-red-400">{battle.rapper2FanVotes || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vote Button */}
      <div className="text-center space-y-4">
        {isActive && (
          <>
            <div className="text-sm text-gray-400">
              Voting Fee: <span className="text-white font-semibold">{votingFee} HBAR</span>
            </div>
            <button
              onClick={() => selectedRapper && handleVote(selectedRapper)}
              disabled={!selectedRapper || isLoading || hasVoted || !isActive}
              className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-bold text-lg transition"
            >
              {!isConnected ? 'Connect Wallet to Vote' :
               hasVoted ? 'Already Voted' :
               !selectedRapper ? 'Select a Rapper' :
               isLoading ? 'Submitting Vote...' :
               `Cast Your Vote (${votingFee} HBAR)`}
            </button>
          </>
        )}
      </div>

      {/* Voting Weight Explanation */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">How Voting Works</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-400">Judge Votes (70% weight)</div>
              <div className="text-gray-400">Certified judges have higher voting power</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-purple-400">Fan Votes (30% weight)</div>
              <div className="text-gray-400">Community members contribute to the outcome</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BattleDetailPage;
