import React, { useState } from 'react';
import { Users, Lock, Copy, Check, Crown, Heart, Star, Trophy, ChevronRight, ArrowLeft } from 'lucide-react';

export default function BarkadaVoteSystem() {
  const [currentView, setCurrentView] = useState('home');
  const [sessionCode, setSessionCode] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [votes, setVotes] = useState({});
  const [participants, setParticipants] = useState([]);

  const foodOptions = [
    {
      id: 1,
      name: "McDonald's Burger Combo",
      price: 150.00,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
      restaurant: "McDonald's",
      votes: 0
    },
    {
      id: 2,
      name: "Murakami Ramen Bowl",
      price: 250.00,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
      restaurant: "Murakami",
      votes: 0
    },
    {
      id: 3,
      name: "Landers Pepperoni Pizza",
      price: 350.00,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
      restaurant: "Landers",
      votes: 0
    },
    {
      id: 4,
      name: "Chicken Inasal Meal",
      price: 95.00,
      image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop",
      restaurant: "Mang Inasal",
      votes: 0
    },
    {
      id: 5,
      name: "Milk Tea Combo",
      price: 150.00,
      image: "https://images.unsplash.com/photo-1525385444278-fb1c9a81db3e?w=400&h=300&fit=crop",
      restaurant: "Gong Cha",
      votes: 0
    },
    {
      id: 6,
      name: "Sushi Platter",
      price: 450.00,
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
      restaurant: "Sushi Nori",
      votes: 0
    }
  ];

  const generateSessionCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const handleCreateSession = () => {
    if (username && sessionPassword) {
      const code = generateSessionCode();
      setSessionCode(code);
      setIsHost(true);
      setParticipants([{ name: username, isHost: true, voted: false }]);
      setCurrentView('lobby');
    }
  };

  const handleJoinSession = () => {
    if (username && sessionCode && sessionPassword) {
      setIsHost(false);
      setParticipants([
        { name: 'Host', isHost: true, voted: false },
        { name: username, isHost: false, voted: false }
      ]);
      setCurrentView('lobby');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Code: ${sessionCode}\nPassword: ${sessionPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = (foodId) => {
    setVotes(prev => ({ ...prev, [foodId]: !prev[foodId] }));
  };

  const submitVotes = () => {
    const updatedParticipants = participants.map(p => 
      p.name === username ? { ...p, voted: true } : p
    );
    setParticipants(updatedParticipants);
  };

  const startVoting = () => {
    setCurrentView('voting');
  };

  const endVoting = () => {
    setCurrentView('results');
  };

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-4 sm:px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Pick<span className="text-yellow-400">A</span>Plate - Barkada Vote
            </h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center mb-12">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Group Decision Helper
            </h2>
            <p className="text-gray-600 text-lg mb-2">
              Can't decide where to eat with your barkada?
            </p>
            <p className="text-gray-500">
              Let everyone vote and find the perfect meal together!
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Create Session</h3>
              <p className="text-gray-600 text-center mb-6 text-sm">
                Start a new voting session as the host and invite your friends
              </p>
              <button
                onClick={() => setCurrentView('create')}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-full transition"
              >
                Create New Session
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Join Session</h3>
              <p className="text-gray-600 text-center mb-6 text-sm">
                Enter a session code to join your barkada's voting
              </p>
              <button
                onClick={() => setCurrentView('join')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full transition"
              >
                Join Existing Session
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 text-lg">How it works:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p className="text-gray-600 text-sm">Host creates a session with a unique code and password</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p className="text-gray-600 text-sm">Friends join using the code (no login required!)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <p className="text-gray-600 text-sm">Everyone votes on their favorite food options</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">4</span>
                </div>
                <p className="text-gray-600 text-sm">Results are tallied and the winner is revealed!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-4 sm:px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setCurrentView('home')} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create Session</h1>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Voting Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Session Password</label>
                <input
                  type="password"
                  value={sessionPassword}
                  onChange={(e) => setSessionPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <p className="text-xs text-gray-500 mt-1">Share this with your barkada</p>
              </div>

              <button
                onClick={handleCreateSession}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl transition mt-6"
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'join') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-4 sm:px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setCurrentView('home')} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Join Session</h1>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join Voting Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Session Code</label>
                <input
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder="Enter 5-digit code"
                  maxLength={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-2xl font-bold tracking-widest"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={sessionPassword}
                  onChange={(e) => setSessionPassword(e.target.value)}
                  placeholder="Enter session password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                onClick={handleJoinSession}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition mt-6"
              >
                Join Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'lobby') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-4 sm:px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Voting Lobby</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm opacity-90 mb-1">Session Code</p>
                <p className="text-4xl font-bold tracking-widest">{sessionCode}</p>
              </div>
              <button
                onClick={copyToClipboard}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl flex items-center gap-2 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="font-semibold">Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              Participants ({participants.length})
            </h3>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-400 rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-white font-bold">{participant.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{participant.name}</p>
                      {participant.isHost && (
                        <span className="text-xs text-yellow-500 flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Host
                        </span>
                      )}
                    </div>
                  </div>
                  {participant.voted && (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Voted
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={startVoting}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl transition text-lg"
            >
              Start Voting
            </button>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <p className="text-gray-600">Waiting for host to start voting...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'voting') {
    const selectedCount = Object.values(votes).filter(Boolean).length;
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Cast Your Vote</h1>
              <span className="bg-yellow-400 text-white font-bold px-4 py-2 rounded-full text-sm">
                {selectedCount} Selected
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-gray-700 text-sm text-center">
              <strong>Vote for your favorites!</strong> You can select multiple options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {foodOptions.map((food) => (
              <div
                key={food.id}
                onClick={() => handleVote(food.id)}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition cursor-pointer ${
                  votes[food.id] ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                <div className="relative">
                  <img src={food.image} alt={food.name} className="w-full h-48 object-cover" />
                  {votes[food.id] && (
                    <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                      <div className="bg-yellow-400 rounded-full p-3">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{food.restaurant}</p>
                  <h4 className="font-bold text-gray-800 mb-2 text-sm">{food.name}</h4>
                  <p className="text-yellow-500 font-bold text-lg">₱{food.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex gap-4">
            <button
              onClick={submitVotes}
              disabled={selectedCount === 0}
              className={`flex-1 font-bold py-4 rounded-xl transition text-lg ${
                selectedCount > 0
                  ? 'bg-yellow-400 hover:bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Votes ({selectedCount})
            </button>
            {isHost && (
              <button
                onClick={endVoting}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-xl transition"
              >
                End Voting
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'results') {
    const votedOptions = foodOptions.map(food => ({
      ...food,
      votes: Math.floor(Math.random() * participants.length) + 1
    })).sort((a, b) => b.votes - a.votes);

    const winner = votedOptions[0];

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-4 sm:px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Voting Results</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 mb-8 text-white text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Winner!</h2>
            <p className="text-xl mb-4">{winner.name}</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block">
              <p className="text-4xl font-bold">{winner.votes} votes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
            <img src={winner.image} alt={winner.name} className="w-full h-64 object-cover" />
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-1">{winner.restaurant}</p>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{winner.name}</h3>
              <p className="text-yellow-500 font-bold text-3xl">₱{winner.price.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Full Results</h3>
            <div className="space-y-3">
              {votedOptions.map((food, index) => (
                <div key={food.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0 text-center w-8">
                    {index === 0 ? (
                      <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400 font-bold">{index + 1}</span>
                    )}
                  </div>
                  <img src={food.image} alt={food.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{food.name}</p>
                    <p className="text-sm text-gray-500">{food.restaurant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-500 text-xl">{food.votes}</p>
                    <p className="text-xs text-gray-500">votes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentView('home');
                setVotes({});
                setParticipants([]);
              }}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl transition"
            >
              New Session
            </button>
            <button
              onClick={() => setCurrentView('voting')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition"
            >
              Vote Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}