# TradieConnect — Project Overview

## What This Is

TradieConnect is a two-sided marketplace connecting Australian customers with licensed tradespeople. Customers post service requests for free; tradies pay $0.50 AUD to unlock request details and submit quotes.

## Business Model

| Concept | Value |
|---------|-------|
| Unlock cost | $0.50 AUD per request |
| Signup bonus (tradie) | $10 AUD |
| Minimum wallet recharge | $5 AUD |
| Customer cost | Free |
| Commission rate | 5% |

## User Roles

- **Customer** — posts service requests, receives quotes, accepts and rates tradies
- **Tradie** — browses requests, unlocks with credits, submits quotes, manages wallet
- **Admin** — manages users, monitors finances, oversees platform health

## Live Deployment

- Web app: https://tradie-mate-f852a.web.app
- Firebase project: `tradie-mate-f852a` (us-central1)
- Console: https://console.firebase.google.com/project/tradie-mate-f852a/overview

## Key Flows

1. Customer posts request → tradies see summary in Explorer
2. Tradie pays $0.50 to unlock full details
3. Tradie submits quote → customer gets notification
4. Customer compares quotes → accepts one → shares address/phone
5. Job completes → customer rates tradie

## Environment Variables

All Firebase config is loaded via `EXPO_PUBLIC_*` env vars defined in `.env` / `.env.local`:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
