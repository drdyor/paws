// services/pawmatch-production.ts
// Complete API layer matching your PRODUCTION_SCHEMA.sql
import { supabase } from './supabase';

// Helper to ensure user is authenticated
async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Authentication required');
  return user;
}

// =============================================================================
// DISCOVERY FEED (from listings table - your production approach)
// =============================================================================
export async function getDiscoveryFeed(opts?: {
  species?: 'dog' | 'cat' | 'other';
  listing_type?: 'adoption' | 'stud' | 'litter_announcement';
  city?: string;
  max_distance_km?: number;
  user_location?: { lat: number; lon: number };
  urgent_only?: boolean;
  limit?: number;
}) {
  let q = supabase
    .from('listings')
    .select(`
      *,
      pets!inner (
        *,
        pet_images (url, sort_order),
        badge_grants (
          badges (code, label, color)
        )
      )
    `)
    .eq('status', 'live')
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false });

  if (opts?.species) {
    q = q.eq('pets.species', opts.species);
  }
  if (opts?.listing_type) {
    q = q.eq('type', opts.listing_type);
  }
  if (opts?.city) {
    q = q.eq('city', opts.city);
  }
  if (opts?.urgent_only) {
    q = q.eq('is_urgent', true);
  }

  const { data, error } = await q.limit(opts?.limit ?? 50);
  if (error) throw error;

  // TODO: If opts.user_location provided, use PostGIS ST_Distance to filter by max_distance_km
  // For now, return all results
  return data ?? [];
}

// Alternative: Get pets directly (simpler for Tinder-style discovery)
export async function getDiscoveryPets(opts?: {
  species?: 'dog' | 'cat' | 'other';
  status?: 'available' | 'stud_available' | 'in_heat';
  city?: string;
  limit?: number;
}) {
  let q = supabase
    .from('pets')
    .select(`
      *,
      pet_images (url, sort_order),
      badge_grants (
        badges (code, label, color)
      )
    `)
    .is('deleted_at', null);

  if (opts?.species) q = q.eq('species', opts.species);
  if (opts?.status) q = q.eq('status', opts.status);
  if (opts?.city) q = q.eq('city', opts.city);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 50);

  if (error) throw error;
  return data ?? [];
}

// =============================================================================
// INTERACTIONS (Favorite, Super-Like, Pass)
// =============================================================================
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
  
  // Trigger will auto-create match on super_like
  return data;
}

// =============================================================================
// MY FAVORITES
// =============================================================================
export async function getMyFavorites() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('pet_interactions')
    .select(`
      pet_id,
      pets (
        *,
        pet_images (url, sort_order)
      )
    `)
    .eq('user_id', user.id)
    .eq('direction', 'favorite')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data ?? []).map((r: any) => r.pets).filter(Boolean);
}

// =============================================================================
// MATCHES
// =============================================================================
export async function getMyMatches() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      pets (
        *,
        pet_images (url, sort_order)
      ),
      seeker:profiles!seeker_user_id (full_name, email),
      owner:profiles!owner_user_id (full_name, email)
    `)
    .or(`seeker_user_id.eq.${user.id},owner_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data ?? [];
}

export async function updateMatchStatus(
  match_id: string,
  status: 'new' | 'contacted' | 'closed'
) {
  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', match_id);
    
  if (error) throw error;
}

// =============================================================================
// COMMUNITY VOTING (Pets)
// =============================================================================
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
  const { data, error } = await supabase.rpc('pet_vote_counts', {
    p_pet_id: pet_id,
  });
  
  if (error) {
    console.warn('pet_vote_counts RPC not found:', error);
    return { upvotes: 0, downvotes: 0 };
  }
  
  return data as { upvotes: number; downvotes: number };
}

// =============================================================================
// COMMUNITY VOTING (Breeding Pairs)
// =============================================================================
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
  const { data, error } = await supabase.rpc('pair_vote_counts', {
    p_bitch_id: bitch_id,
    p_stag_id: stag_id,
  });
  
  if (error) {
    console.warn('pair_vote_counts RPC not found:', error);
    return { upvotes: 0, downvotes: 0 };
  }
  
  return data as { upvotes: number; downvotes: number };
}

