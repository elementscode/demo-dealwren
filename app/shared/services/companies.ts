import { LiveTable, sql, ValidationError } from "@elements/app";
import { requireUser, requireOwner } from "./auth";

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  createdAt: Date;
}

function clean(item: Partial<Company>) {
  let name = (item.name ?? "").trim();

  if (!name) {
    throw new ValidationError("a company needs a name");
  }

  return { name, domain: (item.domain ?? "").trim(), industry: (item.industry ?? "").trim() };
}

export let companies: LiveTable<Company> = new LiveTable<Company>({
  select: () => sql<Company>(`select id, name, domain, industry, createdAt from companies`),

  insert: (item) => {
    requireUser();

    let c = clean(item);

    return sql<Company>(
      `insert into companies (id, name, domain, industry)
       values (${item.id}, ${c.name}, ${c.domain}, ${c.industry})
       returning id, name, domain, industry, createdAt`,
    ).firstOrThrow();
  },

  update: (item) => {
    requireUser();

    let c = clean(item);

    return sql<Company>(
      `update companies set name = ${c.name}, domain = ${c.domain}, industry = ${c.industry}
       where id = ${item.id}
       returning id, name, domain, industry, createdAt`,
    ).firstOrThrow();
  },

  delete: (item) => {
    requireOwner();
    sql(`delete from companies where id = ${item.id}`);
  },
});

export interface CompanyOption {
  id: string;
  name: string;
}

export function companyOptions(): CompanyOption[] {
  return sql<CompanyOption>(`select id, name from companies order by lower(name)`).all();
}
