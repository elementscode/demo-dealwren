import { test, assert, equal, sql, AuthError, ForbiddenError } from "@elements/app";
import { deals, activities } from "./deals";
import { makeUser, loginAs, makeDeal, thrown } from "./fixtures";

test("deals", async () => {
  test("a stage change logs a stage activity", async () => {
    let rep = makeUser("Rae Rep");
    let { id } = makeDeal(rep.id, { stage: "lead" });

    loginAs(rep);

    let view = deals.view();
    let deal = view.get(id)!;
    view.update({ ...deal, stage: "proposal" });

    let log = sql<{ kind: string; fromStage: string; toStage: string; userId: string }>(
      `select kind, fromStage, toStage, userId from activities where dealId = ${id}`,
    ).all();

    equal(log.length, 1);
    equal(log[0].kind, "stage");
    equal(log[0].fromStage, "lead");
    equal(log[0].toStage, "proposal");
    equal(log[0].userId, rep.id);
  });

  test("an edit that keeps the stage logs nothing", async () => {
    let rep = makeUser("Rae Rep");
    let { id } = makeDeal(rep.id);

    loginAs(rep);

    let view = deals.view();
    view.update({ ...view.get(id)!, value: 5000 });

    equal(sql(`select 1 from activities where dealId = ${id}`).length, 0);
    equal(sql<{ value: number }>(`select value from deals where id = ${id}`).firstOrThrow().value, 5000);
  });

  test("winning stamps wonAt and leaving won clears it", async () => {
    let rep = makeUser("Rae Rep");
    let { id } = makeDeal(rep.id, { stage: "negotiation" });

    loginAs(rep);

    let view = deals.view();
    view.update({ ...view.get(id)!, stage: "won" });
    assert(sql<{ wonAt: Date | null }>(`select wonAt from deals where id = ${id}`).firstOrThrow().wonAt !== null, "wonAt set");

    view.update({ ...view.get(id)!, stage: "negotiation" });
    equal(sql<{ wonAt: Date | null }>(`select wonAt from deals where id = ${id}`).firstOrThrow().wonAt, null);
  });

  test("a new deal belongs to whoever made it unless an owner is picked", async () => {
    let rep = makeUser("Rae Rep");

    loginAs(rep);

    let row = deals.view().insert({ name: "Fresh", value: 100, stage: "lead" });
    equal(row.ownerId, rep.id);
    equal(row.ownerName, "Rae Rep");
  });

  test("signed out cannot add a deal", async () => {
    assert((await thrown(() => deals.view().insert({ name: "Nope" }))) instanceof AuthError, "expected AuthError");
  });

  test("a rep cannot delete a deal, the owner can", async () => {
    let rep = makeUser("Rae Rep");
    let owner = makeUser("Olive Owner", "owner");
    let { id } = makeDeal(rep.id);

    loginAs(rep);

    let view = deals.view();
    assert((await thrown(() => view.delete(view.get(id)!))) instanceof ForbiddenError, "rep refused");
    equal(sql(`select 1 from deals where id = ${id}`).length, 1);

    loginAs(owner);

    let ownerView = deals.view();
    ownerView.delete(ownerView.get(id)!);
    equal(sql(`select 1 from deals where id = ${id}`).length, 0);
  });

  test("logging a call carries the author", async () => {
    let rep = makeUser("Rae Rep");
    let { id } = makeDeal(rep.id);

    loginAs(rep);

    let row = activities.view({ dealId: id }).insert({ kind: "call", body: "Talked pricing" });
    equal(row.authorName, "Rae Rep");
    equal(row.kind, "call");
  });

  test("an empty note is refused", async () => {
    let rep = makeUser("Rae Rep");
    let { id } = makeDeal(rep.id);

    loginAs(rep);
    assert((await thrown(() => activities.view({ dealId: id }).insert({ kind: "note", body: "  " }))) !== undefined, "expected an error");
  });
});
