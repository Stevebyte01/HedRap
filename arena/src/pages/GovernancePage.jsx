import React, { useEffect, useState } from 'react';
import { Shield, Plus, CheckCircle, Clock, Users } from 'lucide-react';
import { useStore } from '../store';

export default function GovernancePage() {
  const {
    judges,
    fetchJudges,
    proposeJudge,
    wallet,
    isConnected,
    isLoading,
  } = useStore();

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    judgeAddress: '',
    judgeName: '',
    credentials: '',
  });

  useEffect(() => {
    fetchJudges();
  }, []);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      alert('Please connect your wallet to propose a judge!');
      return;
    }

    try {
      await proposeJudge(proposalData);
      alert('Judge proposed successfully! 🎉');
      setShowProposalForm(false);
      setProposalData({
        judgeAddress: '',
        judgeName: '',
        credentials: '',
      });
    } catch (error) {
      alert(`Error proposing judge: ${error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Judge Governance DAO</h1>
            <p className="text-gray-400">
              Elect and manage professional battle rap judges through decentralized voting
            </p>
          </div>

          {isConnected && (
            <button
              onClick={() => setShowProposalForm(!showProposalForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center space-x-2 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Propose Judge</span>
            </button>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">How Judge Governance Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="bg-white bg-opacity-10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Propose</h3>
            <p className="text-sm text-gray-300">
              HEDRAP token holders propose qualified judges with credentials
            </p>
          </div>
          <div>
            <div className="bg-white bg-opacity-10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Vote</h3>
            <p className="text-sm text-gray-300">
              Community votes on proposals using HEDRAP tokens
            </p>
          </div>
          <div>
            <div className="bg-white bg-opacity-10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Serve</h3>
            <p className="text-sm text-gray-300">
              Elected judges serve 90-day terms judging battles
            </p>
          </div>
        </div>
      </div>

      {/* Proposal Form */}
      {showProposalForm && (
        <div className="bg-gray-800 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Propose New Judge</h2>
          <form onSubmit={handleSubmitProposal} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Judge Hedera Account ID *
              </label>
              <input
                type="text"
                required
                placeholder="0.0.123456"
                value={proposalData.judgeAddress}
                onChange={(e) =>
                  setProposalData({ ...proposalData, judgeAddress: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Judge Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., DJ Premier"
                value={proposalData.judgeName}
                onChange={(e) =>
                  setProposalData({ ...proposalData, judgeName: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Credentials *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the judge's qualifications, experience in battle rap, notable work, etc."
                value={proposalData.credentials}
                onChange={(e) =>
                  setProposalData({ ...proposalData, credentials: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
              <p className="text-sm text-yellow-200">
                <strong>Note:</strong> Proposing a judge requires 1000 HEDRAP tokens.
                The proposal will be subject to community voting.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
              >
                {isLoading ? 'Submitting...' : 'Submit Proposal'}
              </button>
              <button
                type="button"
                onClick={() => setShowProposalForm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Judges */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Active Judges</h2>

        {judges.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No active judges yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Be the first to propose a qualified judge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {judges.map((judge) => (
              <JudgeCard key={judge.judgeAddress} judge={judge} />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <h3 className="font-semibold">Active Judges</h3>
          </div>
          <p className="text-3xl font-bold">{judges.length}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-6 h-6 text-yellow-400" />
            <h3 className="font-semibold">Term Duration</h3>
          </div>
          <p className="text-3xl font-bold">90</p>
          <p className="text-sm text-gray-400">days</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-6 h-6 text-green-400" />
            <h3 className="font-semibold">Max Judges</h3>
          </div>
          <p className="text-3xl font-bold">5</p>
        </div>
      </div>
    </div>
  );
}

function JudgeCard({ judge }) {
  const termEndDate = new Date(judge.termEnd * 1000);
  const daysRemaining = Math.ceil(
    (termEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-purple-900">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center">
          <Shield className="w-8 h-8" />
        </div>
        {judge.isActive && (
          <span className="bg-green-500 text-xs font-semibold px-3 py-1 rounded-full">
            ACTIVE
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold mb-2">{judge.name}</h3>
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {judge.credentials}
      </p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Votes Cast</span>
          <span className="font-semibold">{judge.totalVotes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Days Remaining</span>
          <span className="font-semibold">{daysRemaining} days</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 truncate">
          {judge.judgeAddress}
        </p>
      </div>
    </div>
  );
}
