import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
};

// GET /api/participants - Get all participants
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST /api/participants - Create a new participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabase();
    
    if (!supabase) {
      // Return success even without database (for local testing)
      return NextResponse.json({ success: true, local: true });
    }

    const {
      participantId,
      condition,
      demographics,
      preKSS,
      postKSS,
      nasaTLX,
      aiTrust,
      trialResults,
      consentTimestamp,
      completionTimestamp,
    } = body;

    const { data, error } = await supabase
      .from('participants')
      .insert({
        participant_id: participantId,
        condition,
        demographics,
        pre_kss: preKSS,
        post_kss: postKSS,
        nasa_tlx: nasaTLX,
        ai_trust: aiTrust,
        trial_results: trialResults,
        consent_timestamp: consentTimestamp,
        completion_timestamp: completionTimestamp,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating participant:', error);
    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 }
    );
  }
}
