import { test, equal, sql } from "@elements/app";
import { QueueTaskDigestsJob } from "./queue-task-digests";
import { makeUser, makeContact } from "#app/shared/services/fixtures";

test("queue task digests", () => {
  test("queues one digest per person with something due, once", () => {
    let sam = makeUser("Sam Rep");
    let jo = makeUser("Jo Rep");
    let idle = makeUser("Idle Rep");
    let c = makeContact(sam.id);

    sql(`insert into tasks (title, dueOn, ownerId, contactId) values ('a', '2026-10-01', ${sam.id}, ${c.id}), ('b', '2026-10-01', ${sam.id}, ${c.id})`);
    sql(`insert into tasks (title, dueOn, ownerId, contactId) values ('c', '2026-10-01', ${jo.id}, ${c.id})`);
    sql(`insert into tasks (title, dueOn, ownerId, contactId, done) values ('d', '2026-10-01', ${idle.id}, ${c.id}, true)`);

    let job = new QueueTaskDigestsJob({ day: "2026-10-01" });
    job.run();
    job.run();

    let keys = sql<{ key: string }>(
      `select idempotencyKey as key from elements.jobs where idempotencyKey like 'task-digest:%:2026-10-01' order by 1`,
    ).all().map((r) => r.key);

    equal(keys.sort(), [`task-digest:${jo.id}:2026-10-01`, `task-digest:${sam.id}:2026-10-01`].sort());
  });
});
