# jak3chambers.github.io

```
index.html        home page (must stay at the root for GitHub Pages)
html/             every other page (messages, staff, sites, cat, corner)
js/               scripts
css/              styles
config/           the files you edit: bugs, bugs (Catalan), mascot, staff
media/            ALL images / gifs; media/mudkip/ holds the 3D model texture + files
reference/        saved copies of other sites and old zips (not used by the site)
```

- Pages inside `html/` set `<base href="../">`, so every path in the code is written from the
  site root (`media/bob.png`, `js/nav.js`, ...), no matter which folder the page is in.
- To add a bug: drop the image in `media/` and add a line in `config/bugs-config.js`.
- To add a page: put it in `html/` (copy an existing one, keep the `<base>` line) and add one
  line to `js/nav.js`.
- The "I was here" wall (`html/messages.html`) currently saves in the visitor's own browser only.
