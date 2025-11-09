```markdown
# System-Architektur

## Überblick
Diese Architektur beschreibt eine Echtzeit-Chat-Anwendung, die es Benutzern ermöglicht, Nachrichten sofort zu senden und zu empfangen. Der Fokus liegt auf Skalierbarkeit, Echtzeit-Kommunikation und der robusten Verwaltung des Chat-Verlaufs sowie dem Tracking ungelesener Nachrichten. Supabase wird als Backend-as-a-Service (BaaS) genutzt, um Datenbank, Authentifizierung und Echtzeit-Funktionalität (via PostgreSQL `LISTEN/NOTIFY` oder Supabase Realtime) bereitzustellen. Edge Functions werden für serverseitige Logik und API-Endpunkte verwendet.

## Komponenten
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

## API-Endpunkte
### POST /api/sendMessage
-   **Beschreibung**: Sendet eine neue Nachricht in einen Chat.
-   **Request**:
    ```json
    {
      "senderId": "uuid-des-senders",
      "chatId": "uuid-des-chats",
      "content": "Hallo, wie geht es dir?"
    }
    ```
-   **Response**:
    ```json
    {
      "messageId": "uuid-der-gesendeten-nachricht",
      "timestamp": "ISO-Datum-Zeit"
    }
    ```

### POST /api/markMessagesAsRead
-   **Beschreibung**: Markiert eine Liste von Nachrichten für einen Benutzer als gelesen.
-   **Request**:
    ```json
    {
      "userId": "uuid-des-benutzers",
      "messageIds": ["uuid-nachricht-1", "uuid-nachricht-2"]
    }
    ```
-   **Response**:
    ```json
    {
      "status": "success",
      "markedCount": 2
    }
    ```

### GET /api/getChatHistory
-   **Beschreibung**: Ruft den Chat-Verlauf für einen bestimmten Chat ab.
-   **Query-Parameter**:
    -   `chatId`: UUID des Chats (erforderlich)
    -   `limit`: Anzahl der abzurufenden Nachrichten (Standard: 50)
    -   `beforeMessageId`: UUID der Nachricht, vor der weitere Nachrichten geladen werden sollen (für Paginierung)
-   **Response**:
    ```json
    [
      {
        "id": "uuid-nachricht-1",
        "chat_id": "uuid-des-chats",
        "sender_id": "uuid-des-senders",
        "sender_username": "Benutzername",
        "content": "Nachrichtentext",
        "timestamp": "ISO-Datum-Zeit",
        "is_read": true // Der Lesestatus für den anfragenden Benutzer
      },
      // ... weitere Nachrichten
    ]
    ```

## Datenflüsse
1.  **Nachricht senden**:
    *   Frontend sendet `POST /api/sendMessage` an Edge Function.
    *   Edge Function speichert die Nachricht in der `messages`-Tabelle und erstellt Einträge in der `message_read_status`-Tabelle für alle Chat-Te