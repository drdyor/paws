// services/pawmatch.ts
// Complete API layer for PawMatch - directly hits Supabase
import { supabase } from './supabase';

// Helper to ensure user is authenticated
async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Authentication required');
  return user;
}

// -----------------------------------------------------------------------------
// DISCOVERY FEED
// -----------------------------------------------------------------------------
export async function getDiscoveryFeed(opts?: {
  species?: 'dog' | 'cat';
  for_mating?: boolean;
  for_stud?: boolean;
  city?: string;
  limit?: number;
}) {
  let q = supabase
    .from('pets')
    .select('*, pet_images(url, sort_order)')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (opts?.species) q = q.eq('species', opts.species);
  if (opts?.for_mating !== undefined) q = q.eq('for_mating', opts.for_mating);
  if (opts?.for_stud !== undefined) q = q.eq('for_stud', opts.for_stud);
  if (opts?.city) q = q.eq('location_city', opts.city);

  const { data, error } = await q.limit(opts?.limit ?? 50);
  if (error) throw error;
  return data ?? [];
}

// -----------------------------------------------------------------------------
// INTERACTIONS (Favorite, Super-Like, Pass)
// -----------------------------------------------------------------------------
export async function upsertInteraction(
  pet_id: string,
  direction: 'favorite' | 'super_like' | 'pass'
) {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('pet_interactions')
    .upsert(
      { user_id: user.id, pet_id, direction },
      { onConflict: 'user_id,pet_id' }
    )
    .select()
    .single();

  if (error) throw error;
  
  // If super_like, the DB trigger should create a match
  // If no trigger exists yet, uncomment below:
  // if (direction === 'super_like') await ensureMatch(pet_id);
  
  return data;
}

// Optional: Client-side match creation if trigger doesn't exist
export async function ensureMatch(pet_id: string) {
  const me = await requireUser();
  
  // Get pet owner
  const { data: pet, error: e1 } = await supabase
    .from('pets')
    .select('owner_user_id')
    .eq('id', pet_id)
    .single();
    
  if (e1) throw e1;
  
  // Create match
  const { error: e2 } = await supabase
    .from('matches')
    .insert({
      pet_id,
      seeker_user_id: me.id,
      owner_user_id: pet.owner_user_id,
    })
    .select()
    .maybeSingle();
    
  if (e2 && e2.code !== '23505') {
    // Ignore unique violation
    throw e2;
  }
}

// -----------------------------------------------------------------------------
// MY FAVORITES
// -----------------------------------------------------------------------------
export async function getMyFavorites() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('pet_interactions')
    .select('pet_id, pets(*, pet_images(url, sort_order))')
    .eq('user_id', user.id)
    .eq('direction', 'favorite')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Map to pet objects
  return (data ?? []).map((r: any) => r.pets).filter(Boolean);
}

// -----------------------------------------------------------------------------
// PET VOTES (Community Voting)
// -----------------------------------------------------------------------------
export async function votePet(pet_id: string, vote: 'up' | 'down') {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('pet_votes')
    .upsert(
      {
        voter_id: user.id,
        pet_id,
        vote_type: vote === 'up' ? 'upvote' : 'downvote',
      },
      { onConflict: 'voter_id,pet_id' }
    );
    
  if (error) throw error;
}

export async function getPetVoteCounts(pet_id: string) {
  // Uses RPC function pet_vote_counts (create in SQL)
  const { data, error } = await supabase.rpc('pet_vote_counts', {
    p_pet_id: pet_id,
  });
  
  if (error) {
    console.warn('pet_vote_counts RPC not found, returning zeros');
    return { upvotes: 0, downvotes: 0 };
  }
  
  return data as { upvotes: number; downvotes: number };
}

// -----------------------------------------------------------------------------
// PAIR VOTES (Dream Match Voting)
// -----------------------------------------------------------------------------
export async function votePair(
  bitch_id: string,
  stag_id: string,
  vote: 'up' | 'down'
) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('mating_pair_votes')
    .upsert(
      {
        voter_id: user.id,
        bitch_pet_id: bitch_id,
        stag_pet_id: stag_id,
        vote_type: vote === 'up' ? 'upvote' : 'downvote',
      },
      { onConflict: 'voter_id,bitch_pet_id,stag_pet_id' }
    );
    
  if (error) throw error;
}

export async function getPairVoteCounts(bitch_id: string, stag_id: string) {
  // Uses RPC function pair_vote_counts (create in SQL)
  const { data, error } = await supabase.rpc('pair_vote_counts', {
    p_bitch_id: bitch_id,
    p_stag_id: stag_id,
  });
  
  if (error) {
    console.warn('pair_vote_counts RPC not found, returning zeros');
    return { upvotes: 0, downvotes: 0 };
  }
  
  return data as { upvotes: number; downvotes: number };
}

// -----------------------------------------------------------------------------
// HEAT TRACKER
// -----------------------------------------------------------------------------
export async function saveHeatStart(
  pet_id: string,
  heat_start_date_iso: string
) {
  const { data, error } = await supabase
    .from('heat_cycles')
    .upsert(
      {
        pet_id,
        heat_start_date: heat_start_date_iso,
      },
      { onConflict: 'pet_id' }
    )
    .select('*')
    .single();
    
  if (error) throw error;

  // Optional: Call server function to recompute fertile window
  await supabase
    .rpc('recompute_fertile_window', { cycle_uuid: data.id })
    .catch(() => {
      console.warn('recompute_fertile_window RPC not found, skipping');
    });
    
  return data;
}

export async function getHeatCycle(pet_id: string) {
  const { data, error } = await supabase
    .from('heat_cycles')
    .select('*')
    .eq('pet_id', pet_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (error) throw error;
  return data;
}

// -----------------------------------------------------------------------------
// AUTHENTICATION
// -----------------------------------------------------------------------------
export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
  return true;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// -----------------------------------------------------------------------------
// MATCHES (for owner/seeker)
// -----------------------------------------------------------------------------
export async function getMyMatches() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('matches')
    .select('*, pets(*, pet_images(url, sort_order))')
    .or(`seeker_user_id.eq.${user.id},owner_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data ?? [];
}

export async function updateMatchStatus(
  match_id: string,
  status: 'new' | 'accepted' | 'rejected'
) {
  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', match_id);
    
  if (error) throw error;
}
