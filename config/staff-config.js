/* ===========================================================
   staff-config.js - EDIT THIS FILE to change the staff page.

   Each employee is one block like this:
     {
       name: "Their name",
       image: "media/staff/their-photo.png",   // leave "" to show an initial instead
       title: "Job title",
       description: "A sentence or two about them.",
       votes: 0,                              // optional: starting votes
       ca: { title: "...", description: "..." }   // optional Catalan text
     },
   Copy a block, paste it in the list, change the words. Put photos in media/staff/
   (or point "image" at any file). The photo shown in the Employee of the Month
   box is the same photo used in the grid.
   =========================================================== */
window.STAFF_CONFIG = {
  employees: [
    {
      name: "Mister",
      image: "media/thekip.png",
      title: "place holder",
      description: "place holder",
      ca: { title: "Cap de Esquitxades", description: "Està en una reunió des del 2019. Ningú sap de què va. Excel·lent en estar humit." }
    },
    {
      name: "Steve",
      image: "media/bug1.png",
      title: "place holder",
      description: "place holder",
      ca: { title: "Especialista Sènior en Arrossegar-se", description: "Va entrar de becari. Encara és becari. S'arrossega amb molta confiança." }
    },
    {
      name: "Employee Three",
      image: "",
      title: "place holder",
      description: "place holder",
      ca: { title: "Vicepresident de Vibracions", description: "Canvia aquest text per alguna cosa sobre ell." }
    },
    {
      name: "Employee Four",
      image: "",
      title: "place holder",
      description: "place holder",
      ca: { title: "Cap d'Operacions de Migdiada", description: "Canvia aquest text per alguna cosa sobre ell." }
    },
    {
      name: "Employee Five",
      image: "",
      title: "place holder",
      description: "place holder",
      ca: { title: "Director d'Aigua", description: "Canvia aquest text per alguna cosa sobre ell." }
    },
    {
      name: "Employee Six",
      image: "",
      title: "place holder",
      description: "place holder",
      ca: { title: "Becari (Permanent)", description: "Canvia aquest text per alguna cosa sobre ell." }
    }
  ]
};
