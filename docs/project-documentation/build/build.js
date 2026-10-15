// Builds the chapter files, the appendices and the combined document.
// Run from this folder:  npm install docx   (once)   then   node build.js
// Before building, run:  python diagrams_extra.py   and   node verify_live.js (against a running demo server)
// Order of the combined document: cover, supervisor page, declaration, dedication, acknowledgements,
// table of contents, chapters 1 to 7, appendices (data collection methods).
const { chapter, P, plainHead, gap, brk, buildCombined } = require("./lib");

(async () => {
  chapter("A");
  const line = (t) => P(t);
  const front = [
    plainHead("Supervisor Page"),
    P("This project documentation was prepared under my supervision. I confirm that it meets the requirements of the ND3 IT project guidelines."),
    gap(),
    line("Supervisor name: ……………………………………………………………"),
    gap(),
    line("Signature: ………………………………………     Date: ………………………"),
    brk(),
    plainHead("Declaration"),
    P("I declare that this project documentation is my own work. The tools, libraries and sources I used are named in the text and in the references in Chapter 7."),
    gap(),
    line("Student name: ……………………………………………………………"),
    gap(),
    line("Signature: ………………………………………     Date: ………………………"),
    brk(),
    plainHead("Dedication"),
    P("I dedicate this project to my family and friends for their support, and to everyone who works to keep people and organisations safe online."),
    brk(),
    plainHead("Acknowledgements"),
    P("I thank my supervisor for guidance during this project. I thank the lecturers and staff of Kwekwe Polytechnic for their teaching and support. I thank the people who took part in the interviews and questionnaires. I thank my family and friends for their encouragement."),
  ];
  await require("./ch12");
  await require("./ch34");
  await require("./ch5");
  await require("./ch67");
  await buildCombined("CyberShield_Hub_Complete_Project_Documentation.docx", front);
})();
