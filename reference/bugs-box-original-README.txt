BUGS BOX  (extracted from 28awesomebugs.org)
============================================

FILES
  bugs-config.js   <- EDIT THIS: bug count, size, gravity/bounce, and the list of
                      bugs (image + name + story + birthday)
  bugs-box.css     <- the look (ball shape, shiny, click popup)
  bugs-box.js      <- physics, drag-and-throw, click popup (no libraries needed)
  index.html       <- demo page showing how to drop it in
  src/             <- bug images. Only bug1.png was in your offline download.

ADDING IT TO ANOTHER PAGE (3 steps)
  1. Copy this whole folder (or just the 3 bugs-* files + src/) into your site.
  2. In the page <head>:     <link rel="stylesheet" href="bugs-box.css">
  3. Where you want the box: <div style="height:480px"><div class="bugs-container"></div></div>
     Before </body>:         <script src="bugs-config.js"></script>
                             <script src="bugs-box.js"></script>
     (fix the paths if the files live in a subfolder, e.g. "bugs-box/bugs-box.css")

  The box fills its parent, so the parent needs a height.

IMAGES
  Paths in bugs-config.js (like "src/bug2.jpeg") are relative to the PAGE that
  loads them, not to the config file. Your offline zip only contained bug1.png,
  so every other bug shows as a coloured circle with its initial until you copy
  the real images over from the live site into src/ (keep the same file names,
  or change the "image" paths in bugs-config.js).

CHANGING THINGS
  - Fewer/more bugs:  count in bugs-config.js
  - Floaty / heavy:   gravity, bounciness, friction
  - Your own bugs:    edit/replace the entries in the bugs: [ ... ] list
  - Turn off click popup / dragging:  clickInfo: false / drag: false
  - Colours/size of the popup: bottom half of bugs-box.css (.bug-info-box)
  - Several boxes on one page, or settings per box:
        BugsBox.init(document.querySelector('#myBox'), { gravity: 0, count: 10 });
