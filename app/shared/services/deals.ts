import { LiveTable, sql, tx, ValidationError } from "@elements/app";
import { requireUser, requireOwner } from "./auth";
import { Stage, STAGES } from "./format";

export interface Deal {
  id: string;
  name: string;
  companyId: string | null;
  value: number;
  stage: Stage;
  closeOn: string | null;
  ownerId: string | null;
  wonAt: Date | null;
  createdAt: Date;
  companyName: string | null;
  ownerName: string | null;
}

export type ActivityKind = "note" | "call" | "email" | "stage";

export interface Activity {
  id: string;
  dealId: string;
  userId: string | null;
  kind: ActivityKind;
  body: string;
  fromStage: Stage | null;
  toStage: Stage | null;
  createdAt: Date;
  authorName: string | null;
  dealName: string | null;
}

const DEAL_COLUMNS = sql.raw(`
  d.id, d.name, d.companyId, d.value, d.stage, to_char(d.closeOn, 'YYYY-MM-DD') as closeOn,
  d.ownerId, d.wonAt, d.createdAt, co.name as companyName, u.name as ownerName
`);

function dealById(id: string): Deal {
  return sql<Deal>(
    `select ${DEAL_COLUMNS}
     from deals d
     left join companies co on co.id = d.companyId
     left join users u on u.id = d.ownerId
     where d.id = ${id}`,
  ).firstOrThrow();
}

function clean(item: Partial<Deal>) {
  let name = (item.name ?? "").trim();
  let value = Math.round(Number(item.value ?? 0));
  let stage = item.stage ?? "lead";

  if (!name) {
    throw new ValidationError("a deal needs a name");
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new ValidationError("value must be a positive number");
  }

  if (!STAGES.includes(stage)) {
    throw new ValidationError(`unknown stage ${stage}`);
  }

  return {
    name,
    value,
    stage,
    companyId: item.companyId || null,
    ownerId: item.ownerId || null,
    closeOn: item.closeOn || null,
  };
}

export let deals: LiveTable<Deal> = new LiveTable<Deal>({
  select: (p) => sql<Deal>(
    `select ${DEAL_COLUMNS}
     from deals d
     left join companies co on co.id = d.companyId
     left join users u on u.id = d.ownerId
     where (${p.companyId ?? null}::uuid is null or d.companyId = ${p.companyId ?? null}::uuid)`,
  ),

  insert: (item) => {
    let me = requireUser();
    let d = clean(item);

    sql(
      `insert into deals (id, name, companyId, value, stage, closeOn, ownerId, wonAt)
       values (${item.id}, ${d.name}, ${d.companyId}, ${d.value}, ${d.stage}, ${d.closeOn}::date,
               ${d.ownerId ?? me.id}, case when ${d.stage} = 'won' then now() end)`,
    );

    return dealById(item.id!);
  },

  /**
   * Every edit goes through here, a board drag included. A stage change also
   * logs a stage activity on the deal's timeline, in the same transaction.
   */
  update: (item) => {
    let me = requireUser();
    let d = clean(item);

    tx(() => {
      let before = sql<{ stage: Stage }>(`select stage from deals where id = ${item.id} for update`).firstOrThrow();

      sql(
        `update deals set name = ${d.name}, companyId = ${d.companyId}, value = ${d.value},
           stage = ${d.stage}, closeOn = ${d.closeOn}::date, ownerId = ${d.ownerId},
           wonAt = case when ${d.stage} = 'won' then coalesce(wonAt, now()) end
         where id = ${item.id}`,
      );

      if (before.stage !== d.stage) {
        sql(
          `insert into activities (dealId, userId, kind, fromStage, toStage)
           values (${item.id}, ${me.id}, 'stage', ${before.stage}, ${d.stage})`,
        );
      }
    });

    return dealById(item.id);
  },

  delete: (item) => {
    requireOwner();
    sql(`delete from deals where id = ${item.id}`);
  },
});

const ACTIVITY_COLUMNS = sql.raw(`
  a.id, a.dealId, a.userId, a.kind, a.body, a.fromStage, a.toStage, a.createdAt,
  u.name as authorName, d.name as dealName
`);

/**
 * Timeline entries. The channel is pinned so the activities trigger can
 * notify it: a stage change logged inside a transaction above reaches every
 * open timeline without a view in hand.
 */
export let activities: LiveTable<Activity> = new LiveTable<Activity>({
  channel: (partition) => (partition ? `activities:${partition}` : "activities"),

  select: (p) => sql<Activity>(
    `select ${ACTIVITY_COLUMNS}
     from activities a
     join deals d on d.id = a.dealId
     left join users u on u.id = a.userId
     where (${p.dealId ?? null}::uuid is null or a.dealId = ${p.dealId ?? null}::uuid)
     order by a.createdAt desc
     limit 200`,
  ),

  insert: (item) => {
    let me = requireUser();
    let body = (item.body ?? "").trim();
    let kind = item.kind ?? "note";

    if (!["note", "call", "email"].includes(kind)) {
      throw new ValidationError("log a note, a call or an email");
    }

    if (!body) {
      throw new ValidationError("write something to log");
    }

    return sql<Activity>(
      `with a as (
         insert into activities (id, dealId, userId, kind, body)
         values (${item.id}, ${item.dealId}, ${me.id}, ${kind}, ${body})
         returning *
       )
       select ${ACTIVITY_COLUMNS}
       from a join deals d on d.id = a.dealId left join users u on u.id = a.userId`,
    ).firstOrThrow();
  },

  update: () => {
    throw new ValidationError("timeline entries cannot be edited");
  },

  delete: (item) => {
    requireOwner();
    sql(`delete from activities where id = ${item.id}`);
  },
});

export interface DealSummary {
  id: string;
  name: string;
  value: number;
  stage: Stage;
}

export function companyDeals(companyId: string | null): DealSummary[] {
  if (!companyId) {
    return [];
  }

  return sql<DealSummary>(
    `select id, name, value, stage from deals where companyId = ${companyId}
     order by array_position(array['lead','qualified','proposal','negotiation','won','lost']::dealStage[], stage), value desc`,
  ).all();
}
