import { LiveTable, sql, ValidationError } from "@elements/app";
import { requireUser, requireOwner } from "./auth";

export interface Task {
  id: string;
  title: string;
  dueOn: string;
  done: boolean;
  ownerId: string | null;
  contactId: string | null;
  dealId: string | null;
  createdAt: Date;
  ownerName: string | null;
  contactName: string | null;
  dealName: string | null;
}

const COLUMNS = sql.raw(`
  t.id, t.title, to_char(t.dueOn, 'YYYY-MM-DD') as dueOn, t.done, t.ownerId, t.contactId, t.dealId,
  t.createdAt, u.name as ownerName, c.name as contactName, d.name as dealName
`);

const FROM = sql.raw(`
  tasks t
  left join users u on u.id = t.ownerId
  left join contacts c on c.id = t.contactId
  left join deals d on d.id = t.dealId
`);

function taskById(id: string): Task {
  return sql<Task>(`select ${COLUMNS} from ${FROM} where t.id = ${id}`).firstOrThrow();
}

function clean(item: Partial<Task>) {
  let title = (item.title ?? "").trim();

  if (!title) {
    throw new ValidationError("describe the follow-up");
  }

  if (!item.dueOn || !/^\d{4}-\d{2}-\d{2}$/.test(item.dueOn)) {
    throw new ValidationError("pick a due date");
  }

  if (!item.contactId && !item.dealId) {
    throw new ValidationError("a task belongs to a contact or a deal");
  }

  return {
    title,
    dueOn: item.dueOn,
    done: !!item.done,
    ownerId: item.ownerId || null,
    contactId: item.contactId || null,
    dealId: item.dealId || null,
  };
}

/**
 * Follow-ups. Opened by contact, by deal, or by owner (a rep's own list),
 * and any team member may add or tick one off. Only the owner deletes.
 */
export let tasks: LiveTable<Task> = new LiveTable<Task>({
  select: (p) => sql<Task>(
    `select ${COLUMNS} from ${FROM}
     where (${p.contactId ?? null}::uuid is null or t.contactId = ${p.contactId ?? null}::uuid)
       and (${p.dealId ?? null}::uuid is null or t.dealId = ${p.dealId ?? null}::uuid)
       and (${p.ownerId ?? null}::uuid is null or t.ownerId = ${p.ownerId ?? null}::uuid)`,
  ),

  insert: (item) => {
    let me = requireUser();
    let t = clean(item);

    sql(
      `insert into tasks (id, title, dueOn, done, ownerId, contactId, dealId)
       values (${item.id}, ${t.title}, ${t.dueOn}::date, ${t.done}, ${t.ownerId ?? me.id}, ${t.contactId}, ${t.dealId})`,
    );

    return taskById(item.id!);
  },

  update: (item) => {
    requireUser();

    let t = clean(item);

    sql(
      `update tasks set title = ${t.title}, dueOn = ${t.dueOn}::date, done = ${t.done},
         ownerId = ${t.ownerId}, contactId = ${t.contactId}, dealId = ${t.dealId}
       where id = ${item.id}`,
    );

    return taskById(item.id);
  },

  delete: (item) => {
    requireOwner();
    sql(`delete from tasks where id = ${item.id}`);
  },
});

export interface DueTask {
  title: string;
  contactName: string | null;
  dealName: string | null;
  companyName: string | null;
}

/** One person's open tasks due on a given day, for the 8am email. */
export function dueTasks(userId: string, day: string): DueTask[] {
  return sql<DueTask>(
    `select t.title, c.name as contactName, d.name as dealName,
       coalesce(dc.name, cc.name) as companyName
     from tasks t
     left join contacts c on c.id = t.contactId
     left join companies cc on cc.id = c.companyId
     left join deals d on d.id = t.dealId
     left join companies dc on dc.id = d.companyId
     where t.ownerId = ${userId} and t.dueOn = ${day}::date and not t.done
     order by t.createdAt, t.id`,
  ).all();
}
