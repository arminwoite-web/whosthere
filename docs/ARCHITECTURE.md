```markdown
# System-Architektur

## Überblick
Diese Systemarchitektur beschreibt eine Echtzeit-Chat-Anwendung, die es Benutzern ermöglicht, Nachrichten zu senden und zu empfangen. Besondere Merkmale sind die Echtzeit-Kommunikation und die Hervorhebung ungelesener Nachrichten. Die Architektur nutzt eine moderne Frontend-Technologie (React) und ein serverloses Backend (Supabase Edge Functions) mit einer PostgreSQL-Datenbank für Skalierbarkeit und einfache Entwicklung.

## Komponenten
- **Frontend**: React + TypeScript + TailwindCSS
  - Verantwortlich für die Benutzeroberfläche, das Senden und Empfangen von Nachrichten über WebSockets und die Darstellung ungelesener Nachrichten.
  - Verwendet `socket.io-client` für die WebSocket-Verbindung.
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
  - Verantwortlich für die Authentifizierung, das Speichern von Nachrichten, das Verwalten von Chaträumen und das Weiterleiten von Nachrichten über WebSockets.
  - Nutzt Supabase Realtime für Echtzeit-Updates.
  - API-Endpunkte für das Senden von Nachrichten und das Abrufen des Nachrichtenverlaufs.
- **Datenbank**: PostgreSQL (Supabase)
  - Speichert Benutzerinformationen, Chaträume, Nachrichten und den Lesestatus von Nachrichten.
  - Nutzt Supabase Realtime für Echtzeit-Benachrichtigungen über neue Nachrichten.

## API-Endpunkte

### POST /api/messages
- **Beschreibung**: Sendet eine neue Nachricht an einen Chatraum.
- **Request**:
  ```json
  {
    "chat_room_id": "uuid-des-chatraums",
    "sender_id": "uuid-des-senders",
    "content": "Hallo Welt!"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid-der-nachricht",
    "chat_room_id": "uuid-des-chatraums",
    "sender_id": "uuid-des-senders",
    "content": "Hallo Welt!",
    "created_at": "2023-10-27T10:00:00Z"
  }
  ```

### GET /api/messages/:chat_room_id
- **Beschreibung**: Ruft den Nachrichtenverlauf für einen bestimmten Chatraum ab.
- **Request**: (Kein Body)
- **Response**:
  ```json
  [
    {
      "id": "uuid-der-nachricht-1",
      "chat_room_id": "uuid-des-chatraums",
      "sender_id": "uuid-des-senders-1",
      "content": "Nachricht 1",
      "created_at": "2023-10-27T09:50:00Z",
      "read_by": ["uuid-des-benutzers-a", "uuid-des-benutzers-b"]
    },
    {
      "id": "uuid-der-nachricht-2",
      "chat_room_id": "uuid-des-chatraums",
      "sender_id": "uuid-des-senders-2",
      "content": "Nachricht 2",
      "created_at": "2023-10-27T10:00:00Z",
      "read_by": ["uuid-des-benutzers-a"]
    }
  ]
  ```

### POST /api/messages/:message_id/read
- **Beschreibung**: Markiert eine Nachricht als gelesen für den aktuellen Benutzer.
- **Request**: (Kein Body)
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Nachricht als gelesen markiert."
  }
  ```

## Datenbank-Schema

```sql
-- Tabelle für Benutzer
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Chat-Räume
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT, -- Optionaler Name für Gruppenchats
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für die Zuordnung von Benutzern zu Chat