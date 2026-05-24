# Phase 2: Authentication & Approval Flow Verification

> **Status**: ⬜ Not Started  
> **Objective**: Verify Player login/signup paths (Email & Google), Owner signup card selectors, and whitelisted Admin logins. Test auth refresh persistence.

---

## Context

We need to inspect and confirm:
1. `signUpWithEmail` correctly registers user profile with correct `role` and `approvalStatus: 'pending'` for owners.
2. Google Sign-In defaults to `player` role without exceptions.
3. Visual selector cards in `/auth/signup` function correctly (passes correct role parameter).
4. No redirect loops or random logouts happen on dashboard views upon page reload.

---

## Files to Inspect & Verify

### [INSPECT] [lib/firebase/auth.ts](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/lib/firebase/auth.ts)
- Confirm `signUpWithEmail` and `ensureUserProfile` map parameters properly.

### [INSPECT] [app/auth/signup/page.tsx](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/app/auth/signup/page.tsx)
- Confirm visual role selection maps to correct state variables.

---

## Verification Steps

- [ ] Verify role selection state logic on signup form.
- [ ] Confirm Google sign in defaults role to `player`.
- [ ] Test session persistence across reload actions.
