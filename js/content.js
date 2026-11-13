/* ============================================================================
   content.js — EVERYTHING PERSONAL LIVES HERE.
   Edit the text below; no other file needs to change.

   Rules of this file:
   - Plain text only. No code required.
   - Empty strings ("") are hidden or fall back to neutral defaults.
   - Keep everything original — no franchise text, characters or branding.
   ========================================================================== */

export const CONTENT = {
  meta: {
    // Browser tab title.
    title: "A Birthday in Another World",
  },

  /* The first screen, before entering. */
  opening: {
    line1: "Some days deserve their own universe.",
    line2: "A little world created just for you.",
    button: "Enter Your World",
  },

  /* Landing after the transition. */
  hero: {
    kicker: "Under a dragon's moon",
    // Her name. Leave "" to hide the name line.
    name: "Lamar",
    title: "Happy Birthday",
    subtitle: "Welcome to yours.",
    cue: "Scroll — the night opens below",
  },

  /* The 3D realm — a dragon, the moon, distant spires. */
  realm: {
    kicker: "Chapter I — The Open Sky",
    title: "A World That Flies With You",
    note: "Drag to look around.",
    paragraphs: [
      "Somewhere between the mountains and the moon, a dragon rides the night currents — unhurried, unbothered, entirely at home.",
      "This sky was made for you to wander.",
    ],
  },

  /* Her: doctor, curly hair, Fourth Wing reader, husky companion. */
  her: {
    kicker: "Chapter II — Her World",
    title: "The Healer and Her Wolf",
    // Drop a photo in assets/images/ and point to it, e.g. "assets/images/her.jpg".
    // Leave "" to keep the painted illustration.
    photo: "",
    alt: "A woman with wild curls in dark fantasy robes beside a moonlit husky",
    paragraphs: [
      "A healer by daylight — reading dragon-rider tales by candlelight, a husky watching the door like it's sworn to guard her.",
      "The emblem she carries is older than any crown: to mend, to steady, to keep people alive and whole.",
    ],
  },

  /* Him: curly hair, olive skin. The two together under the moon. */
  us: {
    kicker: "Chapter III — Two Silhouettes",
    title: "Written Under the Same Moon",
    // A photo of the two of you, e.g. "assets/images/us.jpg". "" keeps the painting.
    photo: "",
    alt: "Two silhouettes standing together under a giant moon with a husky beside them",
    paragraphs: [
      "And somewhere in that world, someone who would cross it just to stand beside her.",
    ],
  },

  /* Photo gallery. Real photographs drop in later. */
  gallery: {
    kicker: "Chapter IV — The Memory Hall",
    title: "Small Windows, Held",
    // For each item:
    //   src     — path to a photo you add, e.g. "assets/images/memory-1.jpg".
    //             Leave "" to keep the painted placeholder.
    //   caption — text under the photo. Leave "" to hide it.
    //   alt     — short description for screen readers.
    items: [
      { src: "assets/images/memory-1.jpeg", caption: "", alt: "Memory one" },
      { src: "assets/images/memory-2.jpeg", caption: "", alt: "Memory two" },
      { src: "assets/images/memory-3.jpeg", caption: "", alt: "Memory three" },
      { src: "assets/images/memory-4.jpeg", caption: "", alt: "Memory four" },
      { src: "assets/images/memory-5.jpeg", caption: "", alt: "Memory five" },
      { src: "assets/images/memory-6.jpeg", caption: "", alt: "Memory six" },
      { src: "assets/images/memory-7.jpeg", caption: "", alt: "Memory seven" },
    ],
  },

  /* The cake — twenty-one candles in the dark, before the letter. */
  cake: {
    kicker: "Chapter V — The Wish",
    title: "Twenty-One Flames",
    blowLabel: "Blow out the candles",
    relightLabel: "Light them again",
    wish: "Make a wish — it's already on its way.",
  },

  /* The letter. Supports line breaks and paragraphs — separate them with
     blank lines or add more entries to the array. */
  letter: {
    kicker: "Chapter VI — By Candlelight",
    heading: "A few words for you…",
    // REPLACE THIS with your real letter. Each array entry is one paragraph.
    paragraphs: [`To Lamar, on your birthday. ❤️

Happy birthday, my dearest Lamar.

I have been trying to find the right words to write to you, but somehow, words never seem enough when it comes to you.

I hope life is gentle with you. I hope it gives you countless reasons to smile, beautiful mornings to wake up to, peaceful nights to fall asleep through, and little moments that remind you how wonderful it is to be alive.

I hope you never lose the beautiful things that make you who you are. Your little habits, your smile, your laughter, your dreams, and all those tiny details that perhaps you don’t even realize make you so special.

I made you this little world because I wanted to give you something different. Somewhere you could wander, explore, and perhaps recognize a little piece of yourself in every chapter. Some feelings are difficult to put into ordinary words, so I tried to turn them into a story instead.

And if there’s one thing I wish for you, it’s that you never settle for a life that doesn’t make your heart feel full. You deserve tenderness, happiness, comfort, and every beautiful thing this world has to offer.

I hope you know that you are still incredibly special to me. I still treasure our conversations, our laughter, our silly moments, our games, our little disagreements, and even the simplest things we used to do together.

I never want you to doubt how much happiness I wish for you, how much I admire the person you are, or how deeply I care about you.

I hope this new year of your life brings you closer to everything you’ve ever dreamed of becoming.

And whenever you look at the moon, I hope you remember that somewhere beneath that same sky, there’s someone who wishes you nothing but happiness.

Happy birthday, Lamar.

May your world always have a little magic in it. May your heart always find its way to happiness, and may life be as beautiful to you as you deserve.`],
    signature: "Jad ❤️",
    signatureName: "The penguin",
  },

  /* The ending. */
  finale: {
    line1: "Happy Birthday, Lamar.",
    line2: "May your next chapter be as extraordinary as the world you carry within you.",
    line3: "Some people make the world a little more magical just by being in it.",
    replayLabel: "Relive the beginning",
    burstLabel: "Light the sky",
    scorpionLabel: "Meet the 3aqrob",
    penguinLabel: "Meet Batriqi",
    huskyLabel: "Meet Zoe",
    dragonLabel: "Lamar's Dragon",
  },

  footer: {
    line: "A small universe, built for one person.",
  },

  /* Dot navigation labels (hover text). */
  nav: {
    opening: "Opening",
    realm: "The Sky",
    her: "Her World",
    us: "Together",
    gallery: "Memories",
    cake: "The Cake",
    letter: "The Letter",
    finale: "Finale",
  },
};
