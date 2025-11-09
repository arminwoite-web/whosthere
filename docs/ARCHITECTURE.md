# System-Architektur

## Überblick
Die Chat-Anwendung ermöglicht Echtzeit-Kommunikation zwischen Benutzern. Sie umfasst Funktionen zum Senden und Empfangen von Nachrichten, die Darstellung ungelesener Nachrichten und die Anzeige des Chatverlaufs. Die Architektur setzt auf Supabase für Backend-Services wie Datenbank, Authentifizierung und Echtzeit-Funktionalität (via PostgreSQL `LISTEN`/`NOTIFY` und Supabase Realtime).

## Komponenten
- **Frontend**: React + TypeScript + TailwindCSS
  - Verantwortlich für die Benutzeroberfläche, das Senden von Nachrichten, die Anzeige des Chatverlaufs und die Markierung ungelesener Nachrichten.
  - Nutzt Supabase Client SDK für Authentifizierung, Datenbankzugriff und Realtime-Updates.
- **Backend**: Supabase Edge Functions
  - **Optional**: Können für komplexere Logik oder externe Integrationen verwendet werden, z.B. für Benachrichtigungen oder Datenvalidierung vor dem Speichern. Für die Kernfunktionalität des Chats sind sie möglicherweise nicht zwingend notwendig, da Supabase Realtime und Datenbank-Trigger vieles abdecken können.
- **Datenbank**: PostgreSQL (Supabase)
  - Speichert Benutzerdaten, Chat-Nachrichten und den Status von gelesenen/ungelesenen Nachrichten.
  - Nutzt PostgreSQL `LISTEN`/`NOTIFY` und Supabase Realtime für die Echtzeit-Synchronisation von Nachrichten.
  - Trigger und Funktionen können verwendet werden, um den `is_read` Status zu verwalten.

## API-Endpunkte
Die meisten Interaktionen erfolgen direkt über das Supabase Client SDK und dessen APIs.

### POST /api/messages (Optional - falls Edge Function benötigt wird)
- **Beschreibung**: Sendet eine neue Nachricht.
- **Request**: `{ sender_id: string, receiver_id: string, content: string }`
- **Response**: `{ message_id: string, timestamp: string }`

### GET /api/messages?chat_id={chat_id}&limit={limit}&offset={offset} (Optional - falls Edge Function benötigt wird)
- **Beschreibung**: Ruft den Chatverlauf für einen spezifischen Chat ab.
- **Request**: (Query-Parameter)
- **Response**: `[{ message_id: string, sender_id: string, content: string, timestamp: string, is_read: boolean }]`

### POST /api/messages/read (Optional - falls Edge Function benötigt wird)
- **Beschreibung**: Markiert Nachrichten als gelesen.
- **Request**: `{ message_ids: string[], user_id: string }`
- **Response**: `{ success: boolean }`

## Datenbank-Schema
```sql
-- Tabelle für Benutzer
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Chat-Nachrichten
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL, -- Referenz zu einem Chat (falls Gruppen/1:1 Chats unterschieden werden)
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle zur Verwaltung des Lesestatus pro Benutzer und Nachricht
CREATE TABLE message_reads (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id) -- Eine Nachricht kann von mehreren Benutzern gelesen werden
);

-- Tabelle für Chats (für 1:1 oder Gruppenchats)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT, -- Für Gruppenchats
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle zur Verknüpfung von Benutzern mit Chats
CREATE TABLE chat_participants (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (chat_id, user_id)
);

-- RLS (Row Level Security) Policies für alle Tabellen sollten implementiert werden,
-- um sicherzustellen, dass Benutzer nur auf relevante Daten zugreifen können.

-- Supabase Realtime wird über PostgreSQL `LISTEN`/`NOTIFY` auf der `messages` Tabelle konfiguriert.
-- Ein Trigger kann erstellt werden, um bei neuen Nachrichten ein NOTIFY zu senden.
--