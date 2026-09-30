import { test, assert } from "@elements/app";
import { matches } from "./template";
import { Contact } from "#app/shared/services/contacts";

test("contacts page", () => {
  let ada: Contact = {
    id: "1", name: "Ada Lovelace", email: "ada@analytical.example", phone: "+44 20 5555", companyId: "co1",
    ownerId: null, notes: "", createdAt: new Date(), companyName: "Analytical Engines", ownerName: "Sam Patel",
  };

  test("search matches name, email, company and owner, any case", () => {
    assert(matches(ada, { q: "ADA", companyId: "" }));
    assert(matches(ada, { q: "analytical", companyId: "" }));
    assert(matches(ada, { q: "sam", companyId: "" }));
    assert(!matches(ada, { q: "grace", companyId: "" }));
  });

  test("the company filter narrows", () => {
    assert(matches(ada, { q: "", companyId: "co1" }));
    assert(!matches(ada, { q: "", companyId: "co2" }));
  });
});
