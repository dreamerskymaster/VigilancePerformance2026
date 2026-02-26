/**
 * API route for submitting participant study data.
 * 
 * POST /api/submit
 * - Receives complete participant data (demographics, trials, questionnaires)
 * - Stores in Supabase if configured, otherwise returns success for local storage
 * - Returns participant ID for confirmation
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.participantId || !data.condition) {
      return NextResponse.json(
        { error: 'Missing required fields: participantId, condition' },
        { status: 400 }
      )
    }
    
    // Log submission attempt
    console.log(`[Submit] Participant ${data.participantId} (${data.condition})`)
    console.log(`[Submit] Trials: ${data.trials?.length || 0}`)
    
    // If Supabase is not configured, return success (data stays in localStorage)
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[Submit] Supabase not configured, data stored locally only')
      return NextResponse.json({
        success: true,
        participantId: data.participantId,
        storage: 'local',
        message: 'Data saved locally (Supabase not configured)'
      })
    }
    
    // Insert into Supabase
    const { error } = await supabase
      .from('participants')
      .insert({
        participant_id: data.participantId,
        condition: data.condition,
        demographics: data.demographics,
        pre_kss: data.preKSS,
        post_kss: data.postKSS,
        nasa_tlx: data.nasaTLX,
        ai_trust: data.aiTrust,
        trials: data.trials,
        consent_timestamp: data.consentTimestamp,
        completed_at: new Date().toISOString(),
      })
    
    if (error) {
      console.error('[Submit] Supabase error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }
    
    console.log(`[Submit] ✅ Saved to Supabase: ${data.participantId}`)
    
    return NextResponse.json({
      success: true,
      participantId: data.participantId,
      storage: 'supabase',
      message: 'Data saved successfully'
    })
    
  } catch (error) {
    console.error('[Submit] Error:', error)
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    )
  }
}
