import { test, assert, equal, sql, session, AuthError, ForbiddenError, ValidationError } from "@elements/app";
import { signin, requireOwner, requireUser, acceptInvite, setupOwner, findInvite } from "./auth";
import { makeUser, loginAs, thrown } from "./fixtures";

test("auth", async () => {
  test("signin with the right password logs in", async () => {
    let rep = makeUser("Rae Rep", "rep", "correct-horse");

    signin(rep.email.toUpperCase(), "correct-horse");

    equal(session.get("userId"), rep.id);
    equal(session.get("role"), "rep");
  });

  test("signin with the wrong password is refused", async () => {
    let rep = makeUser("Rae Rep", "rep", "correct-horse");
    let err = (await thrown(() => signin(rep.email, "nope")));

    assert(err instanceof AuthError, "expected AuthError");
    assert(!session.isLoggedIn(), "must not log in");
  });

  test("signed out is refused", async () => {
    assert((await thrown(() => requireUser())) instanceof AuthError, "expected AuthError");
  });

  test("a rep is not the owner", async () => {
    loginAs(makeUser("Rae Rep"));
    assert((await thrown(() => requireOwner())) instanceof ForbiddenError, "expected ForbiddenError");
  });

  test("the owner is the owner", async () => {
    let owner = makeUser("Olive Owner", "owner");

    loginAs(owner);
    equal(requireOwner().id, owner.id);
  });

  test("an invite makes a rep and is used once", async () => {
    let owner = makeUser("Olive Owner", "owner");

    sql(`insert into invites (email, token, invitedById) values ('new@test.example', 'tok-1', ${owner.id})`);
    equal(findInvite("tok-1")?.invitedBy, "Olive Owner");

    acceptInvite("tok-1", "Nia New", "long-enough");

    let user = sql<{ role: string }>(`select role from users where email = 'new@test.example'`).firstOrThrow();
    equal(user.role, "rep");
    assert(session.isLoggedIn(), "accepting logs in");
    equal(findInvite("tok-1"), undefined);
    assert((await thrown(() => acceptInvite("tok-1", "Again", "long-enough"))) instanceof ValidationError, "second use refused");
  });

  test("an expired invite is refused", async () => {
    sql(`insert into invites (email, token, expiresAt) values ('old@test.example', 'tok-old', now() - interval '1 day')`);
    assert((await thrown(() => acceptInvite("tok-old", "Old", "long-enough"))) instanceof ValidationError, "expected ValidationError");
  });

  test("setup makes the first user the owner, and only the first", async () => {
    setupOwner("First Owner", "first@test.example", "long-enough");
    equal(sql<{ role: string }>(`select role from users where email = 'first@test.example'`).firstOrThrow().role, "owner");

    assert((await thrown(() => setupOwner("Second", "second@test.example", "long-enough"))) instanceof ForbiddenError, "second setup refused");
  });
});
