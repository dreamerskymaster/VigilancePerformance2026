'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { calculateDPrime, calculateCriterion } from '@/lib/utils';

/**
 * Admin Dashboard for Vigilance Study
 * Features:
 * - Password authentication
 * - Live participant count
 * - Condition breakdown charts
 * - Vigilance decrement visualization
 * - SDT metrics (d', c)
 * - Detailed participant table
 * - Auto-refresh capability
 */

interface ParticipantData {
  id: number;
  participant_id: string;
  condition: 'AI_ASSISTED' | 'UNASSISTED';
  demographics: any;
  pre_kss: number;
  post_kss: number;
  nasa_tlx: any;
  ai_trust: any;
  trials: any[];
  completed_at: string;
}

interface AnalyticsSummary {
  total: number;
  aiAssisted: number;
  unassisted: number;
  completionRate: number;
  avgAccuracyAI: number;
  avgAccuracyManual: number;
  avgDPrimeAI: number;
  avgDPrimeManual: number;
  vigilanceByBlock: {
    block1: { ai: number; manual: number };
    block2: { ai: number; manual: number };
    block3: { ai: number; manual: number };
  };
  avgResponseTimeAI: number;
  avgResponseTimeManual: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Calculate analytics from participant data
  const calculateAnalytics = useCallback((data: ParticipantData[]): AnalyticsSummary => {
    const aiParticipants = data.filter(p => p.condition === 'AI_ASSISTED');
    const manualParticipants = data.filter(p => p.condition === 'UNASSISTED');

    // Calculate accuracy per participant
    const getAccuracy = (trials: any[]) => {
      if (!trials || trials.length === 0) return 0;
      const correct = trials.filter(t => t.responseType === 'HIT' || t.responseType === 'CR').length;
      return correct / trials.length;
    };

    // Calculate d' per participant
    const getDPrime = (trials: any[]) => {
      if (!trials || trials.length === 0) return 0;
      const hits = trials.filter(t => t.responseType === 'HIT').length;
      const misses = trials.filter(t => t.responseType === 'MISS').length;
      const fas = trials.filter(t => t.responseType === 'FA').length;
      const crs = trials.filter(t => t.responseType === 'CR').length;

      const hitRate = (hits + misses) > 0 ? hits / (hits + misses) : 0;
      const faRate = (fas + crs) > 0 ? fas / (fas + crs) : 0;

      return calculateDPrime(hitRate, faRate);
    };

    // Get accuracy by block
    const getBlockAccuracy = (participants: ParticipantData[], block: 1 | 2 | 3) => {
      const accuracies = participants.map(p => {
        if (!p.trials) return 0;
        const blockTrials = p.trials.filter(t => t.timeBlock === block);
        return getAccuracy(blockTrials);
      }).filter(a => a > 0);

      return accuracies.length > 0
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : 0;
    };

    // Calculate average response time
    const getAvgRT = (participants: ParticipantData[]) => {
      const allRTs = participants.flatMap(p =>
        (p.trials || []).map(t => t.responseTime)
      ).filter(rt => rt > 0);

      return allRTs.length > 0
        ? allRTs.reduce((a, b) => a + b, 0) / allRTs.length
        : 0;
    };

    const aiAccuracies = aiParticipants.map(p => getAccuracy(p.trials || [])).filter(a => a > 0);
    const manualAccuracies = manualParticipants.map(p => getAccuracy(p.trials || [])).filter(a => a > 0);
    const aiDPrimes = aiParticipants.map(p => getDPrime(p.trials || [])).filter(d => !isNaN(d));
    const manualDPrimes = manualParticipants.map(p => getDPrime(p.trials || [])).filter(d => !isNaN(d));

    return {
      total: data.length,
      aiAssisted: aiParticipants.length,
      unassisted: manualParticipants.length,
      completionRate: data.length > 0 ? 100 : 0,
      avgAccuracyAI: aiAccuracies.length > 0
        ? (aiAccuracies.reduce((a, b) => a + b, 0) / aiAccuracies.length) * 100
        : 0,
      avgAccuracyManual: manualAccuracies.length > 0
        ? (manualAccuracies.reduce((a, b) => a + b, 0) / manualAccuracies.length) * 100
        : 0,
      avgDPrimeAI: aiDPrimes.length > 0
        ? aiDPrimes.reduce((a, b) => a + b, 0) / aiDPrimes.length
        : 0,
      avgDPrimeManual: manualDPrimes.length > 0
        ? manualDPrimes.reduce((a, b) => a + b, 0) / manualDPrimes.length
        : 0,
      vigilanceByBlock: {
        block1: {
          ai: getBlockAccuracy(aiParticipants, 1) * 100,
          manual: getBlockAccuracy(manualParticipants, 1) * 100
        },
        block2: {
          ai: getBlockAccuracy(aiParticipants, 2) * 100,
          manual: getBlockAccuracy(manualParticipants, 2) * 100
        },
        block3: {
          ai: getBlockAccuracy(aiParticipants, 3) * 100,
          manual: getBlockAccuracy(manualParticipants, 3) * 100
        },
      },
      avgResponseTimeAI: getAvgRT(aiParticipants),
      avgResponseTimeManual: getAvgRT(manualParticipants),
    };
  }, []);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      // Demo data for testing without Supabase
      setParticipants([]);
      setAnalytics({
        total: 0, aiAssisted: 0, unassisted: 0, completionRate: 0,
        avgAccuracyAI: 0, avgAccuracyManual: 0, avgDPrimeAI: 0, avgDPrimeManual: 0,
        vigilanceByBlock: { block1: { ai: 0, manual: 0 }, block2: { ai: 0, manual: 0 }, block3: { ai: 0, manual: 0 } },
        avgResponseTimeAI: 0, avgResponseTimeManual: 0,
      });
      setLastRefresh(new Date());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      setParticipants(data || []);
      setAnalytics(calculateAnalytics(data || []));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, [calculateAnalytics]);

  // Auto-refresh effect
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;

    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleLogin = () => {
    // Simple password check - in production, use proper auth
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ie6500admin';

    if (password === correctPassword) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setParticipants([]);
    setAnalytics(null);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-purple-200 text-sm">Vigilance Study Analytics</p>
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center animate-shake">{error}</p>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Access Dashboard
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-white/40 text-xs mt-6">
              Northeastern University • IE 6500
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Study Dashboard</h1>
            <p className="text-purple-200">Vigilance Decrement in Visual Inspection</p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* Auto-refresh toggle */}
            <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
              />
              Auto-refresh
            </label>

            {/* Manual refresh */}
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Last refresh time */}
        {lastRefresh && (
          <p className="text-white/40 text-sm mb-6">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Participants */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Total Participants</p>
              <p className="text-4xl font-bold text-white">{analytics.total}</p>
              <p className="text-white/40 text-xs mt-2">completed studies</p>
            </div>

            {/* AI-Assisted */}
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur rounded-xl p-6 border border-purple-500/20">
              <p className="text-purple-200 text-sm mb-1">🤖 AI-Assisted</p>
              <p className="text-4xl font-bold text-white">{analytics.aiAssisted}</p>
              <p className="text-purple-200/60 text-xs mt-2">
                Avg accuracy: {analytics.avgAccuracyAI.toFixed(1)}%
              </p>
            </div>

            {/* Manual */}
            <div className="bg-gradient-to-br from-gray-500/20 to-slate-500/20 backdrop-blur rounded-xl p-6 border border-gray-500/20">
              <p className="text-gray-200 text-sm mb-1">👁️ Manual</p>
              <p className="text-4xl font-bold text-white">{analytics.unassisted}</p>
              <p className="text-gray-200/60 text-xs mt-2">
                Avg accuracy: {analytics.avgAccuracyManual.toFixed(1)}%
              </p>
            </div>

            {/* Average d' */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur rounded-xl p-6 border border-green-500/20">
              <p className="text-green-200 text-sm mb-1">📊 Avg d' (Sensitivity)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">
                  AI: {analytics.avgDPrimeAI.toFixed(2)}
                </p>
                <p className="text-lg text-white/60">
                  vs {analytics.avgDPrimeManual.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vigilance Decrement Chart */}
        {analytics && analytics.total > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              📉 Vigilance Decrement Over Time
            </h2>

            <div className="flex items-end justify-around h-64 gap-8">
              {/* Block 1 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center gap-4 h-48">
                  {/* AI Bar */}
                  <div className="w-12 bg-white/10 rounded-t-lg relative flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${analytics.vigilanceByBlock.block1.ai}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-purple-300">
                      {analytics.vigilanceByBlock.block1.ai.toFixed(0)}%
                    </span>
                  </div>
                  {/* Manual Bar */}
                  <div className="w-12 bg-white/10 rounded-t-lg relative flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${analytics.vigilanceByBlock.block1.manual}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-300">
                      {analytics.vigilanceByBlock.block1.manual.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4">Block 1</p>
                <p className="text-white/40 text-xs">0-7 min</p>
              </div>

              {/* Block 2 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center gap-4 h-48">
                  <div className="w-12 bg-white/10 rounded-t-lg relative flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${analytics.vigilanceByBlock.block2.ai}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-purple-300">
                      {analytics.vigilanceByBlock.block2.ai.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-12 bg-white/10 rounded-t-lg relative flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${analytics.vigilanceByBlock.block2.manual}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-300">
                      {analytics.vigilanceByBlock.block2.manual.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4">Block 2</p>
                <p className="text-white/40 text-xs">7-14 min</p>
              </div>

              {/* Block 3 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center gap-4 h-48">
                  <div className="w-12 bg-white/10 rounded-t-lg relative flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${analytics.vigilanceByBlock.block3.ai}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-purple-300">
                      {analytics.vigilanceByBlock.block3.ai.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-12 bg-white/10 rounded-t-lg relative flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${analytics.vigilanceByBlock.block3.manual}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-300">
                      {analytics.vigilanceByBlock.block3.manual.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4">Block 3</p>
                <p className="text-white/40 text-xs">14-21 min</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-t from-purple-600 to-purple-400" />
                <span className="text-white/60 text-sm">AI-Assisted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-t from-gray-600 to-gray-400" />
                <span className="text-white/60 text-sm">Manual</span>
              </div>
            </div>
          </div>
        )}

        {/* Response Time Comparison */}
        {analytics && analytics.total > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">⏱️ Average Response Time</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-300">AI-Assisted</span>
                    <span className="text-white">{analytics.avgResponseTimeAI.toFixed(0)} ms</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (analytics.avgResponseTimeAI / 5000) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Manual</span>
                    <span className="text-white">{analytics.avgResponseTimeManual.toFixed(0)} ms</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gray-600 to-gray-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (analytics.avgResponseTimeManual / 5000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Detection Sensitivity (d')</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-300">AI-Assisted</span>
                    <span className="text-white">{analytics.avgDPrimeAI.toFixed(2)}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (analytics.avgDPrimeAI / 4) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Manual</span>
                    <span className="text-white">{analytics.avgDPrimeManual.toFixed(2)}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gray-600 to-gray-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (analytics.avgDPrimeManual / 4) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants Table */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">📋 All Participants</h2>
          </div>

          {participants.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/40 text-lg">No participants yet</p>
              <p className="text-white/20 text-sm mt-2">Data will appear here as participants complete the study</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Condition</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Trials</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">d'</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {participants.map((p) => {
                    const trials = p.trials || [];
                    const correct = trials.filter(t => t.responseType === 'HIT' || t.responseType === 'CR').length;
                    const accuracy = trials.length > 0 ? (correct / trials.length * 100).toFixed(1) : '0.0';

                    const hits = trials.filter(t => t.responseType === 'HIT').length;
                    const misses = trials.filter(t => t.responseType === 'MISS').length;
                    const fas = trials.filter(t => t.responseType === 'FA').length;
                    const crs = trials.filter(t => t.responseType === 'CR').length;
                    const hitRate = (hits + misses) > 0 ? hits / (hits + misses) : 0;
                    const faRate = (fas + crs) > 0 ? fas / (fas + crs) : 0;
                    const dPrime = calculateDPrime(hitRate, faRate);

                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-white font-mono text-sm">{p.participant_id.slice(-8)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.condition === 'AI_ASSISTED'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-gray-500/20 text-gray-300'
                            }`}>
                            {p.condition === 'AI_ASSISTED' ? '🤖 AI' : '👁️ Manual'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">
                          {trials.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${parseFloat(accuracy) >= 80 ? 'text-green-400' :
                              parseFloat(accuracy) >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {accuracy}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">
                          {dPrime.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/60 text-sm">
                          {new Date(p.completed_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedParticipant(p)}
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Participant Detail Modal */}
        {selectedParticipant && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Participant Details
                </h3>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2">Basic Info</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs">Participant ID</p>
                      <p className="text-white font-mono">{selectedParticipant.participant_id}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs">Condition</p>
                      <p className="text-white">{selectedParticipant.condition}</p>
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                {selectedParticipant.demographics && (
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-2">Demographics</h4>
                    <div className="bg-white/5 rounded-lg p-4">
                      <pre className="text-white/80 text-sm overflow-x-auto">
                        {JSON.stringify(selectedParticipant.demographics, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* KSS */}
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2">Sleepiness (KSS)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs">Pre-Task</p>
                      <p className="text-2xl font-bold text-white">{selectedParticipant.pre_kss}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/40 text-xs">Post-Task</p>
                      <p className="text-2xl font-bold text-white">{selectedParticipant.post_kss}</p>
                    </div>
                  </div>
                </div>

                {/* NASA-TLX */}
                {selectedParticipant.nasa_tlx && (
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-2">NASA-TLX</h4>
                    <div className="bg-white/5 rounded-lg p-4">
                      <pre className="text-white/80 text-sm overflow-x-auto">
                        {JSON.stringify(selectedParticipant.nasa_tlx, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* AI Trust */}
                {selectedParticipant.ai_trust && (
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-2">AI Trust</h4>
                    <div className="bg-white/5 rounded-lg p-4">
                      <pre className="text-white/80 text-sm overflow-x-auto">
                        {JSON.stringify(selectedParticipant.ai_trust, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Trial Summary */}
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2">Trial Summary</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {['HIT', 'MISS', 'FA', 'CR'].map(type => {
                      const count = (selectedParticipant.trials || []).filter(t => t.responseType === type).length;
                      return (
                        <div key={type} className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-white">{count}</p>
                          <p className="text-white/40 text-xs">{type}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-white/30 text-sm">
          Northeastern University • IE 6500: Human Performance
        </div>
      </div>
    </div>
  );
}
