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

// GET /api/trials?participantId=xxx - Get trials for a participant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('trials')
      .select('*')
      .eq('participant_id', participantId)
      .order('trial_number', { ascending: true });

    if (error) {
      throw error;
    }

    // Transform to match frontend types
    const trials = data.map((t: any) => ({
      trialNumber: t.trial_number,
      imageId: t.image_id,
      defectType: t.defect_type,
      participantResponse: t.participant_response,
      responseType: t.response_type,
      responseTime: t.response_time,
      timestamp: t.timestamp,
      timeBlock: t.time_block,
      aiPrediction: t.ai_prediction,
    }));

    return NextResponse.json(trials);
  } catch (error) {
    console.error('Error fetching trials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trials' },
      { status: 500 }
    );
  }
}

// POST /api/trials - Insert trials for a participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, trials } = body;

    if (!participantId || !trials || !Array.isArray(trials)) {
      return NextResponse.json(
        { error: 'participantId and trials array are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    
    if (!supabase) {
      // Return success even without database (for local testing)
      return NextResponse.json({ success: true, local: true, count: trials.length });
    }

    // Transform trials to database format
    const trialRecords = trials.map((trial: any) => ({
      participant_id: participantId,
      trial_number: trial.trialNumber,
      image_id: trial.imageId,
      defect_type: trial.defectType,
      participant_response: trial.participantResponse,
      response_type: trial.responseType,
      response_time: trial.responseTime,
      timestamp: trial.timestamp,
      time_block: trial.timeBlock,
      ai_prediction: trial.aiPrediction,
    }));

    const { data, error } = await supabase
      .from('trials')
      .insert(trialRecords)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, count: data.length }, { status: 201 });
  } catch (error) {
    console.error('Error inserting trials:', error);
    return NextResponse.json(
      { error: 'Failed to insert trials' },
      { status: 500 }
    );
  }
}
