import { test, equal } from "@elements/app";
import { inStage, totalValue, emptyDealForm } from "./template";
import { Deal } from "#app/shared/services/deals";

function deal(stage: Deal["stage"], value: number): Deal {
  return {
    id: crypto.randomUUID(), name: `${stage} ${value}`, companyId: null, value, stage, closeOn: null,
    ownerId: null, wonAt: null, createdAt: new Date(), companyName: null, ownerName: null,
  };
}

test("pipeline", () => {
  test("a column holds its stage, biggest first, and totals its value", () => {
    let deals = [deal("lead", 10), deal("proposal", 5), deal("lead", 30)];
    let lead = inStage(deals, "lead");

    equal(lead.map((d) => d.value), [30, 10]);
    equal(totalValue(lead), 40);
    equal(inStage(deals, "won"), []);
  });

  test("a new deal form starts as a lead owned by the viewer", () => {
    let form = emptyDealForm("me", "co", true);

    equal([form.stage, form.ownerId, form.companyId, form.open], ["lead", "me", "co", true]);
  });
});
