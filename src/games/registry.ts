import { lazy } from "react";
import type { GameComponent } from "./types";

export interface GameMeta {
  slug: string;
  title: string;
  short: string;
  description: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  controls: string[];
  howToPlay: string[];
  accent: string;
  status: "live";
  Component: GameComponent;
}

export const GAMES: GameMeta[] = [
  {
    slug: "car-race",
    title: "Car Race",
    short: "Endless highway dodging",
    description:
      "Dodge traffic on an endless scrolling highway. The longer you survive the faster it gets — chase your personal best distance.",
    category: "Arcade",
    difficulty: "Medium",
    controls: ["Arrow Left / Arrow Right", "On-screen left & right buttons", "Drag to steer"],
    howToPlay: [
      "Your car sits at the bottom of the road.",
      "Switch lanes to avoid oncoming traffic.",
      "Score climbs with distance and speed increases over time.",
      "One collision ends the run.",
    ],
    accent: "from-primary/25",
    status: "live",
    Component: lazy(() => import("./CarRace")),
  },
  {
    slug: "colour-match",
    title: "Colour Match",
    short: "Beat the clock on colour",
    description:
      "A target colour is named, you tap the matching swatch before the timer expires. Chain correct answers for a combo multiplier.",
    category: "Puzzle",
    difficulty: "Easy",
    controls: ["Tap or click a swatch"],
    howToPlay: [
      "Read the target colour name at the top.",
      "Tap the swatch that matches it.",
      "Correct answers score 10 points times your combo.",
      "Wrong answers cost one of your three lives.",
    ],
    accent: "from-accent/25",
    status: "live",
    Component: lazy(() => import("./ColourMatch")),
  },
  {
    slug: "bubble-shooter",
    title: "Bubble Shooter",
    short: "Pop clusters of three",
    description:
      "Aim, shoot and pop clusters of three or more matching bubbles. Clear the board before the bubbles reach the bottom.",
    category: "Puzzle",
    difficulty: "Medium",
    controls: ["Move pointer or finger to aim", "Tap / click to shoot"],
    howToPlay: [
      "Aim with the guide line from the shooter.",
      "Match three or more bubbles of the same colour to pop them.",
      "Disconnected bubbles drop for bonus points.",
      "A new row descends every few shots.",
    ],
    accent: "from-chart-5/25",
    status: "live",
    Component: lazy(() => import("./BubbleShooter")),
  },
  {
    slug: "fruit-catch",
    title: "Fruit Catch",
    short: "Catch fruit, dodge bombs",
    description:
      "Fruit rains down from the top — catch it in your basket for points, but one bomb ends the run instantly.",
    category: "Arcade",
    difficulty: "Easy",
    controls: ["Drag the basket", "Arrow Left / Arrow Right"],
    howToPlay: [
      "Move the basket along the bottom of the screen.",
      "Common fruit scores 10, rare fruit scores 20.",
      "Missing fruit costs a life.",
      "Catching a bomb ends the game.",
    ],
    accent: "from-success/25",
    status: "live",
    Component: lazy(() => import("./FruitCatch")),
  },
  {
    slug: "brick-breaker",
    title: "Brick Breaker",
    short: "Paddle, ball, power-ups",
    description:
      "Bounce the ball off your paddle to clear every brick. Grab power-ups and push through faster, denser levels.",
    category: "Arcade",
    difficulty: "Medium",
    controls: ["Drag or move the mouse", "Arrow Left / Arrow Right"],
    howToPlay: [
      "Keep the ball in play with the paddle.",
      "Clear all bricks to advance a level.",
      "Catch capsules for a bigger paddle, an extra ball or a slower ball.",
      "You have three lives.",
    ],
    accent: "from-warning/25",
    status: "live",
    Component: lazy(() => import("./BrickBreaker")),
  },
  {
    slug: "memory-match",
    title: "Memory Match",
    short: "Find every pair",
    description:
      "Flip cards two at a time and remember what you saw. Fewer moves means a higher score across three difficulty levels.",
    category: "Memory",
    difficulty: "Easy",
    controls: ["Tap or click a card", "Keyboard accessible"],
    howToPlay: [
      "Flip two cards per turn.",
      "Matching pairs stay face up.",
      "Clear the board to move to a harder level.",
      "Speed and low move counts boost your score.",
    ],
    accent: "from-primary/25",
    status: "live",
    Component: lazy(() => import("./MemoryMatch")),
  },
  {
    slug: "space-dodge",
    title: "Space Dodge",
    short: "Weave through debris",
    description:
      "Pilot a tiny ship through an endless asteroid field. Survive longer, score higher, fly faster.",
    category: "Arcade",
    difficulty: "Medium",
    controls: ["Arrow Left / Arrow Right", "Drag to steer", "On-screen buttons"],
    howToPlay: [
      "Steer the ship left and right.",
      "Avoid every asteroid — one hit ends the run.",
      "Score rises the longer you survive.",
      "Near misses award a small bonus.",
    ],
    accent: "from-chart-5/25",
    status: "live",
    Component: lazy(() => import("./SpaceDodge")),
  },
  {
    slug: "number-rush",
    title: "Number Rush",
    short: "1, 2, 3 — go faster",
    description:
      "Numbers scatter across the board. Tap them in ascending order before the clock runs out and keep your combo alive.",
    category: "Puzzle",
    difficulty: "Easy",
    controls: ["Tap or click the numbers"],
    howToPlay: [
      "Find and tap 1, then 2, then 3, and so on.",
      "Each correct tap scores 10 points times your combo.",
      "Wrong taps break the combo and cost time.",
      "Finish the set to reach a harder level.",
    ],
    accent: "from-accent/25",
    status: "live",
    Component: lazy(() => import("./NumberRush")),
  },
  {
    slug: "tap-target",
    title: "Tap the Target",
    short: "30 seconds of reflexes",
    description:
      "Hit the target as fast as you can. It shrinks, moves and disappears faster the better you get.",
    category: "Reflex",
    difficulty: "Easy",
    controls: ["Tap or click the target"],
    howToPlay: [
      "A target appears somewhere on the board.",
      "Tap it before it relocates.",
      "Each hit scores 10 points times your combo.",
      "The round lasts 30 seconds — accuracy is tracked.",
    ],
    accent: "from-success/25",
    status: "live",
    Component: lazy(() => import("./TapTarget")),
  },
  {
    slug: "word-scramble",
    title: "Word Scramble",
    short: "Unscramble the letters",
    description:
      "Rearrange jumbled letters into the hidden word. Longer words and faster answers score more.",
    category: "Word",
    difficulty: "Hard",
    controls: ["Tap letter tiles", "Type with a keyboard, Enter to submit"],
    howToPlay: [
      "Letters of a hidden word are shown scrambled.",
      "Tap the tiles or type to build your answer.",
      "Submit before the round timer runs out.",
      "Three hints are available per game.",
    ],
    accent: "from-warning/25",
    status: "live",
    Component: lazy(() => import("./WordScramble")),
  },
];

export const getGame = (slug: string): GameMeta | undefined =>
  GAMES.find((g) => g.slug === slug);

export const FEATURED_SLUGS = [
  "car-race",
  "bubble-shooter",
  "fruit-catch",
  "brick-breaker",
  "tap-target",
  "memory-match",
];
