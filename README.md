![A CRM with a live pipeline board, built by Claude Code on Elements: the pipeline board with a column per stage, each with its deal count and total value, and deal cards showing company, value, close date and owning rep.](https://elements.dev/demos/01a0f399-f3bb-7c53-af59-10b9fa312a32/poster?v=d2083e8029b6)

# A CRM with a live pipeline board, built by Claude Code on Elements

> Dealwren is a full-stack app built with Claude Code on Elements.

Contacts, companies and deals on a drag-and-drop pipeline board, with deal timelines, follow-up tasks, a morning task email and CSV export, all live.

[Run this app on your machine](https://elements.dev/demos/01a0f399-f3bb-7c53-af59-10b9fa312a32). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Dealwren needed owner and rep accounts, email invites, a pipeline board and deal timelines that update for everyone on the team, a CSV export, and a morning email of each rep's tasks. Each of those is a part of Elements, so the agent spent its 25 minutes on the CRM itself.

- **Live records.** Deals, timeline entries, contacts, companies and tasks are LiveTables. Dragging a deal to a new stage saves it and logs the stage change on the deal's timeline in one transaction, and a database trigger broadcasts each timeline entry, so the move shows on every open board, timeline and dashboard.

- **Morning task emails.** A one-line cron schedule runs a job at 8am that queues one email per rep listing the follow-ups due that day, keyed so each rep gets one email a day.

- **Invites by email.** The owner invites a rep by email from an `@rpc` function, and the invite link signs the new rep in.

- **Owner-only actions.** One guard on the signed-in user's role lets only the owner delete records or invite, and the owner downloads contacts as CSV.

- **Data from SQL files.** Migrations define the schema, seed an owner, two reps, five companies, ten contacts and fifteen deals with timelines and tasks, and add the timeline trigger. The project server applied each one as soon as it was saved.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
