// Builds the seven chapter files and the combined document.
// Run from this folder:  npm install docx   (once)   then   node build.js
// Before building, run:  python diagrams_extra.py   and   node verify_live.js (against a running demo server)
const { chapter, P, plainHead, B, table, gap, buildCombined } = require("./lib");

(async () => {
  chapter("A"); // front-matter tables are numbered A.1, A.2 ...
  const front = [
    plainHead("Declaration"),
    P("I declare that this project documentation is my own work. The tools, libraries and sources I used are named in the text and in the references in Chapter 7."),
    gap(),
    P("Student name: ……………………………………………     Signature: ………………………     Date: ………………………"),
    gap(),
    P("Supervisor name: …………………………………………     Signature: ………………………     Date: ………………………"),
    gap(),
    plainHead("How This Document Follows the Project Guidelines"),
    ...table(["Required item", "Where it is covered"], [
      ["Executive summary", "Chapter 1, section 1.1"],
      ["Description of the current system, company background, system background and problems", "Chapter 1, section 1.2"],
      ["Scope (what is in, what is out and why)", "Chapter 1, section 1.3"],
      ["Objectives (SMART)", "Chapter 1, section 1.4"],
      ["Description of the proposed system and its major processes", "Chapter 1, section 1.5"],
      ["Feasibility study techniques (five techniques)", "Chapter 2, sections 2.2 to 2.6"],
      ["Fact-finding and recording tools", "Chapter 3, section 3.2"],
      ["Analysis tools", "Chapter 3, section 3.3"],
      ["Input, output and process design", "Chapter 4, section 4.2"],
      ["Database design and file design", "Chapter 4, section 4.3"],
      ["User interface design", "Chapter 4, section 4.4"],
      ["Design of system controls", "Chapter 4, section 4.5"],
      ["DFDs up to second level", "Chapter 4, section 4.6"],
      ["UML diagrams", "Chapter 4, section 4.7"],
      ["Programming practice (indentation and comments)", "Chapter 5, section 5.3"],
      ["Program quality (user friendliness)", "Chapter 5, section 5.4"],
      ["Program resilience (robustness, non-crash properties)", "Chapter 5, section 5.5"],
      ["Testing", "Chapter 5, section 5.6"],
      ["Pre-presentation", "Chapter 6, section 6.2"],
      ["Documentation, including the user manual", "Chapter 6, section 6.3"],
      ["Conversion plans, including training", "Chapter 6, section 6.4"],
      ["Post-implementation plan", "Chapter 6, section 6.5"],
      ["Conclusion and future plans", "Chapter 7, sections 7.1 to 7.7"],
    ], [5200, 3826], "Project guideline checklist"),
    plainHead("Abbreviations and Terms"),
    ...table(["Term", "Meaning"], [
      ["API", "Application Programming Interface: the way the apps talk to the server"],
      ["Audit log", "A record of who did what and when"],
      ["CORS", "Cross-Origin Resource Sharing: a browser rule about which sites may call the API"],
      ["CRUD", "Create, read, update, delete"],
      ["CSV", "Comma-separated values file, which opens in a spreadsheet"],
      ["DFD", "Data flow diagram"],
      ["ERD", "Entity relationship diagram"],
      ["Incident", "A security event that is reported, such as a suspicious e-mail"],
      ["JWT", "JSON Web Token: a signed token that proves who the user is"],
      ["Kanban board", "A board with columns, one for each status of a case"],
      ["MySQL, SQLite", "Two relational database programs"],
      ["Phishing", "A fake message that tries to trick a person into giving secrets or clicking a bad link"],
      ["RBAC", "Role-based access control: what a user can do depends on their role"],
      ["REST", "A common style for web APIs"],
      ["SIEM", "Security Information and Event Management: a tool that collects security logs"],
      ["SMART", "Specific, Measurable, Achievable, Relevant, Time-bound"],
      ["SOC", "Security Operations Centre: the team that watches and handles security events"],
      ["UML", "Unified Modeling Language: a standard set of diagrams"],
    ], [2000, 7026], "Abbreviations and terms"),
  ];
  await require("./ch12");
  await require("./ch34");
  await require("./ch567");
  await buildCombined("CyberShield_Hub_Complete_Project_Documentation.docx", front);
})();
