import { Request, Response } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { deals } from "#app/shared/services/deals";
import { companyOptions } from "#app/shared/services/companies";
import { members } from "#app/shared/services/team";
import html, { emptyDealForm } from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  let company = typeof req.query.company === "string" ? req.query.company : "";

  return new html({
    me,
    deals: deals.view(),
    companies: companyOptions(),
    members: members(),
    form: emptyDealForm(me.id, company, req.query.new === "1"),
  });
}
