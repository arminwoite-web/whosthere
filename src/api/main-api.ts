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
      },
    );

    const { url, method } = req;
    const path = new URL(url).pathname;

    switch (path) {
      case '/api/sendMessage': {
        if (method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { senderId, chatId, content } = await req.json();

        if (!senderId || !chatId || !content) {
          return new Response(JSON.stringify({ error: 'Missing required fields: senderId, chatId, content' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // 1. Nachricht in 'messages' Tabelle speichern
        const { data: message, error: messageError } = await supabaseClient
          .from('messages')
          .insert({ chat_id: chatId, sender_id: senderId, content: content })
          .select('id, timestamp')
          .single();

        if (messageError) throw messageError;

        // 2. Chat-Teilnehmer abrufen
        const { data: chatParticipants, error: participantsError } = await supabaseClient
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chatId);

        if (participantsError) throw participantsError;

        // 3. Lesestatus für jeden Teilnehmer in 'message_read_status' erstellen
        const readStatusEntries = chatParticipants.map((participant) => ({
          message_id: message.id,
          user_id: participant.user_id,
          is_read: participant.user_id === senderId, // Absender hat die Nachricht sofort gelesen
        }));

        const { error: readStatusError } = await supabaseClient
          .from('message_read_status')
          .insert(readStatusEntries);

        if (readStatusError) throw readStatusError;

        return new Response(JSON.stringify({ messageId: message.id, timestamp: message.timestamp }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case '/api/markMessagesAsRead': {
        if (method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { userId, messageIds } = await req.json();

        if (!userId || !Array.isArray(messageIds) || messageIds.length === 0) {
          return new Response(JSON.stringify({ error: 'Missing required fields: userId, messageIds (array)' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { count, error } = await supabaseClient
          .from('message_read_status')
          .update({ is_read: true })
          .eq('user_id', userId)
          .in('message_id', messageIds)
          .select('*', { count