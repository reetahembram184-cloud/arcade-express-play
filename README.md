# Play Arcade Hub

MASTER PROMPT — HTML MINI GAME PLATFORM

Build a complete, modern, mobile-first HTML5 mini-game platform called OP Play Games.

The platform should contain 10 playable browser games, a home page, game pages, score system, advertisement flow, developer dashboard, game embed/link generation system, authentication, database integration, and an admin-ready architecture.

Use a clean, modern gaming UI with smooth animations and responsive design.

1. TECHNOLOGY

Use:

React + TypeScript

Tailwind CSS

Modern component-based architecture

Supabase for authentication and database

HTML5 Canvas where appropriate for games

Responsive design for Android, iPhone, tablet and desktop

PWA-friendly structure

Modular game architecture so new games can be added later

Do not use copyrighted game assets, characters, logos or sounds.

Use original/simple graphics created with CSS, SVG, Canvas or open-source-safe assets.

2. BRAND

Website name:

OP Play Games

Tagline:

Play. Score. Have Fun.

Primary navigation:

Home

Games

Leaderboard

Developer

About

Mobile navigation should have:

Home

Games

Leaderboard

Developer

Use a gaming-style but clean interface.

3. HOME PAGE

Create a beautiful landing page.

Hero section:

Title:

Play Free Mini Games Online

Subtitle:

Fast, fun and addictive browser games — no installation required.

Buttons:

Play Games

Developer Portal

Below hero:

Popular Games

Show game cards with:

Game thumbnail

Game name

Short description

Best score

Play button

Show at least 6 featured games.

Then:

All Games

Display all 10 games in responsive cards.

Then:

Why OP Play?

Cards:

Free to Play

Mobile Friendly

No Installation

Fast Games

Developer Embed System

Then:

Developer Section

Heading:

Add OP Play Games to Your Website

Description:

Developers can generate an authorized embed link for selected games and add the game to their own website.

Button:

Open Developer Portal

4. 10 GAMES

Create exactly these initial games.

GAME 1 — CAR RACE

Game type:

Endless car racing.

Gameplay:

Player controls a car.

Road scrolls vertically.

Enemy cars appear randomly.

Player moves left/right.

Avoid collisions.

Score increases with distance.

Game speed gradually increases.

Game ends when player crashes.

Controls:

Mobile:

Left button

Right button

Desktop:

Arrow Left

Arrow Right

Display:

Score

High Score

Current Speed

Pause button

Game over screen:

Final Score

Best Score

Play Again

Back to Games

5. GAME 2 — COLOUR MATCH

Gameplay:

Show a target colour.

Multiple coloured buttons appear.

Player must select the correct colour before the timer ends.

Each correct answer:

+10 points

Wrong answer:

Lose one life.

Features:

30-second round

3 lives

Increasing difficulty

Combo multiplier

Display:

Score

Lives

Timer

Combo

6. GAME 3 — BUBBLE SHOOTER

Create a simple original HTML5 bubble-shooter game.

Gameplay:

Player shoots coloured bubbles.

Match 3 or more same-colour bubbles.

Matched bubbles disappear.

Score increases.

Difficulty increases.

Controls:

Touch drag on mobile

Mouse on desktop

Display:

Score

Level

Remaining bubbles

Do not copy artwork or level designs from existing commercial games.

7. GAME 4 — FRUIT CATCH

Gameplay:

Fruits fall from the top.

Player controls a basket at the bottom.

Catch fruits to earn points.

Different fruits:

Apple

Orange

Banana

Watermelon

Strawberry

Avoid bombs or dangerous objects.

Scoring:

Normal fruit:

+10

Rare fruit:

+20

Missed fruit:

No points

Bomb:

Game ends.

Controls:

Mobile:

Drag basket.

Desktop:

Arrow keys.

Display:

Score

Lives

High Score

8. GAME 5 — BRICK BREAKER

Classic-style original brick-breaking game.

Player controls paddle.

Ball destroys blocks.

Features:

Multiple levels

Increasing speed

Score

Lives

Power-ups

Power-ups:

Bigger paddle

Extra ball

Slow ball

Keep visuals original and simple.

9. GAME 6 — MEMORY MATCH

Create a card memory game.

Gameplay:

Cards are face down.

Player flips two cards.

Matching pair remains open.

Non-matching cards flip back.

