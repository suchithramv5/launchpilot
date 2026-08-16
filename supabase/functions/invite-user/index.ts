// Creates an auth user for a new teammate and emails them a Supabase invite
// link (no plaintext temporary password ever exists or is transmitted) —
// clicking the link signs them in and lands them on /update-password to set
// their own password before they can use the app. Callable only by an
// existing launch_lead/admin, verified from their JWT below. Requires the
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY secrets, which Supabase injects
// into every deployed edge function automatically.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const { data: callerData, error: callerError } = await admin.auth.getUser(jwt);
    if (callerError || !callerData.user) {
      return json({ error: 'Not authenticated.' }, 401);
    }

    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerData.user.id)
      .single();
    if (profileError || !callerProfile || !['launch_lead', 'admin'].includes(callerProfile.role)) {
      return json({ error: 'Only a launch lead or admin can grant access.' }, 403);
    }

    const { email, role, accessTier, redirectTo } = await req.json();
    const trimmedEmail = String(email ?? '').trim().toLowerCase();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return json({ error: 'Enter a valid email address.' }, 400);
    }

    // Pre-register the role/tier so the signup trigger applies it the
    // instant the invited auth user row is created below.
    const { error: inviteRowError } = await admin
      .from('pending_invites')
      .upsert({ email: trimmedEmail, role, access_tier: accessTier, invited_by: callerData.user.id });
    if (inviteRowError) return json({ error: inviteRowError.message }, 400);

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(trimmedEmail, { redirectTo });
    if (inviteError) return json({ error: inviteError.message }, 400);

    const invitedUserId = inviteData.user?.id;
    if (invitedUserId) {
      await admin.from('profiles').update({ must_change_password: true }).eq('id', invitedUserId);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
