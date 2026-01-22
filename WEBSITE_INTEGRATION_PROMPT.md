# Prompt for Main Website (Registration Logic)

**Instructions for AI/Developer:**
Please update the **Tournament Registration API/Server Action** to ensure data is correctly linked for the Admin Panel.

---

**Goal:**
When a user joins a tournament, they must be added to **BOTH** the `registrations` table (for the tournament) and the `match_registrations` table (for the active match).

**Database Schema:**
1.  `public.registrations`:
    -   `tournament_id` (UUID)
    -   `user_id` (UUID)
    -   `player_details` (JSONB)
    -   `status` (text)

2.  `public.match_registrations`:
    -   `match_id` (UUID) - *Links to `matches.id`*
    -   `user_id` (UUID)
    -   `player_details` (JSONB)
    -   `status` (text)

**Required Logic (Step-by-Step):**

1.  **Insert Tournament Registration:**
    -   Insert record into `public.registrations`.

2.  **Find Active Match:**
    -   Query `public.matches` to find the current valid match for this tournament.
    -   `SELECT id FROM matches WHERE tournament_id = [TOURNAMENT_ID] AND status = 'Open' LIMIT 1`

3.  **Insert Match Registration (Critical):**
    -   **IF** an Open match is found, perform a second INSERT into `public.match_registrations`.
    -   **`match_id`**: Use the UUID found in Step 2.
    -   **`user_id`**: Current User ID.
    -   **`player_details`**: Same In-Game Name/UID details.

**Note:**
If you skip Step 3, the player will **NOT** appear in the Match Lobby or Admin Panel "Match Registrations" list.
