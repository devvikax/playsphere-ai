# Phase 2: Critical Bug Fixes

> **Status**: ⬜ Not Started
> **Objective**: Fix the two highest-impact UX bugs — chat scroll hijack and auth session loss on page refresh.

---

## Bug 1: Auth Session Loss (Auto-Logout on Refresh)

### Root Cause
`AuthProvider.tsx` line 42:
```typescript
document.cookie = `auth-token=${token}; path=/; max-age=${3600 * 24 * 7}; Secure; SameSite=Lax`;
```
The `Secure` flag tells browsers to only send this cookie over HTTPS. On `http://localhost`, browsers **silently reject** Secure cookies — the cookie is never set. Middleware checks for `auth-token` → missing → redirects to login. This is why every refresh causes logout on local dev.

### Fix: `components/auth/AuthProvider.tsx`
```typescript
// Conditionally append Secure flag only on HTTPS
const isSecure = window.location.protocol === 'https:';
const secureFlag = isSecure ? '; Secure' : '';
document.cookie = `auth-token=${token}; path=/; max-age=${3600 * 24 * 7}${secureFlag}; SameSite=Lax`;
```

### Also Fix: Token Refresh
- Add Firebase `onIdTokenChanged` listener alongside `onAuthStateChanged`
- Refresh token every 55 minutes (Firebase tokens expire at 60 min)
- Update cookie each time token refreshes

### Also Fix: Login/Signup Redirect
- Wrap `useSearchParams()` in `<Suspense>` on login/signup pages (Next.js 13+ requirement)
- If user is already logged in on login page, redirect to `/dashboard`

---

## Bug 2: Chat Scroll Hijack

### Root Cause
`AIConciergePreview.tsx` line 22:
```typescript
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```
`scrollIntoView()` scrolls **the entire document** to bring the element into the viewport. It has no concept of "scroll only the container". The result: every time a message is sent, the page jumps to where the chat widget is.

### Fix: `components/ai/AIConciergePreview.tsx`
```typescript
// Add ref to the messages container div
const messagesContainerRef = useRef<HTMLDivElement>(null);

const scrollToBottom = () => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }
};

// Attach ref to messages container:
// <div ref={messagesContainerRef} className="h-80 overflow-y-auto ...">
```

### Additional Chat UX Improvements
- Add smooth CSS transition on scroll
- Preserve input focus after sending message
- Add typing indicator animation (three-dot bounce)
- Add graceful error state: "AI temporarily unavailable. Please try again."
- Prevent double-send when Enter is held down

---

## Files to Change

| File | Change |
|------|--------|
| `components/auth/AuthProvider.tsx` | Fix Secure cookie flag, add token refresh |
| `app/auth/login/page.tsx` | Add Suspense, redirect if already logged in |
| `app/auth/signup/page.tsx` | Add Suspense, redirect if already logged in |
| `components/ai/AIConciergePreview.tsx` | Fix scroll, add typing animation, improve error states |

---

## Verification

- [ ] Refresh `/dashboard` — stays logged in, does not redirect to `/auth/login`
- [ ] Navigate away and back — stays logged in
- [ ] Send a message in AI chat — page does NOT scroll; only chat container scrolls
- [ ] Rapid-send multiple messages — no page jump on any send
- [ ] Visit `/auth/login` while logged in → immediately redirects to `/dashboard`
- [ ] Input focus stays in text box after sending message
