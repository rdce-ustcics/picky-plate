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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        {/* Decorative background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-yellow-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
        </div>

      

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
          <div className="text-center mb-12">
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
              <Users className="w-12 h-12 sm:w-14 sm:h-14 text-white relative z-10" />
              <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-white/10 rounded-full"></div>
              <div className="absolute -top-1 -left-1 w-8 h-8 bg-white/10 rounded-full"></div>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4">
              Barkada  <span className="text-yellow-500">Vote</span>
            </h2>
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-600 text-lg mb-2 font-medium">
                Can't decide where to eat with your barkada?
              </p>
              <p className="text-gray-500">
                Let everyone vote and find the perfect meal together!
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-yellow-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Crown className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Create Session</h3>
                <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
                  Start a new voting session as the host and invite your friends
                </p>
                <button
                  onClick={() => setCurrentView('create')}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  Create New Session
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Join Session</h3>
                <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
                  Enter a session code to join your barkada's voting
                </p>
                <button
                  onClick={() => setCurrentView('join')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  Join Existing Session
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full"></div>
              <h4 className="font-bold text-gray-800 text-lg">How it works</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-transparent hover:from-yellow-100 transition-colors">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">Host creates a session with a unique code and password</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 transition-colors">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">Friends join using the code (no login required!)</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-transparent hover:from-green-100 transition-colors">
                <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-2xl w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">Everyone votes on their favorite food options</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-transparent hover:from-purple-100 transition-colors">
                <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">Results are tallied and the winner is revealed!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <header className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-5 shadow-sm border-b border-gray-100 relative z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setCurrentView('home')} className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-xl transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create Session</h1>
            </div>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 py-8 sm:py-12 relative z-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20"></div>
              <Crown className="w-10 h-10 text-white relative z-10" />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white/10 rounded-full"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Create Voting Session</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Set up a new session for your group</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Your Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Session Password</label>
                <input
                  type="password"
                  value={sessionPassword}
                  onChange={(e) => setSessionPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                />
                <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Share this with your barkada
                </p>
              </div>

              <button
                onClick={handleCreateSession}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl mt-6"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <header className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-5 shadow-sm border-b border-gray-100 relative z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setCurrentView('home')} className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-xl transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Join Session</h1>
            </div>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 py-8 sm:py-12 relative z-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20"></div>
              <Users className="w-10 h-10 text-white relative z-10" />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white/10 rounded-full"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Join Voting Session</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Enter the session details to join</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Your Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Session Code</label>
                <input
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder="00000"
                  maxLength={5}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-center text-3xl font-bold tracking-widest transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Password</label>
                <input
                  type="password"
                  value={sessionPassword}
                  onChange={(e) => setSessionPassword(e.target.value)}
                  placeholder="Enter session password"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>

              <button
                onClick={handleJoinSession}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl mt-6"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <header className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-5 shadow-sm border-b border-gray-100 relative z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Voting Lobby</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl p-6 mb-6 text-white shadow-2xl shadow-yellow-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="text-center sm:text-left">
                <p className="text-sm opacity-90 mb-1 font-medium">Session Code</p>
                <p className="text-5xl font-bold tracking-widest drop-shadow-lg">{sessionCode}</p>
              </div>
              <button
                onClick={copyToClipboard}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl border border-white/20"
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

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-500" />
                Participants ({participants.length})
              </h3>
            </div>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl w-12 h-12 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">{participant.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{participant.name}</p>
                      {participant.isHost && (
                        <span className="text-xs text-yellow-600 flex items-center gap-1 font-medium">
                          <Crown className="w-3 h-3" /> Host
                        </span>
                      )}
                    </div>
                  </div>
                  {participant.voted && (
                    <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-300">
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
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-5 rounded-2xl transition-all text-lg shadow-xl hover:shadow-2xl"
            >
              Start Voting
            </button>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-700 font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Waiting for host to start voting...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'voting') {
    const selectedCount = Object.values(votes).filter(Boolean).length;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 pb-24">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-40 left-20 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <header className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-5 shadow-sm sticky top-0 z-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Cast Your Vote</h1>
              </div>
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-lg">
                {selectedCount} Selected
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4 mb-6 shadow-sm">
            <p className="text-gray-700 text-sm text-center font-medium">
              <Heart className="w-4 h-4 inline-block text-yellow-500 mr-1" />
              <strong>Vote for your favorites!</strong> You can select multiple options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {foodOptions.map((food) => (
              <div
                key={food.id}
                onClick={() => handleVote(food.id)}
                className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer border-2 ${
                  votes[food.id] ? 'ring-4 ring-yellow-400 border-yellow-400 scale-[1.02]' : 'border-gray-100 hover:border-yellow-200'
                }`}
              >
                <div className="relative">
                  <img src={food.image} alt={food.name} className="w-full h-48 object-cover" />
                  {votes[food.id] && (
                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/40 to-transparent flex items-center justify-center">
                      <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full p-4 shadow-2xl animate-pulse">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      votes[food.id] 
                        ? 'bg-yellow-400 border-white scale-110' 
                        : 'bg-white/80 backdrop-blur-sm border-gray-300'
                    }`}>
                      {votes[food.id] && <Check className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium">{food.restaurant}</p>
                  <h4 className="font-bold text-gray-800 mb-2 text-sm leading-tight">{food.name}</h4>
                  <p className="text-yellow-600 font-bold text-lg">₱{food.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t-2 border-gray-200 p-4 shadow-2xl z-20">
          <div className="max-w-6xl mx-auto flex gap-4">
            <button
              onClick={submitVotes}
              disabled={selectedCount === 0}
              className={`flex-1 font-bold py-5 rounded-2xl transition-all text-lg shadow-xl ${
                selectedCount > 0
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white hover:shadow-2xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Votes ({selectedCount})
            </button>
            {isHost && (
              <button
                onClick={endVoting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-8 py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <header className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-5 shadow-sm border-b border-gray-100 relative z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Voting Results</h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl p-8 mb-8 text-white text-center shadow-2xl shadow-yellow-500/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy className="w-12 h-12 animate-pulse" />
              </div>
              <h2 className="text-4xl font-bold mb-2 drop-shadow-lg">Winner!</h2>
              <p className="text-xl mb-4 font-semibold">{winner.name}</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 inline-block border border-white/30 shadow-xl">
                <p className="text-5xl font-bold drop-shadow-lg">{winner.votes} <span className="text-2xl">votes</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl mb-6 border border-gray-100">
            <div className="relative">
              <img src={winner.image} alt={winner.name} className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <p className="text-sm font-semibold opacity-90">{winner.restaurant}</p>
                </div>
                <h3 className="text-2xl font-bold drop-shadow-lg">{winner.name}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Price</p>
                  <p className="text-yellow-600 font-bold text-3xl">₱{winner.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Total Votes</p>
                  <p className="text-gray-800 font-bold text-3xl">{winner.votes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg mb-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-800">Full Results</h3>
            </div>
            <div className="space-y-3">
              {votedOptions.map((food, index) => (
                <div key={food.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  index === 0 
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200 shadow-md' 
                    : 'bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md'
                }`}>
                  <div className="flex-shrink-0 text-center w-10">
                    {index === 0 ? (
                      <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl w-10 h-10 flex items-center justify-center shadow-md">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    ) : index === 1 ? (
                      <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl w-10 h-10 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                    ) : index === 2 ? (
                      <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-2xl w-10 h-10 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 font-bold text-lg">{index + 1}</span>
                    )}
                  </div>
                  <img src={food.image} alt={food.name} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{food.name}</p>
                    <p className="text-sm text-gray-500">{food.restaurant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-600 text-2xl">{food.votes}</p>
                    <p className="text-xs text-gray-500 font-medium">votes</p>
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
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl"
            >
              New Session
            </button>
            <button
              onClick={() => setCurrentView('voting')}
              className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl"
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