# Phase 1: Architecture & Role System Verification

> **Status**: ⬜ Not Started  
> **Objective**: Verify Player, Owner, and Admin role definitions, Firestore storage, role guards, route protection, and dashboard routing logic.

---

## Context

We need to inspect the baseline system and confirm:
1. `UserRole` and `UserProfile` types match the 3-role ecosystem requirements.
2. The `AuthProvider` correctly checks and exposes roles (`isAdmin`, `isOwner`, `isPlayer`, `isApprovedOwner`).
3. Middleware blocks unauthorized users from hitting protected routes (like `/owner` and `/admin`).
4. Public signup does not allow registration of admin accounts, and owners start with `approvalStatus: 'pending'`.

---

## Files to Inspect & Verify

### [INSPECT] [types/index.ts](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/types/index.ts)
- Confirm `UserRole` contains `'player' | 'owner' | 'admin'`.
- Confirm `UserProfile` contains `role: UserRole` and `approvalStatus?: ApprovalStatus`.

### [INSPECT] [components/auth/AuthProvider.tsx](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/components/auth/AuthProvider.tsx)
- Confirm whitelisted emails from `NEXT_PUBLIC_ADMIN_EMAILS` are identified as `admin`.
- Confirm `isApprovedOwner` evaluates to `true` only when `profile.role === 'owner'` and `profile.approvalStatus === 'approved'`.

### [INSPECT] [middleware.ts](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/middleware.ts)
- Confirm `/owner` and `/admin` routes require authenticated tokens.
- Check if any logic bypasses role-based checks.

---

## Verification Steps

- [ ] Check type safety using `npx tsc --noEmit`.
- [ ] Verify whitelisted admin emails load correctly from client environment variable `NEXT_PUBLIC_ADMIN_EMAILS`.
- [ ] Confirm middleware blocks unauthenticated attempts to hit `/owner` and `/admin`.