Difficulty:

Easy:

4 pairs

Medium:

6 pairs

Hard:

8 pairs

Display:

Score

Moves

Timer

Level

10. GAME 7 — SPACE DODGE

Create an original space-dodging game.

Player controls a small spaceship.

Objects fall from the top.

Avoid obstacles.

Score increases over time.

Controls:

Mobile:

Left/right touch controls.

Desktop:

Arrow keys.

Features:

Increasing speed

High score

Pause

Game over

Restart

Use original vector/CSS/Canvas graphics.

11. GAME 8 — NUMBER RUSH

Gameplay:

Numbers appear on screen.

Player must tap numbers in the correct order.

Example:

1 → 2 → 3 → 4 → 5

Difficulty increases.

Features:

Timer

Score

Combo

Levels

12. GAME 9 — TAP THE TARGET

A target appears randomly on the screen.

Player must tap it quickly.

Each successful hit:

+10 points

Target becomes smaller and faster.

Features:

30-second mode

Score

Accuracy

Combo

Best score

Make it highly responsive on mobile.

13. GAME 10 — WORD SCRAMBLE

Display scrambled letters.

Player must form the correct word.

Example:

"PPALA"

Answer:

"APPLE"

Features:

Multiple rounds

Timer

Score

Hints

Increasing difficulty

Use a built-in word list.

14. GAME ARCHITECTURE

Create a reusable game system.

Each game should have:

unique game ID

slug

title

description

thumbnail

category

game component

score system

high-score storage

game instructions

difficulty

status

Create a reusable GameEngine/GameWrapper where practical.

Every game should expose:

startGame()

pauseGame()

resumeGame()

restartGame()

endGame()

submitScore()

15. GAME PAGE

URL structure:

/games

/game/car-race

/game/colour-match

/game/bubble-shooter

/game/fruit-catch

/game/brick-breaker

/game/memory-match

/game/space-dodge

/game/number-rush

/game/tap-target

/game/word-scramble

Game page layout:

Top:

Back button

Game title

Score

Center:

Game canvas/container.

Below:

How to Play

Controls

Best Score

Game Description

16. AD FLOW

Implement an advertisement system with reusable ad slots.

IMPORTANT:

Do not fake ad clicks or incentivize users to click advertisements.

Use placeholder ad containers until a real ad provider is configured.

Flow:

User clicks:

PLAY GAME

Then:

Open pre-game ad/interstitial placeholder.

Show countdown if required.

After the ad flow completes, show:
Continue to Game

Start the game.

Create these components:

PreGameAd

BannerAd

InterstitialAd

PostGameAd

The system should support future integration with a legitimate ad provider.

Do not automatically click advertisements.

Do not claim that an advertisement was viewed unless the actual ad provider reports it.

17. BANNER ADS

Game page:

Show banner slot above the game.

Optional banner slot below the game.

Home page:

Allow a banner slot between sections.

Use responsive ad containers.

Example placeholder:

ADVERTISEMENT

Do not make fake advertisements look like real advertisements.

18. DEVELOPER PORTAL

Create a dedicated:

/developer

page.

Developer dashboard should contain:

Overview

My Games

Generate Embed

Embed Links

Analytics

API/Integration

Account Settings

Authentication required.

Use Supabase Auth.

19. DEVELOPER REGISTRATION

Allow:

Sign up

Login

Logout

Password reset

Developer profile:

Name

Email

Developer ID

Created date

Use secure Supabase authentication.

Never store plaintext passwords.

20. EMBED GAME SYSTEM

This is a major feature.

Developers should be able to select a game and generate an embed integration.

Example generated iframe:

Do not hardcode the actual domain.

Use environment configuration for the production domain.

Each generated embed should have:

embed ID

developer ID

game ID

secure random token

created date

expiration date optional

status

allowed domain optional

21. EMBED PAGE

Create:

/embed/:gameSlug/:token

This page should show ONLY the selected game.

Hide:

Main website navigation

Footer

Developer dashboard

Unnecessary content

Show:

Game

Score

Restart

Minimal branding

Make it suitable for iframe embedding.

22. EMBED SECURITY

Implement basic embed security.

Each token must belong to a developer and game.

Validate:

token exists

token active

game active

developer account active

Allow developer to optionally specify allowed domains.

Example:

example.com

If allowed-domain verification is implemented, reject unauthorized origins.

