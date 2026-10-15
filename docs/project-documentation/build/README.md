# Documentation build scripts

These scripts create the Word files in the parent folder.

| File | Purpose |
| --- | --- |
| `build.js` | Builds the seven chapter files and the combined document |
| `lib.js` | Helper functions (headings, tables, figures, cover page, sign-off line) |
| `ch12.js`, `ch34.js`, `ch5.js`, `ch67.js` | The text of chapters 1 to 7 and the appendices |
| `diagrams_extra.py` | Draws the Gantt chart, flowchart, activity, extra level 2 DFD, deployment, structure, use case, architecture and level 0 diagrams |
| `verify_live.js` | Runs the main user flows against a running local server and writes `verify_results.json` (used in Chapter 5) |

## Rebuild

```bash
npm install docx          # once
python diagrams_extra.py  # only if a diagram changed
node build.js
```

To refresh the live test results, start the backend with demo data (`python manage.py seed_demo`, `python manage.py runserver`) and run `node verify_live.js http://127.0.0.1:8000` first.
When the test count changes, update `TESTS.total` in `ch5.js` and `ch67.js`.

The screenshots in `../screens/` were taken from the running web app with the demo accounts.
The table of contents fills in when the combined file is opened in Word (choose "Yes" to update fields).
