```markdown
# Echtzeit-Chat-Anwendung

## Überblick
Dieses Projekt ist eine Echtzeit-Chat-Anwendung, die es Benutzern ermöglicht, sofort Nachrichten zu senden und zu empfangen. Der Fokus liegt auf einer nahtlosen Benutzererfahrung, der robusten Verwaltung des Chat-Verlaufs und der visuellen Hervorhebung ungelesener Nachrichten. Supabase wird als Backend-as-a-Service (BaaS) genutzt, um Datenbank, Authentifizierung und Echtzeit-Funktionalität bereitzustellen.

## Features
-   **Echtzeit-Messaging**: Senden und Empfangen von Textnachrichten in Echtzeit.
-   **Chat-Verlauf**: Anzeige des chronologischen Verlaufs von Unterhaltungen mit Paginierung für ältere Nachrichten.
-   **Ungelesene Nachrichten**: Visuelle Hervorhebung (fettgedruckt) neuer, ungelesener Nachrichten.
-   **Lesestatus-Verwaltung**: Automatische Markierung von Nachrichten als gelesen, sobald sie vom Benutzer im Chat-Fenster gesehen wurden.
-   **Benutzer- und Zeitstempel**: Jede Nachricht wird mit dem Absender und einem Zeitstempel versehen.

## Architektur
Die Anwendung folgt einer modernen Architektur, die auf einem Frontend und einem Supabase-basierten Backend aufbaut.

-   **Frontend**: React + TypeScript + TailwindCSS
    -   Verantwortlich für die Benutzeroberfläche, das Senden von Nachrichten, die Anzeige des Chat-Verlaufs und die Echtzeit-Aktualisierung.
    -   Nutzt Supabase Client SDK für Authentifizierung, Datenbankzugriff und Realtime-Subscriptions.
    -   Verwaltet den Lesestatus von Nachrichten lokal und sendet Updates an das Backend.
-   **Backend**: Supabase Edge Functions
    -   **`sendMessage`**: Verarbeitet das Senden von Nachrichten, speichert diese in der Datenbank und löst Echtzeit-Events aus.
    -   **`markMessagesAsRead`**: Aktualisiert den Lesestatus von Nachrichten in der Datenbank.
    -   **`getChatHistory`**: Stellt den Chat-Verlauf für einen bestimmten Chat bereit, mit Paginierung.
-   **Datenbank**: PostgreSQL (Supabase)
    -   Speichert Benutzerdaten, Chat-Nachrichten und den Lesestatus von Nachrichten.
    -   Nutzt Supabase Realtime für die Echtzeit-Synchronisierung von Nachrichten.
-   **Echtzeit-Kommunikation**: Supabase Realtime
    -   Basiert auf PostgreSQL `LISTEN/NOTIFY` und WebSockets.
    -   Ermöglicht dem Frontend, sofortige Updates zu erhalten, wenn neue Nachrichten gesendet oder der Lesestatus geändert wird.

## Installation
```bash
# Frontend (Beispiel)
# Navigieren Sie in das Frontend-Verzeichnis
cd frontend
npm install
npm run dev

# Backend (Supabase Edge Functions)
# Die Edge Functions werden direkt in Supabase deployed und verwaltet.
# Lokale Einrichtung der Supabase CLI kann erforderlich sein.
# supabase login
# supabase link --project-ref <your-project-ref>
# supabase functions deploy sendMessage --no-verify-jwt --project-ref <your-project-ref>
# supabase functions deploy markMessagesAsRead --no-verify-jwt --project-ref <your-project-ref>
# supabase functions deploy getChatHistory --no-verify-jwt --project-ref <your-project-ref>
```

## API-Dokumentation

### POST /api/sendMessage
-   **Beschreibung**: Sendet eine neue Nachricht in einen Chat, speichert sie in der Datenbank und initialisiert den Lesestatus für alle Chat-Teilnehmer.
-   **Request Body**:
    ```json
    {
      "senderId": "uuid-des-senders",
      "chatId": "uuid-des-chats",
      "content": "Hallo, wie geht es dir?"
    }
    ```
-   **Erfolgs-Response (200 OK)**:
    ```json
    {
      "messageId": "uuid-der-gesendeten-nachricht",
      "timestamp": "ISO-Datum-Zeit"
    }
    ```
-   **Fehler-Responses**:
    -   **400 Bad Request**: `{ "error": "Missing required fields: senderId, chatId, content" }`
    -   **405 Method Not Allowed**: `{ "error": "Method Not Allowed" }` (wenn nicht POST verwendet wird)

### POST /api/markMessages