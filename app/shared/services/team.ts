import { sql } from "@elements/app";
import { Role } from "./format";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function members(): Member[] {
  return sql<Member>(`select id, name, email, role from users order by role, lower(name)`).all();
}
