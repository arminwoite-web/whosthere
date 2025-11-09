```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { url, method } = req;
    const path = new URL(url).pathname;

    // POST /api/messages
    if (path === '/api/messages' && method === 'POST') {
      const { chat_room_id, sender_id, content } = await req.json();

      const { data, error } = await supabaseClient
        .from('messages')
        .insert([{ chat_room_id, sender_id, content }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // GET /api/messages/:chat_room_id
    if (path.startsWith('/api/messages/') && method === 'GET') {
      const chat_room_id = path.split('/').pop();
      if (!chat_room_id) {
        return new Response(JSON.stringify({ error: 'Chat room ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseClient
        .from('messages')
        .select(`
          *,
          read_receipts(user_id)
        `)
        .eq('chat_room_id', chat_room_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to include read_by array
      const messagesWithReadBy = data.map(message => ({
        ...message,
        read_by: message.read_receipts.map((receipt: { user_id: string }) => receipt.user_id),
        // Remove the original read_receipts array to clean up the response
        read_receipts: undefined,
      }));

      return new Response(JSON.stringify(messagesWithReadBy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/messages/:message_id/read
    if (path.match(/\/api\/messages\/[^/]+\/read/) && method === 'POST') {
      const message_id = path.split('/')[3];
      if (!message_id) {
        return new Response(JSON.stringify({ error: 'Message ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the authenticated user's ID
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const user_id = user.id;

      // Check if the read receipt already exists to prevent duplicates
      const { data: existingReceipt, error: existingReceiptError } = await supabaseClient
        .from('read_receipts')
        .select('*')