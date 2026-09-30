import { Request, Response, ForbiddenError } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { contacts, contactsCsv } from "#app/shared/services/contacts";
import { companyOptions } from "#app/shared/services/companies";
import { members } from "#app/shared/services/team";
import html, { emptyContactForm } from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  let company = typeof req.query.company === "string" ? req.query.company : "";

  return new html({
    me,
    contacts: contacts.view(),
    companies: companyOptions(),
    members: members(),
    form: emptyContactForm(me.id, company, req.query.new === "1"),
  });
}

/** GET /contacts.csv: the whole contact book, owner only. */
export function exportCsv(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  if (me.role !== "owner") {
    throw new ForbiddenError("only the owner can export contacts");
  }

  let day = new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="dealwren-contacts-${day}.csv"`);
  res.setHeader("Cache-Control", "no-store");
  res.end(contactsCsv());
}
