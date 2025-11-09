```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { user } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // POST /api/messages
    if (req.method === 'POST' && path === '/api/messages') {
      const { chat_id, receiver_id, content } = await req.json();

      if (!chat_id || !receiver_id || !content) {
        return new Response(JSON.stringify({ error: 'Missing required fields: chat_id, receiver_id, content' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: message, error } = await supabaseClient
        .from('messages')
        .insert({ chat_id, sender_id: user.id, content })
        .select()
        .single();

      if (error) throw error;

      // Mark message as read for the sender
      await supabaseClient
        .from('message_reads')
        .insert({ message_id: message.id, user_id: user.id });

      return new Response(JSON.stringify({ message_id: message.id, timestamp: message.created_at }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/messages?chat_id={chat_id}&limit={limit}&offset={offset}
    if (req.method === 'GET' && path === '/api/messages') {
      const chat_id = url.searchParams.get('chat_id');
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      if (!chat_id) {
        return new Response(JSON.stringify({ error: 'Missing chat_id parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: messages, error } = await supabaseClient
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          message_reads!left(
            user_id
          )
        `)
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const formattedMessages = messages.map(msg => ({
        message_id: msg.id,
        sender_id: msg.sender_id,
        content: msg.content,
        timestamp: msg.created_at,
        is_read: msg.message_reads.some((read: { user_id: string }) => read.user_id === user.id),
      }));

      return new Response(JSON.stringify(formatted