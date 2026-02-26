import { createClient } from '@supabase/supabase-js';

// These should be set as environment variables in your Vercel deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Fallback to localStorage if Supabase is not configured
export const useLocalStorage = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table types
export interface ParticipantRecord {
  id: string;
  condition: 'AI_ASSISTED' | 'UNASSISTED';
  created_at: string;
  completed_at?: string;
  status: string;
  demographics?: Record<string, unknown>;
  pre_task_kss?: number;
  post_task_kss?: number;
  nasa_tlx?: Record<string, number>;
  ai_trust?: Record<string, number>;
}

export interface TrialRecord {
  id: string;
  participant_id: string;
  trial_number: number;
  time_block: number;
  image_id: string;
  ground_truth: string;
  defect_type?: string;
  ai_prediction?: string;
  ai_confidence?: number;
  response: string;
  response_time: number;
  timestamp: string;
  is_correct: boolean;
  response_type: string;
}

// Database operations
export const db = {
  // Create a new participant
  async createParticipant(participant: Partial<ParticipantRecord>): Promise<ParticipantRecord | null> {
    if (useLocalStorage) {
      if (typeof window === 'undefined') return null;
      const participants = JSON.parse(localStorage.getItem('vigilance_participants_db') || '[]');
      const newParticipant = { ...participant, id: participant.id || crypto.randomUUID() };
      participants.push(newParticipant);
      localStorage.setItem('vigilance_participants_db', JSON.stringify(participants));
      return newParticipant as ParticipantRecord;
    }

    const { data, error } = await supabase
      .from('participants')
      .insert([participant])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating participant:', error);
      return null;
    }
    return data;
  },

  // Update participant
  async updateParticipant(id: string, updates: Partial<ParticipantRecord>): Promise<boolean> {
    if (useLocalStorage) {
      if (typeof window === 'undefined') return false;
      const participants = JSON.parse(localStorage.getItem('vigilance_participants_db') || '[]');
      const index = participants.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        participants[index] = { ...participants[index], ...updates };
        localStorage.setItem('vigilance_participants_db', JSON.stringify(participants));
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from('participants')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating participant:', error);
      return false;
    }
    return true;
  },

  // Get participant by ID
  async getParticipant(id: string): Promise<ParticipantRecord | null> {
    if (useLocalStorage) {
      if (typeof window === 'undefined') return null;
      const participants = JSON.parse(localStorage.getItem('vigilance_participants_db') || '[]');
      return participants.find((p: any) => p.id === id) || null;
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching participant:', error);
      return null;
    }
    return data;
  },

  // Insert multiple trials
  async insertTrials(trials: Partial<TrialRecord>[]): Promise<boolean> {
    if (useLocalStorage) {
      if (typeof window === 'undefined') return false;
      const existingTrials = JSON.parse(localStorage.getItem('vigilance_trials_db') || '[]');
      localStorage.setItem('vigilance_trials_db', JSON.stringify([...existingTrials, ...trials]));
      return true;
    }

    const { error } = await supabase
      .from('trials')
      .insert(trials);
    
    if (error) {
      console.error('Error inserting trials:', error);
      return false;
    }
    return true;
  },

  // Get trials for a participant
  async getTrials(participantId: string): Promise<TrialRecord[]> {
    if (useLocalStorage) {
      if (typeof window === 'undefined') return [];
      const trials = JSON.parse(localStorage.getItem('vigilance_trials_db') || '[]');
      return trials.filter((t: any) => t.participant_id === participantId).sort((a: any, b: any) => a.trial_number - b.trial_number);
    }

    const { data, error } = await supabase
      .from('trials')
      .select('*')
      .eq('participant_id', participantId)
      .order('trial_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching trials:', error);
      return [];
    }
    return data || [];
  },

  // Get all participants (for admin)
  async getAllParticipants(): Promise<ParticipantRecord[]> {
    if (useLocalStorage) {
      if (typeof window === 'undefined') return [];
      const participants = JSON.parse(localStorage.getItem('vigilance_participants_db') || '[]');
      return participants.sort((a: any, b: any) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0));
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
    return data || [];
  },
};

if (useLocalStorage) {
  console.warn('Supabase not configured. Using localStorage for data storage.');
}
