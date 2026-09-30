import { test, equal } from "@elements/app";
import { stageTotals, openPerRep, wonThisMonth } from "./template";
import { Deal } from "#app/shared/services/deals";
import { Member } from "#app/shared/services/team";

function deal(fields: Partial<Deal>): Deal {
  return {
    id: crypto.randomUUID(), name: "d", companyId: null, value: 0, stage: "lead", closeOn: null,
    ownerId: null, wonAt: null, createdAt: new Date(), companyName: null, ownerName: null, ...fields,
  };
}

test("dashboard", () => {
  let deals = [
    deal({ stage: "lead", value: 100, ownerId: "a" }),
    deal({ stage: "lead", value: 50, ownerId: "b" }),
    deal({ stage: "proposal", value: 300, ownerId: "a" }),
    deal({ stage: "won", value: 1000, ownerId: "a", wonAt: new Date(2026, 8, 12) }),
    deal({ stage: "won", value: 7, ownerId: "a", wonAt: new Date(2026, 7, 30) }),
    deal({ stage: "lost", value: 9, ownerId: "b" }),
  ];

  test("value by stage covers every stage", () => {
    let totals = stageTotals(deals);

    equal(totals.map((t) => t.stage), ["lead", "qualified", "proposal", "negotiation", "won", "lost"]);
    equal(totals[0], { stage: "lead", value: 150, count: 2 });
    equal(totals[1], { stage: "qualified", value: 0, count: 0 });
  });

  test("open deals per rep counts only open stages and keeps idle reps", () => {
    let members: Member[] = [
      { id: "a", name: "Ann", email: "", role: "owner" },
      { id: "b", name: "Ben", email: "", role: "rep" },
      { id: "c", name: "Cy", email: "", role: "rep" },
    ];

    equal(openPerRep(deals, members).map((r) => [r.name, r.count, r.value]), [["Ann", 2, 400], ["Ben", 1, 50], ["Cy", 0, 0]]);
  });

  test("won this month is this calendar month only", () => {
    equal(wonThisMonth(deals, new Date(2026, 8, 30)).map((d) => d.value), [1000]);
  });
});
