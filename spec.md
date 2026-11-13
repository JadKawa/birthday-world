PROJECT: A BIRTHDAY IN ANOTHER WORLD

A cinematic, interactive, dark-fantasy romantic birthday website

Act as a senior creative frontend developer, 3D web designer, motion designer, and UI/UX expert.

I want you to build an exceptionally beautiful, cinematic, interactive birthday website for someone very special to me.

This is NOT a generic birthday website. I want it to feel like entering a magical fantasy world, with a sophisticated dark aesthetic, emotional storytelling, immersive animations, and carefully designed interactions.

The visual atmosphere should take inspiration from the fantasy worldbuilding and dragon-rider aesthetic of the Fourth Wing book series by Rebecca Yarros, without copying its copyrighted text, artwork, characters, or official branding.

The result should look like a professional award-winning interactive experience.

⸻

1. TECHNICAL REQUIREMENTS

Build the entire project using:

* HTML5
* CSS3
* Vanilla JavaScript
* Three.js for 3D scenes and models
* GSAP for advanced animations, if appropriate
* Google Fonts for typography

Requirements:

* Must run locally on Windows using VS Code.
* Must work with the VS Code Live Server extension.
* Must be responsive on phones, tablets, and desktop computers.
* Must be compatible with modern Chrome, Safari, and Edge.
* Must eventually be shareable through a temporary Cloudflare Tunnel URL.
* Do not require a database or backend.
* Do not require users to install anything.
* Avoid unnecessary frameworks and complicated dependencies.
* Use modular, clean, well-commented code.

Use CDN imports where appropriate, but make sure all dependencies work correctly.

Create a complete project structure and explain how to run it.

2. VISUAL IDENTITY

The entire experience should have a midnight fantasy aesthetic.

Color palette:

* Obsidian black: #09090D
* Deep charcoal: #15151D
* Dark burgundy: #481B2B
* Antique gold: #C6A66B
* Muted silver: #A6A8B0
* Soft moonlight white: #EAE7E1

Visual elements:

* Deep star-filled skies.
* Subtle moving galaxies and nebulae.
* Glowing particles and magical dust.
* Floating embers.
* Moonlight effects.
* Dark medieval architecture.
* Ancient stone textures.
* Elegant gold borders and details.
* Cinematic lighting.
* Smooth transitions between scenes.

Typography should combine an elegant fantasy serif font for headings with a clean modern font for body text.

The website should feel luxurious, mysterious, romantic, and emotionally meaningful.

Avoid excessive pink, childish hearts, cartoon graphics, and generic birthday decorations.

3. THE OPENING EXPERIENCE

The first screen should be immersive.

Imagine a dark night sky with thousands of tiny stars.

A mysterious dragon silhouette slowly flies across the distant moon.

Particles gently float through the atmosphere.

In the center, display:

“Some days deserve their own universe.”

Below it:

“A little world created just for you.”

Then a beautiful glowing button:

“ENTER YOUR WORLD”

When clicked:

* Play a subtle cinematic transition.
* The camera should appear to travel through the stars.
* The background should transform into the main experience.
* Reveal the birthday message gradually.

Include an optional sound toggle. Never autoplay music with sound.

4. THE DRAGON WORLD — 3D EXPERIENCE

This is one of the most important parts.

Create an impressive Three.js 3D scene.

Include:

* A majestic dragon flying slowly through a dark starry sky.
* Realistic wings with animated movement.
* Subtle glowing eyes.
* Atmospheric fog.
* Moonlight illuminating its silhouette.
* A beautiful mountain or castle silhouette in the distance.

The dragon should feel majestic and elegant rather than frightening.

Allow the user to slightly rotate the scene using mouse or touch interaction.

Use optimized 3D models if available.

If a suitable model cannot be loaded, create an attractive procedural dragon silhouette using Three.js geometry rather than leaving an empty scene.

Make sure the 3D scene degrades gracefully on mobile devices.

5. A PERSONALIZED SECTION — HER WORLD

I want this section to represent her.

She is:

* A doctor.
* Has beautiful curly hair.
* Has a white complexion.
* Loves the Fourth Wing book series.
* Has a husky dog.

Create a fantasy-inspired character portrait or 3D representation of a woman with curly hair, wearing an elegant dark fantasy outfit.

Do not make her look like a generic princess.

Include subtle references to medicine, such as an elegant medical symbol or a glowing medical emblem integrated into the fantasy world.

