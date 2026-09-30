import { test, assert, equal, sql, ForbiddenError } from "@elements/app";
import { contacts, contactsCsv, csvField } from "./contacts";
import { makeUser, loginAs, makeCompany, makeContact, thrown } from "./fixtures";

test("contacts", async () => {
  test("csv fields are quoted and escaped", async () => {
    equal(csvField('say "hi"'), '"say ""hi"""');
    equal(csvField(null), '""');
    equal(csvField("a,b\nc"), '"a,b\nc"');
  });

  test("csv neutralizes formulas but keeps phone numbers", async () => {
    equal(csvField("=HYPERLINK(1)"), `"'=HYPERLINK(1)"`);
    equal(csvField("@SUM(A1)"), `"'@SUM(A1)"`);
    equal(csvField("+1 415 555 0142"), '"+1 415 555 0142"');
    equal(csvField("-cmd"), `"'-cmd"`);
  });

  test("the export has a header and one line per contact", async () => {
    let rep = makeUser("Rae Rep");
    let co = makeCompany("Acme");

    makeContact(rep.id, "Ada", co.id);
    makeContact(rep.id, "Bo");

    let lines = contactsCsv().trim().split("\r\n");
    equal(lines.length, 3);
    equal(lines[0], '"Name","Email","Phone","Company","Owner","Notes","Created"');
    assert(lines[1].startsWith('"Ada","","","Acme","Rae Rep"'), lines[1]);
  });

  test("an edit returns the joined names", async () => {
    let rep = makeUser("Rae Rep");
    let co = makeCompany("Globex");
    let { id } = makeContact(rep.id);

    loginAs(rep);

    let view = contacts.view();
    let row = view.update({ ...view.get(id)!, companyId: co.id });
    equal(row.companyName, "Globex");
  });

  test("only the owner deletes a contact", async () => {
    let rep = makeUser("Rae Rep");
    let { id } = makeContact(rep.id);

    loginAs(rep);

    let view = contacts.view();
    assert((await thrown(() => view.delete(view.get(id)!))) instanceof ForbiddenError, "rep refused");
    equal(sql(`select 1 from contacts where id = ${id}`).length, 1);
  });
});
