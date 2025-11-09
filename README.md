# Chat-Anwendung

## Überblick
Dieses Projekt ist eine Echtzeit-Chat-Anwendung, die es Benutzern ermöglicht, Nachrichten zu senden und zu empfangen. Ein besonderes Feature ist die Hervorhebung ungelesener Nachrichten, um wichtige Informationen nicht zu verpassen. Das Projekt wurde mit einem modernen Tech-Stack und einem klaren Architekturdesign entwickelt, um Skalierbarkeit und einfache Wartung zu gewährleisten.

## Features
- Senden und Empfangen von Textnachrichten in Echtzeit.
- Ungelesene Nachrichten werden fettgedruckt dargestellt.
- Markieren von Nachrichten als gelesen.
- Abrufen des Chatverlaufs für spezifische Chaträume.

## Architektur
Die Anwendung folgt einer modernen Architektur, die auf einem Frontend-Backend-Modell basiert, ergänzt durch eine leistungsstarke Datenbank und Echtzeit-Fähigkeiten.

- **Frontend**: Entwickelt mit **React**, **TypeScript** und **TailwindCSS** für eine responsive und dynamische Benutzeroberfläche. Es nutzt `socket.io-client` für die Echtzeit-Kommunikation über WebSockets.
- **Backend**: Implementiert mit **Supabase Edge Functions** (Deno/TypeScript), das eine serverlose Umgebung für die API-Logik bietet. Es verwaltet die Authentifizierung, Nachrichtenpersistenz und die Weiterleitung von Nachrichten. Das Backend nutzt **Supabase Realtime** für Echtzeit-Updates und Benachrichtigungen.
- **Datenbank**: Eine **PostgreSQL**-Datenbank, gehostet von Supabase, speichert Benutzerdaten, Chaträume, Nachrichten und den Lesestatus von Nachrichten.

### API-Endpunkte

- **POST /api/messages**: Sendet eine neue Nachricht an einen Chatraum.
  - **Request Body**: `{ "chat_room_id": "uuid", "sender_id": "uuid", "content": "string" }`
  - **Success Response**: `201 Created` mit der vollständigen Nachrichtendaten.
- **GET /api/messages/:chat_room_id**: Ruft den Nachrichtenverlauf für einen Chatraum ab.
  - **Success Response**: `200 OK` mit einem Array von Nachrichten, inklusive `read_by`-Informationen.
- **POST /api/messages/:message_id/read**: Markiert eine Nachricht als gelesen für den aktuellen Benutzer.
  - **Success Response**: `200 OK` mit einer Erfolgsmeldung.

### Datenbank-Schema
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

-- Tabelle für Nachrichten
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Lesebestätigungen
CREATE TABLE read_receipts (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Tabelle für die Zuordnung von Benutzern zu Chaträumen
CREATE TABLE chat_room_participants (
  chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (chat_room_id, user_id)
);
```

## Installation
Um das Projekt lokal einzurichten und zu starten, führen Sie die folgenden Schritte aus:

1.  **Repository klonen:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    # Für das Frontend (im Frontend-Verzeichnis)
    cd frontend
    npm install

    # Für das Backend (Supabase Edge Functions, keine direkte Installation, sondern Deployment)
    # Stellen Sie sicher, dass Deno installiert ist, falls Sie lokal