Do not rely only on frontend validation.

All important validation must happen server-side/Supabase-side where possible.

23. EMBED GENERATOR UI

Developer selects:

Game:

[Select Game]

Then:

Embed width:

Responsive / Custom

Embed height:

600px

Optional:

Allowed domain

Then button:

Generate Embed

Show:

Your Embed Code

Code block containing iframe code.

Buttons:

Copy Code

Preview

Disable Link

Regenerate Token

Also generate a direct embed URL.

24. EMBED LINK MANAGEMENT

Developer dashboard should show a table:

Game | Status | Created | Plays | Actions

Actions:

Preview

Copy

Disable

Regenerate

Disabled links must stop working.

25. SCORE SYSTEM

Users should be able to play without creating an account.

Store local high scores in localStorage.

If authentication is available, also save scores to Supabase.

Score table:

scores

Fields:

id

user_id nullable

game_id

score

duration

created_at

Prevent obviously invalid scores with basic server-side validation.

Do not trust only client-submitted score values for competitive leaderboards.

26. LEADERBOARD

Create:

/leaderboard

Tabs:

All Games

Car Race

Colour Match

Bubble Shooter

Fruit Catch

Brick Breaker

Memory Match

Space Dodge

Number Rush

Tap Target

Word Scramble

Show:

Rank | Player | Score

If user is not logged in, display:

Guest Player

Do not expose private user information.

27. DATABASE

Use Supabase PostgreSQL.

Create these tables.

profiles

Fields:

id UUID primary key

email

display_name

avatar_url

role

created_at

updated_at

Roles:

user

developer

admin

games

Fields:

id UUID primary key

slug unique

name

description

category

thumbnail_url

instructions

is_active

created_at

updated_at

scores

Fields:

id UUID primary key

user_id nullable

game_id

score

duration

created_at

developer_profiles

Fields:

id UUID primary key

user_id

developer_name

developer_id unique

created_at

updated_at

embed_tokens

Fields:

id UUID primary key

developer_id

game_id

token unique

status

allowed_domain nullable

created_at

expires_at nullable

last_used_at nullable

embed_events

Fields:

id UUID primary key

embed_token_id

game_id

event_type

origin nullable

created_at

game_sessions

Fields:

id UUID primary key

user_id nullable

game_id

embed_token_id nullable

started_at

ended_at nullable

score nullable

28. DATABASE SECURITY

Use Supabase Row Level Security.

Users:

Can read public active games.

Can create their own scores.

Can read their own private profile.

Developers:

Can read/update their own developer profile.

Can create their own embed tokens.

Can read/update their own embed tokens.

Can view their own embed analytics.

Users must NOT be able to:

Modify another developer's token.

Modify another user's profile.

Change leaderboard scores directly.

Access private developer information.

Admins should have separate permissions.

29. ANALYTICS

Developer dashboard should show:

Total Plays

Active Embeds

Total Games

Top Game

Plays Today

Plays This Week

Charts:

Plays over time

Games by popularity

Analytics should be based on embed_events/game_sessions.

Do not collect unnecessary personal information.

30. ADMIN-READY SYSTEM

Create an admin route:

/admin

Only role = admin can access it.

Admin dashboard:

Total Users

Developers

Games

Plays

Active Embeds

Admin can:

Enable/disable games

View users

View developers

View embeds

View game statistics

Do not create a public admin registration.

31. DESIGN

Use a polished gaming interface.

Style:

Dark modern gaming theme

Rounded cards

Subtle gradients

Smooth hover effects

Glass-like panels where appropriate

Clear typography

Large touch-friendly buttons

Responsive layouts

Do not overload the UI with animations.

Prioritize performance.

32. MOBILE DESIGN

Most users may be on mobile.

Optimize for:

Android browsers

iPhone Safari

Chrome

Small screens

Game controls must be touch-friendly.

Prevent accidental page scrolling while playing canvas games.

Use responsive sizing.

33. ACCESSIBILITY

Include:

Keyboard controls

Visible focus states

Accessible buttons

ARIA labels where appropriate

Sufficient contrast

Reduced-motion support

34. PERFORMANCE

Games should:

Use requestAnimationFrame for animation

Avoid unnecessary React re-renders

Clean up event listeners

Stop animation loops when game is paused/unmounted

Lazy-load game components where appropriate

