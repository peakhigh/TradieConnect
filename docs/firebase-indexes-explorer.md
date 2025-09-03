# Firebase Indexes for Explorer Screen

## Required Indexes Added

Based on the Explorer screen query patterns, I've added these essential indexes to `firestore.indexes.json`:

### 1. Request Intelligence Collection
```json
{
  "collectionGroup": "requestIntelligence",
  "fields": [
    { "fieldPath": "requestId", "order": "ASCENDING" }
  ]
}
```
**Purpose**: Batch lookup of pre-computed market intelligence data

### 2. Quotes by Request ID
```json
{
  "collectionGroup": "quotes", 
  "fields": [
    { "fieldPath": "requestId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Purpose**: Fetch quotes for unlocked requests, sorted by creation date

### 3. Unlock Transactions by Tradie
```json
{
  "collectionGroup": "unlockTransactions",
  "fields": [
    { "fieldPath": "tradieId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```
**Purpose**: Check which requests a tradie has unlocked

### 4. Service Requests with Trade Filter
```json
{
  "collectionGroup": "serviceRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "trades", "arrayConfig": "CONTAINS" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Purpose**: Filter requests by trade type (plumber, electrician, etc.)

### 5. Service Requests with Location Filter
```json
{
  "collectionGroup": "serviceRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "postcode", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Purpose**: Filter requests by postcode/location

### 6. Service Requests with Urgency Filter
```json
{
  "collectionGroup": "serviceRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "urgency", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Purpose**: Filter requests by urgency level

### 7. Combined Filters - Trade + Location
```json
{
  "collectionGroup": "serviceRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "trades", "arrayConfig": "CONTAINS" },
    { "fieldPath": "postcode", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 8. Combined Filters - Trade + Urgency
```json
{
  "collectionGroup": "serviceRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "trades", "arrayConfig": "CONTAINS" },
    { "fieldPath": "urgency", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 9. Combined Filters - Location + Urgency
```json
{
  "collectionGroup": "serviceRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "postcode", "order": "ASCENDING" },
    { "fieldPath": "urgency", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 10. All Filters Combined
```json
{
  "collectionGroup": "serviceRequests",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "trades", "arrayConfig": "CONTAINS" },
    { "fieldPath": "postcode", "order": "ASCENDING" },
    { "fieldPath": "urgency", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Deploy Indexes

Run this command to deploy the new indexes:

```bash
firebase deploy --only firestore:indexes
```

## Performance Impact

These indexes will:
- Enable efficient filtering by trade, location, and urgency
- Support the pre-computed intelligence architecture (90% cost reduction)
- Allow fast pagination with `startAfter()` cursors
- Eliminate the need for client-side filtering

## Query Patterns Supported

1. **Basic listing**: `status == 'open'` + `orderBy('createdAt', 'desc')`
2. **Trade filtering**: Above + `trades array-contains 'plumber'`
3. **Location filtering**: Above + `postcode == '2000'`
4. **Urgency filtering**: Above + `urgency == 'high'`
5. **Combined filtering**: Any combination of the above filters
6. **Intelligence lookup**: `requestId in [array of IDs]`
7. **Unlock checking**: `tradieId == 'id'` + `status == 'completed'`