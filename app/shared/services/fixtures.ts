/**
 * Rows for tests. The test database never gets the development seed, so
 * each test makes the team it needs; the transaction rolls it back.
 */
import { sql, session } from "@elements/app";
import { Me } from "./auth";

export function makeUser(name: string, role: "owner" | "rep" = "rep", password = "password123"): Me {
  let email = name.toLowerCase().replace(/\s+/g, ".") + "@test.example";

  return sql<Me>(
    `insert into users (email, name, role, passwordHash)
     values (${email}, ${name}, ${role}, crypt(${password}, genSalt('bf', 4)))
     returning id, name, email, role`,
  ).firstOrThrow();
}

export function loginAs(user: Me) {
  session.login({ userId: user.id, userName: user.name, role: user.role });
}

export function makeCompany(name = "Acme"): { id: string } {
  return sql<{ id: string }>(`insert into companies (name) values (${name}) returning id`).firstOrThrow();
}

export function makeDeal(ownerId: string, fields: { name?: string; stage?: string; value?: number; companyId?: string | null } = {}): { id: string } {
  return sql<{ id: string }>(
    `insert into deals (name, stage, value, ownerId, companyId)
     values (${fields.name ?? "Deal"}, ${fields.stage ?? "lead"}::dealStage, ${fields.value ?? 1000}, ${ownerId}, ${fields.companyId ?? null})
     returning id`,
  ).firstOrThrow();
}

export function makeContact(ownerId: string, name = "Pat Doe", companyId: string | null = null): { id: string } {
  return sql<{ id: string }>(
    `insert into contacts (name, ownerId, companyId) values (${name}, ${ownerId}, ${companyId}) returning id`,
  ).firstOrThrow();
}

/** The error a call throws, or undefined when it does not throw. */
export async function thrown(fn: () => unknown): Promise<any> {
  try {
    await fn();
  } catch (err) {
    return err;
  }

  return undefined;
}
