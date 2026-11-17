/* ===========================================================
   mascot-config.js - EDIT THIS FILE to change jak3chambers the mudkip.
   (load it BEFORE mascot.js)

   Add, remove or reword anything inside the [ ... ] lists.
   Each line is just text between quotes, followed by a comma.
   Catalan lines (ca) show when the site is in Catalan.
   =========================================================== */
window.MASCOT_CONFIG = {

  name: "jak3chambers",       // the name tag under him

  /* how often he talks on his own */
  firstLineDelaySeconds: 2.5,  // how long after the page loads he says hello
  minSecondsBetween: 14,       // he waits at least this long between lines...
  maxSecondsBetween: 32,       // ...and at most this long
  showSeconds: 6,              // how long each speech bubble stays up

  size: 88,                    // size in pixels (width and height)
  faceMouse: true,             // he turns to look at your mouse

  /* files (paths are from the site root) */
  texture: "media/mudkip/mudkip.png",

  /* if the 3D mudkip can't load (old phone, no WebGL), show a simple flat
     drawing instead so he can still talk. Set false to hide him instead. */
  fallbackAvatar: true,

  /* first thing he says */
  greeting: {
    en: "Hi, I'm jak3chambers. Welcome to the bug box.",
    ca: "Hola, soc jak3chambers. Benvingut a la capsa d'insectes."
  },

  /* things he says now and then, picked at random */
  lines: {
    en: [
      "Mud.",
      "Did you feed the bugs today?",
      "Fun fact: I'm not a bug. I'm a mudkip. Don't tell the bugs.",
      "Try dragging one of the bugs. They love it. Probably.",
      "Click a bug. They all have stories.",
      "The staff page has my coworkers. They're extremely professional.",
      "Glub glub.",
      "I've been watching these bugs bounce for hours.",
      "Nice mouse cursor.",
      "Is it just me, or are there more bugs than before?",
      "I'm rated 5 out of 5 mudkips."
    ],
    ca: [
      "Fang.",
      "Has donat de menjar als insectes avui?",
      "Dada curiosa: no sóc un insecte. Sóc un mudkip. No ho diguis als insectes.",
      "Prova d'arrossegar un insecte. Els encanta. Potser.",
      "Fes clic en un insecte. Tots tenen una història.",
      "A la pàgina del personal hi ha els meus companys. Són extremadament professionals.",
      "Glub glub.",
      "Fa hores que miro rebotar aquests insectes.",
      "Bon cursor, per cert.",
      "Només jo noto que hi ha més insectes que abans?",
      "Tinc una valoració de 5 mudkips sobre 5."
    ]
  },

  /* what he says when you click him (leave out to reuse the list above) */
  clickLines: {
    en: [
      "Hey!",
      "Mudkip!",
      "That tickles.",
      "Stop poking me. ...Okay, don't stop.",
      "I'm working."
    ],
    ca: [
      "Ei!",
      "Mudkip!",
      "Em fas pessigolles.",
      "Deixa de picar-me. ...Bé, no pares.",
      "Estic treballant."
    ]
  }
};
