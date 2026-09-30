import { Request, Response, NotFoundError } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { contacts } from "#app/shared/services/contacts";
import { tasks } from "#app/shared/services/tasks";
import { companyDeals } from "#app/shared/services/deals";
import { companyOptions } from "#app/shared/services/companies";
import { members } from "#app/shared/services/team";
import html, { editFor } from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  let contactId = req.params.id;
  let view = contacts.view();
  let contact = view.get(contactId);

  if (!contact) {
    throw new NotFoundError("no such contact");
  }

  return new html({
    me,
    contactId,
    contacts: view,
    tasks: tasks.view({ contactId }),
    deals: companyDeals(contact.companyId),
    companies: companyOptions(),
    members: members(),
    edit: editFor(contact),
  });
}