35. ERROR HANDLING

Create friendly error states.

Examples:

Game unavailable

"Sorry, this game is temporarily unavailable."

Invalid embed

"This embed link is invalid or has been disabled."

Expired embed

"This embed link has expired."

Authentication error

"Unable to sign in. Please try again."

36. ROUTES

Implement:

/

/games

/games/:slug

/leaderboard

/developer

/developer/login

/developer/register

/developer/dashboard

/developer/embeds

/developer/generate

/developer/analytics

/developer/settings

/embed/:gameSlug/:token

/admin

37. GAME DATA

Seed the database with all 10 games:

Car Race

Colour Match

Bubble Shooter

Fruit Catch

Brick Breaker

Memory Match

Space Dodge

Number Rush

Tap the Target

Word Scramble

Each game must be playable.

Do NOT create fake buttons that do nothing.

38. GAME START FLOW

For normal website gameplay:

User:

Home → Game → Play Game

Then:

Play Game

↓

Pre-game advertisement slot

↓

Continue

↓

Game starts

↓

Game over

↓

Score shown

↓

Play Again / Back to Games

For embed gameplay:

Embed page loads

↓

Optional pre-game advertisement slot

↓

Game starts

Keep the embed experience compact.

39. AD CONFIGURATION

Create an ad configuration system so the ad provider can be added later.

Environment variables should be used for provider configuration.

Do not put secret API keys directly in frontend source code.

Create reusable configuration such as:

adProvider

bannerAdUnit

interstitialAdUnit

enableAds

If ads are disabled, games should continue normally.

40. DEVELOPER EMBED DOCUMENTATION

Create a documentation section:

How to Embed a Game

Step 1:

Create a developer account.

Step 2:

Select a game.

Step 3:

Generate an embed link.

Step 4:

Copy the iframe code.

Step 5:

Paste it into your website HTML.

Example:

<iframe
  src="YOUR_GENERATED_EMBED_URL"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen>
</iframe>


Explain that the generated token controls access to the embed.

41. IMPORTANT SECURITY RULES

Never expose:

Supabase service-role key

private API keys

admin secrets

Frontend must use only public client configuration.

Use environment variables.

Use server-side functions for sensitive operations.

Validate embed tokens server-side.

Use RLS policies.

42. FINAL UI DETAILS

Create polished empty states.

Loading states:

Skeleton cards

Loading spinner where appropriate

Toast messages:

Embed generated

Code copied

Link disabled

Score saved

Login successful

Confirmation dialogs:

Disable embed?

Regenerate token?

43. SEO

Add:

Page titles

Meta descriptions

Open Graph metadata

Game-specific metadata

Semantic HTML

Example title:

OP Play Games — Free Online Mini Games

Game title:

Car Race — Play Free Online | OP Play Games

44. PWA

Prepare the application for PWA support.

Include:

manifest

icons placeholders

theme color

installable structure

Do not make installation mandatory.

45. IMPORTANT IMPLEMENTATION RULE

Build the application as a REAL working application, not a static mockup.

All navigation must work.

All 10 games must actually be playable.

Developer authentication must work.

Database integration must work.

Embed token generation must work.

Embed pages must work.

Score saving must work where supported.

Leaderboard must work.

Do not leave major buttons as placeholders.

If a feature requires an external service that cannot be configured automatically, create a clean configuration layer and clearly mark the required environment variables.

46. DEVELOPMENT PRIORITY

Build in this order:

Project foundation

Supabase connection

Database schema

Authentication

Game data

Game components

Game pages

Score system

Leaderboard

Advertisement components

Developer dashboard

Embed token generation

Embed pages

Analytics

Admin-ready permissions

Responsive/mobile polish

SEO/PWA

Testing and bug fixing

47. FINAL REQUIREMENT

After implementation, verify:

All 10 games load.

All games can start.

All games can end/restart.

Scores update correctly.

High scores work.

Login/register works.

Developer dashboard works.

Embed token generation works.

Generated iframe opens the correct game.

Disabled embed links stop working.

Invalid tokens show an error.

Mobile layout works.

Desktop layout works.

No secret keys are exposed.

RLS is enabled.

No copyrighted game assets are used.

Make the final result feel like a real gaming platform rather than a basic demo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://arcade-express-play.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cffa0cb3-6c4d-4f82-82da-583926dd7e80).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
