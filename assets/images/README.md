# Drop your photos here

Then reference them in `js/content.js` → `gallery.items`:

```js
{ src: "assets/images/memory-1.jpg", caption: "…", alt: "…" },
```

Leave `src: ""` to keep the painted placeholder. If a photo fails to load,
the placeholder art appears automatically — nothing breaks.
