# Test-Plan

## Unit Tests
### Test 1: sendMessage - Erfolgreiches Senden einer Nachricht
- **Beschreibung**: Testet das erfolgreiche Senden einer Nachricht und die korrekte Speicherung in der `messages`-Tabelle sowie die Erstellung des Lesestatus für alle Chat-Teilnehmer.
- **Eingabe**:
    ```json
    {
      "senderId": "user-uuid-1",
      "chatId": "chat-uuid-1",
      "content": "Hallo Welt!"
    }
    ```
- **Erwartetes Ergebnis**:
    - HTTP-Statuscode: 200
    - Response Body: `{ "messageId": "UUID_DER_NEUEN_NACHRICHT", "timestamp": "ISO_DATUM_ZEIT" }`
    - Datenbank-Check (`messages` Tabelle): Ein neuer Eintrag mit `sender_id`, `chat_id`, `content` und generiertem `id` und `timestamp`.
    - Datenbank-Check (`message_read_status` Tabelle): Für jeden Teilnehmer des `chatId` (angenommen 2 Teilnehmer A und B) zwei Einträge:
        - `{ message_id: UUID_DER_NEUEN_NACHRICHT, user_id: "user-uuid-1", is_read: true }`
        - `{ message_id: UUID_DER_NEUEN_NACHRICHT, user_id: "user-uuid-2", is_read: false }` (wenn user-uuid-2 der andere Teilnehmer ist)
- **Status**: ✅ Bestanden

### Test 2: sendMessage - Fehlende Felder
- **Beschreibung**: Testet das Verhalten bei fehlenden Pflichtfeldern in der Anfrage zum Senden einer Nachricht.
- **Eingabe**:
    ```json
    {
      "senderId": "user-uuid-1",
      "chatId": "chat-uuid-1"
    }
    ```
- **Erwartetes Ergebnis**:
    - HTTP-Statuscode: 400
    - Response Body: `{ "error": "Missing required fields: senderId, chatId, content" }`
    - Datenbank-Check: Keine neuen Einträge in `messages` oder `message_read_status`.
- **Status**: ✅ Bestanden

### Test 3: sendMessage - Falsche HTTP-Methode
- **Beschreibung**: Testet das Verhalten, wenn `sendMessage` mit einer anderen Methode als POST aufgerufen wird.
- **Eingabe**: `GET /api/sendMessage`
- **Erwartetes Ergebnis**:
    - HTTP-Statuscode: 405
    - Response Body: `{ "error": "Method Not Allowed" }`
- **Status**: ✅ Bestanden

### Test 4: markMessagesAsRead - Erfolgreiches Markieren als gelesen
- **Beschreibung**: Testet das erfolgreiche Markieren einer Liste von Nachrichten als gelesen für einen bestimmten Benutzer.
- **Eingabe**:
    ```json
    {
      "userId": "user-uuid-2",
      "messageIds": ["message-uuid-1", "message-uuid-2"]
    }
    ```
- **Erwartetes Ergebnis**:
    - HTTP-Statuscode: 200
    - Response Body: `{ "status": "success", "markedCount": 2 }`
    - Datenbank-Check (`message_read_status` Tabelle): Die Einträge für `user-uuid-2` und die angegebenen `messageIds` sollten `is_read: true` sein.
- **Status**: ✅ Bestanden

### Test 5: markMessagesAsRead - Fehlende Felder
- **Beschreibung**: Testet das Verhalten bei fehlenden Pflichtfeldern in der Anfrage zum Markieren von Nachrichten.
- **Eingabe**:
    ```json
    {
      "userId": "user-uuid-2"
    }
    ```
- **Erwartetes Ergebnis**:
    - HTTP-Statuscode: 400
    - Response Body: `{ "error": "Missing required fields: userId, messageIds (array)" }`
    - Datenbank-Check: Keine Änderungen in `message_read_status`.
- **Status**: ✅ Bestanden

### Test 6: markMessagesAsRead - Leeres messageIds Array
- **Beschreibung**: Testet das Verhalten, wenn das `messageIds`-Array leer ist.
- **Eingabe**:
    ```json
    {
      "userId": "user-uuid-2",
      "messageIds": []
