# Zuga Table Finder — UX Documentation

This document describes the user experience (UX) for the Zuga Table Finder app: primary flows, screen structure, component behaviour, modals, accessibility considerations, and edge cases to test.

## App Overview

Zuga Table Finder helps users create and manage game tables and players, find matches, and schedule game nights. The UI is organized around a main tables list, controls for adding/editing tables and players, and a floating action menu for quick tasks.

## Primary User Flows

- Discover/Create a Table: Users land on the Tables view, scan existing `TableCard`s, and use the FAB to create a new table via the `CreateTableModal`.
- Add/Edit Player: From a table detail or player section, users open `AddPlayerModal` / `EditPlayerModal` to manage player information.
- Match Players to Tables: Use the `PlayerMatchingSection` to assign players to available seats and view conflicts.
- Search Board Games: `GameSearchInput` lets users search BGG for game titles when creating or editing tables.
- Schedule Date: `NightDatePicker` selects the table night/time.

## Screens & Layout

- Main screen: `TablesSection` lists `TableCard` components in a responsive grid. Each card shows table name, date, players, available seats, and action buttons (edit, details, delete).
- Side or modal panels: Table/player details open in modal overlays (`DetailTableModal`, `DetailPlayerModal`) to avoid navigation and keep context.
- Floating Action: `FabMenu.svelte` provides quick access to create table, add player, or open player matching.

## Components & Behaviour

- `TableCard.svelte`
  - Shows summary info: name, date, player avatars/count, spare players.
  - Primary click opens `DetailTableModal`.
  - Action buttons trigger edit/delete modals.

- `TablesSection.svelte`
  - Supports sorting (by date, name) and filtering (open tables, full tables).
  - Responsive: cards flow into columns on wide screens and a single column on narrow screens.

- `GameSearchInput.svelte`
  - Autocomplete search against BGG API.
  - Debounced input with keyboard navigation for results and graceful error states.

- `NightDatePicker.svelte`
  - Clear date selection with quick presets (Tonight, This Weekend).
  - Invalid dates disabled; show confirmation when changing an active table night.

- Modals (Create/Edit/Delete/Detail)
  - All modals center on screen with an overlay that closes on background click or `Esc`.
  - Use form validation and show inline error messages.

## State & Interactions

- Actions are handled via `ActionsManager.svelte.ts` and `PageStateManager.svelte.ts` to keep UI reactive and consistent.
- Optimistic UI: when creating or updating, show immediate changes while persisting to server; show a transient snackbar on failure and revert if necessary.

## Accessibility

- Keyboard: Ensure all interactive controls are reachable by `Tab`. Modals trap focus while open and return focus to the triggering element on close.
- ARIA: Provide `aria-label`/`aria-describedby` for actions, and role="dialog" with appropriate `aria-modal` on modals.
- Contrast & Touch Targets: Buttons and inputs meet WCAG contrast; touch targets >= 44x44px on mobile.

## Mobile / Responsive Behavior

- FAB becomes a compact single-icon button on small screens; expand to full menu on tap.
- Tables list becomes a single-column scroll; heavy lists should paginate or virtualize if needed.

## Microinteractions & Feedback

- Loading states: show skeletons for table cards and inline spinners for network actions.
- Success/Failure: use subtle toasts for save/delete confirmations and clear inline errors for validation problems.
- Animations: use short, unobtrusive transitions when opening/closing modals and inserting/removing cards.

## Error States & Edge Cases

- Network failures: provide retry affordances and preserve unsaved form data across retries.
- Conflicting edits: if two users edit the same table, show a merge/conflict prompt describing the differences and offer to reload.
- Empty states: when no tables exist, show an empty-state illustration with primary CTA to create a table and a short how-to.

## Testing & QA Notes

- Verify keyboard-only flows: opening/closing modals, form submission, search navigation.
- Test BGG search rate limits and fallback UX when API is unavailable.
- Test responsive breakpoints and FAB behavior on mobile.

## Analytics & Events

- Track: create_table, edit_table, delete_table, add_player, match_players, game_search, open_modal, date_change.
- Include metadata: table_id, player_count, search_query, and result_count for `game_search` events.

## Next UX Improvements (Ideas)

- Add onboarding hints for first-time users (how to create tables and match players).
- Bulk actions for moving multiple players between tables.
- Live presence indicators showing who is editing a table.

---

If you want, I can also generate a shorter cheatsheet for the UI team or wireframes for the main flows. Review this file: [docs/UX.md](docs/UX.md)
