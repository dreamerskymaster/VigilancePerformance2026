'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateDPrime, calculateCriterion } from '@/lib/utils';
import type { Condition, Trial } from '@/types';

type TrialRecord = any;

interface ParticipantSummary {
  id: string;
  participantId: string;
  condition: Condition;
  completedAt: string;
  totalTrials: number;
  overallAccuracy: number;
  dPrime: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [participantTrials, setParticipantTrials] = useState<TrialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check (in production, use proper auth)
    if (password === 'ie6500admin') {
      setIsAuthenticated(true);
      loadParticipants();
    } else {
      setError('Invalid password');
    }
  };

  const loadParticipants = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        setError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to view data.');
        return;
      }
      const { data, error } = await supabase.from('participants').select('*');
      if (error) throw error;

      const summaries: ParticipantSummary[] = (data || []).map((p: any) => {
        const trials = p.trials || [];
        const totalHits = trials.filter((t: any) => t.responseType === 'HIT').length;
        const totalMisses = trials.filter((t: any) => t.responseType === 'MISS').length;
        const totalFAs = trials.filter((t: any) => t.responseType === 'FA').length;
        const totalCRs = trials.filter((t: any) => t.responseType === 'CR').length;

        const totalTrials = trials.length;
        const correct = totalHits + totalCRs;
        const accuracy = totalTrials > 0 ? (correct / totalTrials) * 100 : 0;

        const hitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;
        const faRate = totalFAs + totalCRs > 0 ? totalFAs / (totalFAs + totalCRs) : 0;
        const dPrime = calculateDPrime(hitRate, faRate);

        return {
          id: p.id,
          participantId: p.participant_id,
          condition: p.condition,
          completedAt: p.completed_at || p.created_at,
          totalTrials,
          overallAccuracy: accuracy,
          dPrime,
        };
      });

      setParticipants(summaries);
    } catch (err) {
      console.error('Error loading participants:', err);
      setError('Failed to load participant data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipantTrials = async (participantId: string) => {
    setIsLoading(true);

    try {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.from('participants').select('trials').eq('participant_id', participantId).single();
      if (error) throw error;

      const trials = data?.trials || [];
      const formattedTrials = trials.map((t: any) => ({
        trial_number: t.trialNumber,
        time_block: t.timeBlock,
        defect_type: t.defectType,
        response: t.participantResponse ? 'DEFECT' : 'NO_DEFECT',
        response_type: t.responseType,
        response_time: t.responseTime
      }));

      setParticipantTrials(formattedTrials);
      setSelectedParticipant(participantId);
    } catch (err) {
      console.error('Error loading trials:', err);
      setError('Failed to load trial data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (participants.length === 0) return;

    const headers = ['Participant ID', 'Condition', 'Completed At', 'Total Trials', 'Accuracy (%)', 'd\''];
    const rows = participants.map((p) => [
      p.participantId,
      p.condition,
      p.completedAt,
      p.totalTrials,
      p.overallAccuracy.toFixed(2),
      p.dPrime.toFixed(3),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigilance-study-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const aiAssistedCount = participants.filter((p) => p.condition === 'AI_ASSISTED').length;
  const unassistedCount = participants.filter((p) => p.condition === 'UNASSISTED').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="card max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Access
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <label className="form-label block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input w-full pr-10"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button type="submit" className="btn btn-primary w-full">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Study Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Vigilance Decrement Research Study
            </p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="btn btn-secondary"
          >
            Logout
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500">Total Participants</p>
            <p className="text-3xl font-bold text-gray-900">{participants.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">AI-Assisted</p>
            <p className="text-3xl font-bold text-blue-600">{aiAssistedCount}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Unassisted</p>
            <p className="text-3xl font-bold text-gray-600">{unassistedCount}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Target N</p>
            <p className="text-3xl font-bold text-gray-900">50</p>
            <p className="text-xs text-gray-400">(25 per condition)</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadParticipants}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
          <button
            onClick={exportToCSV}
            disabled={participants.length === 0}
            className="btn btn-secondary"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Participants Table */}
        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Participants</h2>

          {participants.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No participants yet. Data will appear here as participants complete the study.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Condition</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Completed</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Trials</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Accuracy</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">d'</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{p.participantId.slice(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <span className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${p.condition === 'AI_ASSISTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {p.condition === 'AI_ASSISTED' ? 'AI' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(p.completedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">{p.totalTrials}</td>
                      <td className="py-3 px-4 text-right">{p.overallAccuracy.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right">{p.dPrime.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => loadParticipantTrials(p.participantId)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Trials
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trial Details Modal */}
        {selectedParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Trial Data: {selectedParticipant.slice(0, 8)}...
                </h3>
                <button
                  onClick={() => {
                    setSelectedParticipant(null);
                    setParticipantTrials([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {participantTrials.length === 0 ? (
                  <p className="text-gray-500 text-center">No trial data available</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3">Trial</th>
                        <th className="text-left py-2 px-3">Block</th>
                        <th className="text-left py-2 px-3">Defect</th>
                        <th className="text-left py-2 px-3">Response</th>
                        <th className="text-left py-2 px-3">Result</th>
                        <th className="text-right py-2 px-3">RT (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantTrials.map((trial, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 px-3">{trial.trial_number}</td>
                          <td className="py-2 px-3">{trial.time_block}</td>
                          <td className="py-2 px-3">{trial.defect_type}</td>
                          <td className="py-2 px-3">{trial.response === 'DEFECT' ? 'Defect' : 'No Defect'}</td>
                          <td className="py-2 px-3">
                            <span className={`
                              px-2 py-0.5 rounded text-xs font-medium
                              ${trial.response_type === 'HIT' ? 'bg-green-100 text-green-800' :
                                trial.response_type === 'CR' ? 'bg-blue-100 text-blue-800' :
                                  trial.response_type === 'MISS' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                              }
                            `}>
                              {trial.response_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{trial.response_time.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