Her husky should appear as her loyal fantasy companion, standing beside her in a moonlit environment.

The husky should have realistic fur, recognizable facial markings, and beautiful blue or icy-colored eyes.

The entire scene should feel like a fantasy illustration brought to life.

6. A CHARACTER REPRESENTING ME

I also want a subtle representation of myself.

My characteristics:

* Curly hair.
* Neutral olive skin tone.

Create a male fantasy character with these characteristics.

He should wear a sophisticated dark fantasy outfit.

The two characters can appear together in a cinematic scene, perhaps standing under a massive moon with the husky beside them.

The characters should look elegant and natural, not exaggerated.

Do not make them resemble copyrighted characters from existing franchises.

7. THE MEMORY GALLERY

Create an interactive photo gallery.

I will provide real photographs later.

Requirements:

* Beautiful floating polaroid-style photographs.
* Dark backgrounds with subtle gold borders.
* Smooth image transitions.
* Click-to-expand functionality.
* Elegant captions underneath each photograph.
* Optional timeline layout.

Include clearly named image placeholders so I can replace them with my own pictures.

Do not invent personal memories, dates, locations, or captions.

Use placeholder text that is easy to edit.

8. THE LETTER

Create a beautiful interactive letter section.

The background should resemble an ancient letter or magical parchment illuminated by candlelight.

Display a heading:

“A few words for you…”

The letter should appear through a slow typewriter animation.

Use this placeholder text:

“[WRITE YOUR PERSONAL BIRTHDAY LETTER HERE]”

I want to be able to replace the text easily without touching the website’s main code.

The letter should support line breaks and paragraphs.

9. THE BIRTHDAY FINALE

The final section should feel unforgettable.

Create a cinematic scene featuring:

* A huge glowing moon.
* A dragon flying across the sky.
* Beautiful golden particles.
* A subtle magical explosion of light.
* Elegant animated typography.

Display:

“Happy Birthday.”

Then:

“May your next chapter be as extraordinary as the world you carry within you.”

Finish with:

“Some people make the world a little more magical just by being in it.”

Make this ending beautiful, emotional, and memorable.

10. INTERACTIONS AND DETAILS

Include:

* Smooth scrolling.
* Custom cursor effects on desktop.
* Subtle parallax movement.
* Animated transitions.
* Interactive 3D elements.
* A navigation menu that does not distract from the experience.
* A music toggle.
* A loading screen.
* A progress indicator.
* Mobile-friendly touch interactions.
* A replay option for the opening animation.

Do not overuse animations. Everything should feel intentional and polished.

11. PERFORMANCE AND QUALITY

This is extremely important.

* Optimize all 3D models.
* Compress images.
* Use lazy loading.
* Avoid unnecessary rendering.
* Limit particle counts on mobile.
* Respect reduced-motion accessibility settings.
* Include graceful fallbacks if a 3D model or external asset fails.
* Avoid broken images and missing assets.
* Ensure there are no JavaScript console errors.
* Ensure every button actually works.
* Do not use fake buttons or unfinished sections.

12. PROJECT STRUCTURE

Create a clean structure similar to:

birthday-world/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── dragon.js
│   ├── animations.js
│   └── gallery.js
├── assets/
│   ├── images/
│   ├── models/
│   ├── audio/
│   └── fonts/
└── README.md

You can improve this structure if necessary.

13. HOW I WANT YOU TO WORK

Do not give me a short tutorial or a few disconnected code snippets.

I want the actual complete working project.

Work in stages:

1. Establish the complete visual design and architecture.
2. Create all required files.
3. Implement the 3D dragon scene.
4. Implement the personal character and husky scene.
5. Implement the photo gallery and letter.
6. Implement the cinematic finale.
7. Test and fix the entire experience.
8. Give me precise instructions for running the project in VS Code.

If you have access to a coding workspace, create the actual project files there.

If you cannot create files directly, give me each complete file separately, with its exact filename and contents.

Never omit code with comments such as “// implement the rest here”.

Do not leave unfinished TODOs.

Prioritize visual quality over unnecessary complexity.

The final result should feel like a professionally designed interactive fantasy birthday experience, not a basic HTML birthday card.

Make creative decisions yourself where appropriate. I want to be genuinely impressed.

i want to make it perfectly this way ... with the help of windsurf give me a step by step commands for windsurf to do it asap !!!! i want it to work as best as possible 
