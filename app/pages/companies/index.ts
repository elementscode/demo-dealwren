import { Request, Response } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { companies } from "#app/shared/services/companies";
import { contacts } from "#app/shared/services/contacts";
import { deals } from "#app/shared/services/deals";
import html from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  return new html({ me, companies: companies.view(), contacts: contacts.view(), deals: deals.view() });
}
