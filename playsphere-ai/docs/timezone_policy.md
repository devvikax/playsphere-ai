# Timezone & Clock Consistency Policy — PlaySphere AI

This document establishes the official timezone assumptions, slot representation formats, and clock evaluation protocols implemented across the PlaySphere AI platform.

---

## 🕒 Official Platform Timezone

PlaySphere AI operates strictly under **Indian Standard Time (IST / UTC+5:30)** context since all sports infrastructure facilities, landmarks, and bookings are located in **Lucknow, India**.

---

## 📅 Timing Representational Specifications

### 1. Date Format
* Standard date parameters throughout the system use the `YYYY-MM-DD` ISO-local string representation (e.g. `"2026-05-30"`).
* Avoid mixing dynamic timezone calculations by converting date boundaries to local IST calendar days consistently.

### 2. Slot Time Format
* Timing slots are stored and parsed using the localized `HH:MM` standard (24-hour style) with an en-dash `–` or a hyphen `-` separator (e.g. `"09:00–10:00"` or `"18:00-19:00"`).
* Slot boundaries are evaluated against the end-time bounds, meaning a slot ending at `19:00` is past if the current clock is past `19:00`.

---

## 🔒 Server-Time Verification & Manipulation Immunity

To safeguard the platform against local clock manipulation (e.g., a player altering their device timezone to book expired morning slots), PlaySphere AI implements a hybrid verification design:

1. **Client-Side Rendering (Helpful UX)**:
   * The client defaults to rendering disabled tags for past slots using their local time boundary checks, offering direct visual feedback.
2. **Server-Side Lockdown (Truth & Immunity)**:
   * The backend and AI services verify and rank bookings/slots using synchronized Python datetime functions. Both client-side calls (`createBooking`) and backend-side calls (`is_slot_in_past`, `get_booking_lifecycle`) ignore any user-supplied clock offsets, evaluating times strictly within the server and Firebase runtime environments.
3. **No Drift / No Cron**:
   * Lifecycle statuses (`upcoming`, `completed`, `expired`, `cancelled`) are calculated dynamically upon retrieval. By utilizing dynamic time-boundary queries rather than stateful triggers or cron jobs, the platform is 100% resilient to synchronization drifts or timer failures.
