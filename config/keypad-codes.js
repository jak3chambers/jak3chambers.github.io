/* ===========================================================
   keypad-codes.js - EDIT THIS FILE to decide what the keypad does.

   HOW IT WORKS
   Someone opens the keypad (the lock icon), types a code and presses enter.
   If the code matches one below, the thing you listed happens.
   Letters can only be typed after both screws are taken off and the keypad
   has unfolded, so number-only codes work for everyone and letter codes are
   for people who find the screws.

   - codes are NOT case sensitive: "Mudkip", "mudkip" and "MUDKIP" are the same.
   - numbers, letters and spaces all work ("42", "big bug", "mud 7").
   - accents are ignored ("mató" = "mato").
   - this file is NOT secret: anyone who views the page source can read it.
     For codes only your friends should find, use tools/encrypt-codes.html instead
     (it makes a scrambled config/keypad-secrets.js that can't be read).

   TO ADD A CODE
   Copy one { ... } block, paste it before the closing ], change the words.
   Keep the comma after each block. Don't repeat a code.

   WHAT A BLOCK CAN DO (use as many of these in one block as you like)

     code: "1234",                  the code to type  (or: codes: ["1234", "4321"]
                                    when several codes do the same thing)

     say: "hello!",                 the mudkip mascot says it in his speech bubble
     sayForSeconds: 8,              (optional) how long the bubble stays, default 6

     image: "media/thekip.png",     shows a picture in a little window
     caption: "text under it",      (optional) text under the picture
     message: "some text",          shows text in a little window (works without an image too)
     title: "window title",         (optional) the little window's title bar

     download: "media/file.pdf",    the visitor's device downloads this file
     filename: "nicer-name.pdf",    (optional) what the downloaded file is called
     downloadText: { filename: "note.txt", text: "anything you write here" },
                                    downloads a text file you write right here, no file needed

     sound: "media/ding.mp3",       plays a sound
     link: "https://example.com",   goes to a web page
     newTab: true,                  (optional) open the link in a new tab

     auto: true,                    (optional) happens the moment the code is typed,
                                    without pressing enter. Careful: if a short auto
                                    code is the start of a longer one, the short one wins.
     keepOpen: true,                (optional) leave the keypad open afterwards

     run: function (tools) { ... }  (advanced) your own javascript. tools.say("text")
                                    and tools.show({ image, caption, message, title })

   TEXT IN TWO LANGUAGES
   Anywhere you write text (say, caption, message, title) you can write
   { en: "hello", ca: "hola" } instead of "hello" to show a different line in
   catalan. A plain "hello" is shown in both.

   FILES
   Put pictures / sounds / downloads in the media/ folder and write the path
   like "media/yourfile.png".
   =========================================================== */
window.KEYPAD_CONFIG = {

  /* what shows under the keypad when the code isn't one of the ones below */
  noMatchMessage: { en: "nothing happened.", ca: "no ha passat res." },

  codes: [

    /* ---- examples: change them or delete them ---- */

    // the mascot says something
    { code: "hello",
      say: { en: "you found a code. there are more.", ca: "has trobat un codi. n'hi ha més." } },

    // a picture appears (and the mascot comments)
    { code: "1234",
      image: "media/thekip.png",
      caption: { en: "the kip.", ca: "el kip." },
      say: "glub glub." },

    // the visitor's device downloads a text file written right here
    { code: "readme",
      downloadText: { filename: "hello.txt", text: "hi. you typed a secret code. that's it. that's the file." },
      message: { en: "check your downloads.", ca: "mira les teves baixades." } },

    /* ---- templates to copy (remove the // to use) ---- */

    // { code: "42", message: "the answer." },
    // { code: "cat", link: "https://example.com", newTab: true },
    // { code: "boom", sound: "media/boom.mp3", say: "what was that?" },
    // { code: "9999", download: "media/some-file.pdf", filename: "cool-file.pdf" },

  ]
};
