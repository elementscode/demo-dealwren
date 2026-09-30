import { Request, Response, NotFoundError } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { companies } from "#app/shared/services/companies";
import { contacts } from "#app/shared/services/contacts";
import { deals } from "#app/shared/services/deals";
import html, { editFor } from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  let companyId = req.params.id;
  let view = companies.view();
  let company = view.get(companyId);

  if (!company) {
    throw new NotFoundError("no such company");
  }

  return new html({
    me,
    companyId,
    companies: view,
    contacts: contacts.view({ companyId }),
    deals: deals.view({ companyId }),
    edit: editFor(company),
  });
}
