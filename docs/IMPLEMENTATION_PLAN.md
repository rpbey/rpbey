# RPB Dashboard - Implementation Plan

This plan outlines the remaining tasks to complete the RPB Dashboard.

## Phase 1: Admin Infrastructure & CRUD
### 1.1 Tournament Management (HIGH PRIORITY)
- [ ] Create `src/app/(admin)/admin/tournaments/actions.ts` for Server Actions.
- [ ] Create `src/app/(admin)/admin/tournaments/TournamentDialog.tsx` for creating/editing.
- [ ] Update `src/app/(admin)/admin/tournaments/page.tsx` to use Client Components for interactivity.
- [ ] Implement Challonge API integration (basic sync).

### 1.2 User Management
- [ ] Implement `src/app/(admin)/admin/users/page.tsx` to list and manage users.
- [ ] Add ability to change user roles (user, staff, admin).
- [ ] Add ability to ban/unban users.

### 1.3 Discord Bot Configuration
- [ ] Implement `src/app/(admin)/admin/bot/config/page.tsx` to manage bot settings (welcome channel, role IDs, etc.).
- [ ] Implement `src/app/(admin)/admin/bot/logs/page.tsx` to view bot activity logs.

## Phase 2: User Features
### 2.1 Blader Profile
- [ ] Implement `/profile` page (Client Component).
- [ ] Allow users to set their Blader Name, Favorite Type (Attack, Defense, etc.).
- [ ] Display user stats (wins, losses, tournament participation).

### 2.2 Tournament Registration
- [ ] Implement registration flow on tournament landing pages.
- [ ] Check-in system for tournament day.

## Phase 3: Integration & Polishing
### 3.1 Twitch Integration
- [ ] Implement Twitch stream status on landing page.
- [ ] Automatic "Live" role on Discord when a staff member streams.

### 3.2 UI/UX Improvements (Material Design 3)
- [ ] Ensure all components follow M3 guidelines (color roles, shapes, motion).
- [ ] Smooth transitions between marketing and dashboard sections.
- [ ] Mobile optimization for all admin pages.

## Phase 4: Production Readiness
- [ ] Finalize environment variables.
- [ ] Setup automated database backups.
- [ ] Deployment verification on Coolify.
