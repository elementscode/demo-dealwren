import { Request, Response, NotFoundError } from "@elements/app";
import { pageUser } from "#app/shared/services/auth";
import { deals, activities } from "#app/shared/services/deals";
import { tasks } from "#app/shared/services/tasks";
import { companyOptions } from "#app/shared/services/companies";
import { members } from "#app/shared/services/team";
import html, { editFor } from "./template";

export default function route(req: Request, res: Response) {
  let me = pageUser();

  if (!me) {
    return;
  }

  let dealId = req.params.id;
  let view = deals.view();
  let deal = view.get(dealId);

  if (!deal) {
    throw new NotFoundError("no such deal");
  }

  return new html({
    me,
    dealId,
    deals: view,
    activities: activities.view({ dealId }),
    tasks: tasks.view({ dealId }),
    companies: companyOptions(),
    members: members(),
    edit: editFor(deal),
  });
}