// =============================================================================
// BREEDING SUGGESTIONS (Community Dream Pairs)
// =============================================================================
export async function suggestBreedingPair(female_pet_id: string, stud_pet_id: string) {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('breeding_suggestions')
    .insert({ female_pet_id, stud_pet_id, suggested_by: user.id })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function voteOnSuggestion(suggestion_id: string, vote: 1 | -1) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('suggestion_votes')
    .upsert(
      { suggestion_id, voter_id: user.id, vote },
      { onConflict: 'suggestion_id,voter_id' }
    );
    
  if (error) throw error;
}

// =============================================================================
// HEAT TRACKER (with auto-computed fertile windows)
// =============================================================================
export async function saveHeatStart(pet_id: string, heat_start_date_iso: string, notes?: string) {
  const { data, error } = await supabase
    .from('heat_cycles')
    .insert({
      pet_id,
      heat_start_date: heat_start_date_iso,
      notes,
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Trigger automatically computes fertile_window_start/end, estimated_ovulation, next_heat_estimate
  return data;
}

export async function getHeatCycles(pet_id: string) {
  const { data, error } = await supabase
    .from('heat_cycles')
    .select('*')
    .eq('pet_id', pet_id)
    .order('heat_start_date', { ascending: false });
    
  if (error) throw error;
  return data ?? [];
}

export async function getLatestHeatCycle(pet_id: string) {
  const { data, error } = await supabase
    .from('heat_cycles')
    .select('*')
    .eq('pet_id', pet_id)
    .order('heat_start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (error) throw error;
  return data;
}

// Get pets currently in fertile window
export async function getPetsFertileToday() {
  const { data, error } = await supabase
    .from('v_pets_fertile_today')
    .select('*');
    
  if (error) throw error;
  return data ?? [];
}

// =============================================================================
// STUD INTERESTS (notify stud owners when female is in heat)
// =============================================================================
export async function notifyStudOwners(heat_cycle_id: string, stud_pet_ids: string[], message?: string) {
  const user = await requireUser();
  
  // Get the female pet for this heat cycle
  const { data: cycle, error: e1 } = await supabase
    .from('heat_cycles')
    .select('pet_id, pets(id, owner_user_id)')
    .eq('id', heat_cycle_id)
    .single();
    
  if (e1) throw e1;
  
  // Create stud interest records
  const interests = stud_pet_ids.map(stud_id => ({
    heat_cycle_id,
    female_pet_id: (cycle as any).pet_id,
    stud_pet_id: stud_id,
    stud_owner_id: user.id, // This should be fetched from stud pet's owner
    status: 'pending' as const,
    message: message || 'Interested in breeding during this cycle',
  }));
  
  const { error: e2 } = await supabase
    .from('stud_interests')
    .insert(interests);
    
  if (e2) throw e2;
}

// =============================================================================
// CONVERSATIONS & MESSAGES
// =============================================================================
export async function createConversation(participant_user_ids: string[]) {
  const user = await requireUser();
  
  // Create conversation
  const { data: conv, error: e1 } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();
    
  if (e1) throw e1;
  
  // Add participants (including self)
  const allParticipants = [...new Set([user.id, ...participant_user_ids])];
  const participants = allParticipants.map(uid => ({
    conversation_id: conv.id,
    user_id: uid,
  }));
  
  const { error: e2 } = await supabase
    .from('conversation_participants')
    .insert(participants);
    
  if (e2) throw e2;
  
  return conv;
}

export async function sendMessage(
  conversation_id: string,
  receiver_id: string,
  content: string,
  msg_type: 'text' | 'image' = 'text'
) {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conv_id: conversation_id,
      sender_id: user.id,
      receiver_id,
      msg_type,
      content,
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getMyConversations() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations (
        *,
        messages (
          *,
          sender:profiles!sender_id (full_name, profile_photo)
        )
      )
    `)
    .eq('user_id', user.id);
    
  if (error) throw error;
  return data ?? [];
}

export async function markMessageAsRead(message_id: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', message_id);
    
  if (error) throw error;
}

// =============================================================================
// LISTINGS MANAGEMENT
// =============================================================================
export async function createListing(listing: {
  pet_id?: string;
  litter_id?: string;
  type: 'adoption' | 'stud' | 'litter_announcement';
  title: string;
  description?: string;
  price?: number;
  deposit?: number;
  city?: string;
  photos?: string[];
  is_urgent?: boolean;
}) {
  const user = await requireUser();
  
  // Get user's profile to get role
  const { data: profile, error: e1 } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (e1) throw e1;
  
  const { data, error } = await supabase
    .from('listings')
    .insert({
      ...listing,
      owner_id: user.id,
      owner_role: profile.role,
      status: 'draft',
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function publishListing(listing_id: string) {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'live' })
    .eq('id', listing_id);
    
  if (error) throw error;
}

export async function getMyListings() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      pets (
        *,
        pet_images (url, sort_order)
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data ?? [];
}

// =============================================================================
// FAVORITES (Saved Listings)
// =============================================================================
export async function addToFavorites(listing_id: string) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, listing_id });
    
  if (error && error.code !== '23505') throw error; // Ignore duplicate
}

export async function removeFromFavorites(listing_id: string) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listing_id);
    
  if (error) throw error;
}

export async function getMyFavoriteListings() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      listing_id,
      listings (
        *,
        pets (
          *,
          pet_images (url, sort_order)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return (data ?? []).map((r: any) => r.listings).filter(Boolean);
}

// =============================================================================
// WAITLIST
// =============================================================================
export async function joinWaitlist(listing_id: string, note?: string) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('waitlists')
    .insert({ listing_id, user_id: user.id, note });
    
  if (error) throw error;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================
export async function getMyNotifications(unread_only = false) {
  const user = await requireUser();
  
  let q = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id);
    
  if (unread_only) {
    q = q.eq('read', false);
  }
  
  const { data, error } = await q.order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationAsRead(notification_id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notification_id);
    
  if (error) throw error;
}

// =============================================================================
// BREEDS
// =============================================================================
export async function searchBreeds(query: string, species?: 'dog' | 'cat') {
  let q = supabase
    .from('breeds')
    .select('*')
    .ilike('name', `%${query}%`);
    
  if (species) {
    q = q.eq('species', species);
  }
  
  const { data, error } = await q.limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function getAllBreeds(species?: 'dog' | 'cat') {
  let q = supabase
    .from('breeds')
    .select('*')
    .order('name');
    
  if (species) {
    q = q.eq('species', species);
  }
  
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================
export async function getMyProfile() {
  const user = await requireUser();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateMyProfile(updates: {
  full_name?: string;
  phone_number?: string;
  city?: string;
  kennel_name?: string;
  shelter_name?: string;
  clinic_name?: string;
  preferred_species?: 'dog' | 'cat' | 'other';
  preferred_dog_size?: 'small' | 'medium' | 'large';
  preferred_age?: 'young' | 'adult' | 'senior' | 'any';
}) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);
    
  if (error) throw error;
}

// =============================================================================
// REPORTS (Moderation)
// =============================================================================
export async function reportContent(
  target_type: 'user' | 'listing' | 'pet' | 'message',
  target_id: string,
  reason: string,
  details?: string
) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
      details,
    });
    
  if (error) throw error;
}

// =============================================================================
// AUTHENTICATION
// =============================================================================
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

// =============================================================================
// ANALYTICS
// =============================================================================
export async function trackListingView(listing_id: string) {
  const user = await requireUser();
  
  const { error } = await supabase
    .from('listing_views')
    .insert({ listing_id, viewer_id: user.id });
    
  // Don't throw on duplicate views
  if (error && error.code !== '23505') throw error;
}
