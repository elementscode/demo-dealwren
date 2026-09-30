import { test, assert, equal, sql, ForbiddenError, ValidationError } from "@elements/app";
import { tasks, dueTasks } from "./tasks";
import { makeUser, loginAs, makeContact, makeDeal, thrown } from "./fixtures";

test("tasks", async () => {
  test("dueTasks lists one person's open tasks for the day", async () => {
    let rep = makeUser("Rae Rep");
    let other = makeUser("Otto Other");
    let c = makeContact(rep.id, "Ada");
    let d = makeDeal(rep.id, { name: "Big deal" });

    sql(`insert into tasks (title, dueOn, ownerId, contactId) values ('call Ada', '2026-10-01', ${rep.id}, ${c.id})`);
    sql(`insert into tasks (title, dueOn, ownerId, dealId) values ('send quote', '2026-10-01', ${rep.id}, ${d.id})`);
    sql(`insert into tasks (title, dueOn, ownerId, dealId, done) values ('already done', '2026-10-01', ${rep.id}, ${d.id}, true)`);
    sql(`insert into tasks (title, dueOn, ownerId, dealId) values ('tomorrow', '2026-10-02', ${rep.id}, ${d.id})`);
    sql(`insert into tasks (title, dueOn, ownerId, dealId) values ('not mine', '2026-10-01', ${other.id}, ${d.id})`);

    let due = dueTasks(rep.id, "2026-10-01");
    equal(due.map((t) => t.title), ["call Ada", "send quote"]);
    equal(due[0].contactName, "Ada");
    equal(due[1].dealName, "Big deal");
  });

  test("a task needs a contact or a deal", async () => {
    loginAs(makeUser("Rae Rep"));
    assert((await thrown(() => tasks.view().insert({ title: "Orphan", dueOn: "2026-10-01" }))) instanceof ValidationError, "expected ValidationError");
  });

  test("a rep can tick a task off but not delete it", async () => {
    let rep = makeUser("Rae Rep");
    let c = makeContact(rep.id);

    loginAs(rep);

    let view = tasks.view({ contactId: c.id });
    let row = view.insert({ title: "Call back", dueOn: "2026-10-01", contactId: c.id });
    equal(row.ownerId, rep.id);

    view.update({ ...row, done: true });
    equal(sql<{ done: boolean }>(`select done from tasks where id = ${row.id}`).firstOrThrow().done, true);

    assert((await thrown(() => view.delete(row))) instanceof ForbiddenError, "rep refused");
  });
});
