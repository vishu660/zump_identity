# zump_identity

## MongoDB Indexes

- `users._id` — Supports document identity and user ID lookups.
- `authactivities._id` — Supports document identity.
- `authactivities.userId + success + event + createdAt` — Supports efficient authentication-history filtering and newest-first login retrieval.
- `sessions._id` — Supports document identity.
- `sessions.tokenId` — Uniquely identifies refresh-token sessions.
- `sessions.familyId` — Supports session-family lookups.