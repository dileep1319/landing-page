# Supabase Setup Instructions

## Overview

This folder contains all Supabase-related SQL migration files and setup documentation.

## Files

- **`users-table.sql`** - Creates the users table with username/password authentication
- **`users-table-migration.sql`** - Migration script to update existing users table
- **`games-bets.sql`** - Creates games and bets tables with campaign-based betting system
- **`registrations.sql`** - Creates registrations table for Super Bowl cashback campaign
- **`README.md`** - This file

## Setup Steps

### Step 1: Create Users Table

1. Go to your Supabase Dashboard → SQL Editor
2. Open the file `supabase/users-table.sql`
3. Copy the entire SQL code
4. Paste it in SQL Editor and click "Run"
5. This will create the `users` table with username and password fields

### Step 2: Enable Anonymous Auth Provider (Required)

Since we're using username/password with custom auth:
1. Go to Supabase Dashboard → **Authentication → Providers**
2. Find **"Anonymous"** provider
3. Toggle **"Enable Anonymous provider"** to **ON**
4. Save changes

### Step 3: Email Provider (Keep OFF)

1. Go to Supabase Dashboard → **Authentication → Providers**
2. Find **"Email"** provider
3. Keep **"Enable Email provider"** to **OFF** (as you requested)
4. Save changes

### Step 4: Create Games & Bets Tables

1. Go to Supabase Dashboard → SQL Editor
2. Open the file `supabase/games-bets.sql`
3. Copy and run the SQL
4. This creates:
   - `games` table (for managing betting games)
   - `bets` table (for user bets)
   - RLS policies for security

### Step 5: Create Super Admin

After creating a user account, mark them as super admin:

```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE username = 'your_admin_username';
```

### Step 6: Configure RLS Policies

The SQL files already set up RLS policies, but verify:
- Users table allows public INSERT (for registration)
- Authenticated users can read their own data
- Games: Everyone can read, only super_admin can write
- Bets: Users can see their own bets, super_admin can see all
- Bets can only be placed during campaign window

## How It Works

### Authentication Flow

1. **Registration**: 
   - User enters username and password
   - Password is hashed (SHA-256) and stored in `users` table
   - Anonymous Supabase session is created with user data in metadata
   - User is automatically logged in and redirected to dashboard

2. **Sign In**: 
   - Username/password is checked against `users` table
   - Password hash is compared
   - If valid, anonymous Supabase session is created
   - User is logged in and redirected to dashboard

3. **Dashboard**: 
   - Reads user data from Supabase Auth session (anonymous)
   - User metadata (username, name, role) is available from `auth.user.user_metadata`
   - Uses `supabase.auth.getUser()` to check authentication

### Campaign-Based Betting Flow

1. **Super Admin creates game**:
   - Adds game details (teams, odds, league)
   - Sets `campaign_start_at` (when betting opens)
   - Sets `campaign_end_at` (when betting closes)

2. **During campaign window**:
   - Users can see the game on dashboard
   - Users can place bets on the game
   - RLS policy ensures bets can only be placed during campaign window

3. **After campaign ends**:
   - Users can see their bets (amount, status)
   - Users cannot place new bets (RLS blocks it)
   - Super admin can update game results and settle bets

## Database Schema

### Users Table
- `id` (Primary Key)
- `username` (VARCHAR, UNIQUE) - Username for login
- `password_hash` (TEXT) - SHA-256 hashed password
- `name` (VARCHAR) - Full name
- `role` (TEXT) - 'user' or 'super_admin'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Games Table
- `id` (Primary Key)
- `title` (TEXT) - Game title
- `team1`, `team2` (TEXT) - Team names
- `odds1`, `odds2` (TEXT) - Betting odds
- `league` (TEXT) - League name
- `status` (TEXT) - 'upcoming' | 'live' | 'finished'
- `game_start_at` (TIMESTAMPTZ) - Actual game start time
- `campaign_start_at` (TIMESTAMPTZ) - When betting opens
- `campaign_end_at` (TIMESTAMPTZ) - When betting closes
- `winner` (TEXT) - 'team1' | 'team2' | 'draw' | null
- `created_by` (BIGINT) - Super admin user ID
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Bets Table
- `id` (Primary Key)
- `user_id` (BIGINT) - References users.id
- `game_id` (BIGINT) - References games.id
- `bet_on` (TEXT) - 'team1' | 'team2'
- `amount` (NUMERIC) - Bet amount
- `status` (TEXT) - 'pending' | 'won' | 'lost' | 'cancelled'
- `payout` (NUMERIC) - Payout amount
- `created_at` (TIMESTAMPTZ)

## Testing

1. Register with any username (e.g., `johndoe`, `demo123`)
2. Data will be stored in `users` table
3. You'll be automatically logged in and redirected to dashboard
4. Sign out and sign in again with same username/password
5. Create a super admin account and test game creation
6. Test betting during campaign window

## Security Notes

- Passwords are hashed using SHA-256 (for demo purposes)
- RLS policies enforce data access rules
- Only super_admin can create/manage games
- Users can only place bets during campaign window
- Users can only see their own bets

