import { test, equal } from "@elements/app";
import { editFor } from "./template";
import { stageLine } from "#app/shared/services/format";

test("deal page", () => {
  test("the edit form starts from the deal", () => {
    let edit = editFor({
      id: "d", name: "Fleet", companyId: null, value: 48000, stage: "proposal", closeOn: "2026-10-12",
      ownerId: "u", wonAt: null, createdAt: new Date(), companyName: null, ownerName: "Sam",
    });

    equal([edit.name, edit.value, edit.companyId, edit.closeOn, edit.ownerId], ["Fleet", 48000, "", "2026-10-12", "u"]);
  });

  test("a stage entry reads as a sentence", () => {
    equal(stageLine({ fromStage: "proposal", toStage: "negotiation" }), "moved it from Proposal to Negotiation");
    equal(stageLine({ fromStage: null, toStage: "won" }), "set the stage to Won");
  });
});
