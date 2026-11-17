/* ===========================================================
   bugs-config.js  –  EDIT THIS FILE to change the bugs box.
   (load it BEFORE bugs-box.js)
   =========================================================== */
window.BUGS_CONFIG = {

  /* how many bugs are in the box at once. They're picked at random
     from the list below; if it has fewer than this, some repeat. */
  count: 28,

  /* bug size in pixels (phones use mobileSize, under 768px wide) */
  size: 150,
  mobileSize: 55,

  /* physics (these are the original site's default values) */
  gravity: 0.1,        // downward pull. 0 = floating in space
  bounciness: 0.9,     // how bouncy bug-vs-bug hits are (1 = very)
  friction: 0.9999,    // slow-down per frame (1 = never slows)
  maxSpeed: 60,        // speed limit
  speedCapEnabled: true,

  /* interactions */
  drag: true,          // grab bugs and throw them
  clickInfo: true,     // click a bug -> popup with name / story / birthday
  shinyChance: 0.00,   // chance a bug is a gold "shiny"

  /* if an image file is missing, show a coloured circle with the
     bug's initial instead of a broken-image icon */
  fallbackWhenImageMissing: true,

  /* The bugs. image = path from the site root
     (e.g. media/bob.png). name/story/birthday show in the popup. */
  bugs: [
    { image: "media/allah.png", name: "Gleeble", story: "Grew up in suburban Cincinnati. Works night shift at 24-hour pharmacy. Favorite food is gas station taquitos. Still uses Hotmail account from 2004. Dreams of opening an artisanal sock shop.", birthday: "March 12, 2001" },
    { image: "media/heylasty.png", name: "Lasty__", story: "hey lasty...", birthday: "3" },
    { image: "media/its_a_rare_one.jpg", name: "leo", story: "Third-generation stamp collector. Works at DMV. Favorite drink is room temperature pilk. Takes pride in alphabetizing soup cans. Once waited 45 minutes to make a left turn.", birthday: "November 3, 2002" },
    { image: "media/thekip.png", name: "Cottage CHEESE", story: "Born and raised in a Walmart parking lot. Assistant manager at Staples. Favorite hobby is organizing cables by length. Has memorized every PIN they've ever had. Refuses to eat foods that touch. Gonna climb the corporate ladder one day. Maybe I think.", birthday: "February 28, 2004" },
    { image: "media/notmusic.jpg", name: "Bumbledorf", story: "Former child. Currently testing mattresses professionally. Favorite activity is watching paint dry. Keeps detailed spreadsheets of laundry loads. Has never successfully parallel parked.", birthday: "June 15, 2003" },
    { image: "media/dante.gif", name: "Stolen McValor", story: "Got a degree in underwater basket weaving. Works in middle management. Favorite band is elevator music compilations. Takes exactly 7-minute showers. Secretly fears automatic sliding doors.", birthday: "September 7, 2001" },
    { image: "media/jerry.gif", name: "pika wannabe", story: "Raised by librarians in Minnesota. Part-time sock organizer. Favorite game is watching loading screens. Has named every houseplant Kevin. Puts ketchup on literally everything.", birthday: "December 25, 2005" },
    { image: "media/bob.png", name: "Flammable Object", story: "Failed stand-up comedian turned Excel expert. Loves filing taxes. Favorite pastime is alphabetizing spice rack. Still uses a paper map. Refuses to trust automatic hand dryers.", birthday: "April 1, 2002" },
    { image: "media/dumbassdog.jpg", name: "bitch ass dog", story: "Studied theoretical sandwich architecture. Works at a printer repair shop. Favorite website is WebMD. Has every Papa John's order memorized since 2018. Writes poetry about traffic lights.", birthday: "October 13, 2000" },
    { image: "media/yvrendog.gif", name: "The Humble Dwarf", story: "Born in an Office Max. Professional pencil sharpener. Favorite sound is keyboard typing. Maintains extensive documentation about grass growth. Dreams of becoming a professional line waiter.", birthday: "January 20, 2006" },
    { image: "media/top500.gif", name: "call me", story: "sold nano on ball", birthday: "May 31, 2004" },
    { image: "media/stona.png", name: "støna", story: "Dropped out of clown college. Works as a shopping cart collector. Favorite activity is organizing recyclables by color. Has 47 identical pairs of khaki pants. Only drinks room temperature beverages.", birthday: "August 8, 2003" },
    { image: "media/yggy.png", name: "yggy", story: "Born in an IKEA warehouse. Works at a calculator repair shop. Favorite hobby is categorizing clouds. Still uses a flip phone from 2007. Collects instruction manuals for fun.", birthday: "February 14, 2007" },
    { image: "media/serenitydog.jpg", name: "The Bug", story: "Grew up inside a library. Professional carpet sample organizer. Favorite movie is the Windows XP installation video. Makes spreadsheets of daily water intake. Names all their plants Steve.", birthday: "July 7, 2007" },
    { image: "media/shrimp.png", name: "The Bug Jr.", story: "Former crayon quality control inspector. Now sells office supplies. Favorite pastime is watching screensavers. Has a collection of 312 identical pencils. Only walks in straight lines.", birthday: "March 3, 2008" },
    { image: "media/hesallin.jpg", name: "The Bug Sr.", story: "Raised by accountants in Nebraska. Part-time bubble wrap tester. Favorite show is static on TV. Maintains a diary of elevator rides. Refuses to use automatic toothbrushes.", birthday: "June 22, 2001" },
    { image: "media/mydog.png", name: "The Bug III", story: "Ex-professional chair tester. Current vending machine technician. Favorite music is printer noises. Keeps a logbook of every sneeze since 2015. Only uses mechanical pencils.", birthday: "November 14, 2005" },
    { image: "media/toiletzyn.png", name: "The Bug IV", story: "Studied advanced sock folding. Works at a paper clip factory. Favorite website is the Google homepage. Has memorized every WiFi password they've ever used. Collects different types of lint.", birthday: "April 19, 2009" },
    { image: "media/hi.gif", name: "The Bug V", story: "Former professional paint watcher. Now catalogs office supplies. Favorite sport is competitive filing. Takes photos of every door they walk through. Only eats foods that start with 'P'.", birthday: "December 1, 2003" },
    { image: "media/edit.gif", name: "The Bug VI", story: "Graduated from lamp shade college. Works as a stapler repairman. Favorite hobby is collecting different types of dust. Names their houseplants after office supplies. Sorts M&Ms by serial number.", birthday: "September 30, 2006" },
    { image: "media/applefritters.png", name: "The Bug VII", story: "Certified cardboard box inspector. Currently organizes filing cabinets. Favorite game is watching screen savers. Has a collection of used sticky notes. Only writes in Comic Sans.", birthday: "January 11, 2010" },
    { image: "media/turtle.png", name: "Bug that knows too much", story: "Professional alphabet organizer. Works at a rubber band sorting facility. Favorite activity is watching grass grow. Maintains a database of chair squeaks. Refuses to use cordless phones.", birthday: "October 27, 2000" },
    { image: "media/nothinglike.png", name: "Bug that has your private information", story: "Born in a post office. Works as a professional line stander. Favorite documentary is paint drying. Has cataloged every paperclip they've ever owned. Only drinks tap water at room temperature.", birthday: "May 16, 2011" },
    { image: "media/putitdown.png", name: "Shingle", story: "Trained as a professional pencil sharpener. Now tests desk chairs. Favorite book is the phone book. Collects different types of silence. Has never used an escalator.", birthday: "March 21, 2008" },
    { image: "media/spiral.png", name: "Takashi Shirogane", story: "Expert in theoretical stapling. Works at a calendar factory. Favorite music genre is elevator music remixes. Keeps a journal of paper cuts. Only walks counterclockwise around furniture.", birthday: "July 29, 2002" },
    { image: "media/bush.png", name: "Mulch", story: "Studied advanced waiting room sitting. Professional file cabinet organizer. Favorite movie is security camera footage. Has named every stapler they've ever owned. Collects different types of air.", birthday: "February 5, 2009" },
    { image: "media/homeless.png", name: "Grink", story: "Master of alphabetical filing. Works as a professional line drawer. Favorite sport is competitive sitting. Maintains a collection of empty folders. Only uses mechanical keyboards from the 90s.", birthday: "November 18, 2012" },
  ]
};
 