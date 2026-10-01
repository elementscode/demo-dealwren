![Dealwren, a CRM for a small sales team built with Elements: the pipeline board with a column per stage, each with its deal count and total value, and deal cards showing company, value, close date and owning rep.](https://elements.dev/demos/01a0f399-f3bb-7c53-af59-10b9fa312a32/poster?v=d2083e8029b6)

# Dealwren

> A demo app built with [Elements](https://elements.dev).

Contacts, companies and deals on a drag-and-drop pipeline board, with deal timelines, follow-up tasks, a morning task email and CSV export, all live.

**Demo:** [Dealwren](https://elements.dev/demos/01a0f399-f3bb-7c53-af59-10b9fa312a32)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 25 min
- **Cost:** $9.39 at API rates, September 2026

## Get started

```bash
elements create dealwren -scaffold=elementscode/demo-dealwren
```

## How it's built

Dealwren needed owner and rep accounts, email invites, a pipeline board and deal timelines that update for the whole team, a CSV export, and a morning email of each rep's tasks. Each of those is a part of Elements, so the agent spent its 25 minutes on the CRM itself.

### What Elements gave the app

- **Live records.** Deals, timeline entries, contacts, companies and tasks are LiveTables. Dragging a deal to a new stage saves it and logs the stage change on the deal's timeline in one transaction, and a database trigger broadcasts each timeline entry, so the move shows on every open board, timeline and dashboard.
- **Morning task emails.** A one-line cron schedule runs a job at 8am that queues one email per rep listing the follow-ups due that day, keyed so each rep gets one email a day.
- **Invites by email.** The owner invites a rep by email from an `@rpc` function, and the invite link signs the new rep in.
- **Owner-only actions.** One guard on the signed-in user's role lets only the owner delete records or invite, and the owner downloads contacts as CSV.
- **Data from SQL files.** Migrations define the schema, seed an owner, two reps, five companies, ten contacts and fifteen deals with timelines and tasks, and add the timeline trigger. The project server applied each one as soon as it was saved.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 43 tests pass. Every page works on desktop and phone, and live updates arrive across tabs, such as a board move or a new note appearing on another open board and timeline.

## Demo accounts

The seed creates one owner and two reps, five companies, ten contacts, fifteen
deals across every stage with a timeline of notes, calls, emails and stage
changes, and a set of follow-up tasks, some due today. The sign-in page lists
the accounts in development.

| Email                | Password          | Role  |
| -------------------- | ----------------- | ----- |
| maya@dealwren.test   | `wren-owner-demo` | owner |
| sam@dealwren.test    | `wren-rep-demo`   | rep   |
| jordan@dealwren.test | `wren-rep-demo`   | rep   |

The owner invites reps from the Team page, and is the only one who can delete
records or export contacts. In development the 8am task email is written to
the log instead of sent; set the SMTP values in `config/env/production.env` to
send it for real.

## The prompt

```text
Build a CRM named dealwren for a small sales team. The team's data is private to the team.

Two kinds of accounts: owner and rep. The owner invites reps by email. Everyone
sees all records. Only the owner can delete records or export.

- Contacts: name, email, phone, company, owning rep, notes.
- Companies, each listing its contacts and deals.
- Deals: name, company, value, stage (lead, qualified, proposal, negotiation,
  won, lost), expected close date, owning rep.
- Pipeline board: a column per stage with its total value, drag a deal to
  change stage.
- Deal detail: a timeline of logged notes, calls and emails, plus every stage
  change.
- Tasks: a follow-up with a due date on a contact or deal. At 8am each rep gets
  an email listing their tasks due that day.
- Dashboard: pipeline value by stage, deals won this month, open deals per rep.
- Export contacts as CSV.

Seed one owner, two reps, five companies, ten contacts and eight deals across
stages. Show the seeded logins on the sign-in page.

Board moves and new activity update in real time.
```

## License

MIT. See [LICENSE](LICENSE).
