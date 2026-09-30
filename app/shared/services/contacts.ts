import { LiveTable, sql, ValidationError } from "@elements/app";
import { requireUser, requireOwner } from "./auth";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string | null;
  ownerId: string | null;
  notes: string;
  createdAt: Date;
  companyName: string | null;
  ownerName: string | null;
}

const COLUMNS = sql.raw(`
  ct.id, ct.name, ct.email, ct.phone, ct.companyId, ct.ownerId, ct.notes, ct.createdAt,
  co.name as companyName, u.name as ownerName
`);

function contactById(id: string): Contact {
  return sql<Contact>(
    `select ${COLUMNS}
     from contacts ct
     left join companies co on co.id = ct.companyId
     left join users u on u.id = ct.ownerId
     where ct.id = ${id}`,
  ).firstOrThrow();
}

function clean(item: Partial<Contact>) {
  let name = (item.name ?? "").trim();

  if (!name) {
    throw new ValidationError("a contact needs a name");
  }

  return {
    name,
    email: (item.email ?? "").trim().toLowerCase(),
    phone: (item.phone ?? "").trim(),
    notes: item.notes ?? "",
    companyId: item.companyId || null,
    ownerId: item.ownerId || null,
  };
}

export let contacts: LiveTable<Contact> = new LiveTable<Contact>({
  select: (p) => sql<Contact>(
    `select ${COLUMNS}
     from contacts ct
     left join companies co on co.id = ct.companyId
     left join users u on u.id = ct.ownerId
     where (${p.companyId ?? null}::uuid is null or ct.companyId = ${p.companyId ?? null}::uuid)`,
  ),

  insert: (item) => {
    let me = requireUser();
    let c = clean(item);

    sql(
      `insert into contacts (id, name, email, phone, companyId, ownerId, notes)
       values (${item.id}, ${c.name}, ${c.email}, ${c.phone}, ${c.companyId}, ${c.ownerId ?? me.id}, ${c.notes})`,
    );

    return contactById(item.id!);
  },

  update: (item) => {
    requireUser();

    let c = clean(item);

    sql(
      `update contacts set name = ${c.name}, email = ${c.email}, phone = ${c.phone},
         companyId = ${c.companyId}, ownerId = ${c.ownerId}, notes = ${c.notes}
       where id = ${item.id}`,
    );

    return contactById(item.id);
  },

  delete: (item) => {
    requireOwner();
    sql(`delete from contacts where id = ${item.id}`);
  },
});

/**
 * RFC 4180: quote every field, double any quote inside it. A field a
 * spreadsheet would run as a formula gets a leading apostrophe; a phone
 * number such as "+1 415 555 0142" is left alone.
 */
export function csvField(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);

  if (/^[=@\t\r]/.test(s) || /^[+-][^\d\s(]/.test(s)) {
    s = "'" + s;
  }

  return `"${s.replace(/"/g, '""')}"`;
}

export function contactsCsv(): string {
  let rows = sql<Contact>(
    `select ${COLUMNS}
     from contacts ct
     left join companies co on co.id = ct.companyId
     left join users u on u.id = ct.ownerId
     order by lower(ct.name)`,
  ).all();

  let header = ["Name", "Email", "Phone", "Company", "Owner", "Notes", "Created"];
  let lines = [header.map(csvField).join(",")];

  for (let r of rows) {
    lines.push([r.name, r.email, r.phone, r.companyName, r.ownerName, r.notes, new Date(r.createdAt).toISOString()].map(csvField).join(","));
  }

  return lines.join("\r\n") + "\r\n";
}
