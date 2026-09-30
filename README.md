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

## Demo accounts

The seed creates one owner and two reps, five companies, ten contacts, eight
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
