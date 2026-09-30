import { test, assert, equal, sql, ForbiddenError, ValidationError } from "@elements/app";
import { invite, revokeInvite, sendDigestsNow } from "./template";
import { makeUser, loginAs, thrown } from "#app/shared/services/fixtures";

test("team", () => {
  test("the owner invites a rep by email", async () => {
    loginAs(makeUser("Olive Owner", "owner"));

    let pending = invite("  New.Rep@Example.com ");
    equal(pending.map((i) => i.email), ["new.rep@example.com"]);

    let again = invite("new.rep@example.com");
    equal(again.length, 1, "re-inviting replaces the old invite");

    equal(revokeInvite(again[0].id).length, 0);
  });

  test("a rep cannot invite", async () => {
    loginAs(makeUser("Rae Rep"));
    assert((await thrown(() => invite("x@example.com"))) instanceof ForbiddenError);
  });

  test("an existing member or a bad address is refused", async () => {
    let owner = makeUser("Olive Owner", "owner");

    loginAs(owner);
    assert((await thrown(() => invite(owner.email))) instanceof ValidationError);
    assert((await thrown(() => invite("not-an-email"))) instanceof ValidationError);
  });

  test("sending digests now is the owner's", async () => {
    loginAs(makeUser("Rae Rep"));
    assert((await thrown(() => sendDigestsNow())) instanceof ForbiddenError);

    loginAs(makeUser("Olive Owner", "owner"));

    let due = sql<{ n: number }>(
      `select count(distinct ownerId)::int as n from tasks where dueOn = current_date and not done and ownerId is not null`,
    ).firstOrThrow().n;
    equal(sendDigestsNow(), due);
    equal(sql(`select 1 from elements.jobs where path like '%queue-task-digests%' and state = 'pending'`).length >= 1, true);
  });
});
