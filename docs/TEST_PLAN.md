```markdown
# Test-Plan

## Unit Tests
### Test 1: Nachrichten senden - Erfolgreich
- **Beschreibung**: Überprüfung, ob eine Nachricht erfolgreich über den `POST /api/messages`-Endpunkt gesendet und in der Datenbank gespeichert wird.
- **Eingabe**:
  ```json
  {
    "chat_room_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "sender_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "content": "Hallo, dies ist eine Testnachricht."
  }
  ```
- **Erwartetes Ergebnis**: Eine HTTP-Antwort mit Status 201 (Created) und der gesendeten Nachricht inklusive generierter `id` und `created_at`.
  ```json
  {
    "id": "uuid-der-nachricht",
    "chat_room_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "sender_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "content": "Hallo, dies ist eine Testnachricht.",
    "created_at": "2023-10-27T10:00:00Z"
  }
  ```
- **Status**: ❌ Fehlgeschlagen (Derzeit gibt es keine Implementierung für `read_receipts` in der `messages` Tabelle, die vom Backend API erwartet wird, und es gibt keine direkte Zuordnung der `read_receipts` in `messages` Tabelle für die Rückgabe.)

### Test 2: Nachrichten senden - Ungültige Eingabe
- **Beschreibung**: Überprüfung des Verhaltens beim Senden einer Nachricht mit fehlenden oder ungültigen Feldern.
- **Eingabe**:
  ```json
  {
    "sender_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "content": "Nachricht ohne Chatraum-ID."
  }
  ```
- **Erwartetes Ergebnis**: Eine HTTP-Antwort mit Status 400 (Bad Request) und einer entsprechenden Fehlermeldung.
- **Status**: ❌ Fehlgeschlagen (Das aktuelle Backend fängt dies nicht explizit ab und würde wahrscheinlich einen Datenbankfehler zurückgeben, anstatt einen 400 Bad Request.)

### Test 3: Nachrichten abrufen - Erfolgreich
- **Beschreibung**: Überprüfung, ob der Nachrichtenverlauf für einen bestimmten Chatraum erfolgreich abgerufen wird.
- **Eingabe**: `GET /api/messages/a1b2c3d4-e5f6-7890-1234-567890abcdef` (mit existierendem `chat_room_id`)
- **Erwartetes Ergebnis**: Eine HTTP-Antwort mit Status 200 (OK) und einem Array von Nachrichten, die `read_by`-Informationen enthalten.
  ```json
  [
    {
      "id": "uuid-1",
      "chat_room_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "sender_id": "user-a-id",
      "content": "Erste Nachricht",
      "created_at": "...",
      "read_by": ["user-b-id"]
    },
    {
      "id": "uuid-2",
      "chat_room_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "sender_id": "user-b-id",
      "content": "Zweite Nachricht",
      "created_at": "...",
      "read_by": []
    }
  ]
  ```
- **Status**: ✅ Bestanden (Das Backend transformiert `read_receipts` korrekt in `read_by` und entfernt das Originalfeld.)

###