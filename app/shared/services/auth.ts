import { sql, session, redirect, AuthError, ForbiddenError, ValidationError } from "@elements/app";
import { Role } from "./format";

export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const MIN_PASSWORD = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** The signed-in user, read fresh from the database, or undefined. */
export function currentUser(): Me | undefined {
  let id = session.get("userId");

  if (!id) {
    return undefined;
  }

  return sql<Me>(`select id, name, email, role from users where id = ${id}`).first();
}

/** Every page and handler starts here: the team's data is private to the team. */
export function requireUser(): Me {
  session.isLoggedInOrThrow();

  let me = currentUser();

  if (!me) {
    throw new AuthError("your account no longer exists");
  }

  return me;
}

/** Deleting records, exporting, and inviting are the owner's alone. */
export function requireOwner(): Me {
  let me = requireUser();

  if (me.role !== "owner") {
    throw new ForbiddenError("only the owner can do that");
  }

  return me;
}

/** For a page route: signed out goes to /signin rather than a 401 page. */
export function pageUser(): Me | undefined {
  let me = session.isLoggedIn() ? currentUser() : undefined;

  if (!me) {
    redirect("/signin");
    return undefined;
  }

  return me;
}

export function hasUsers(): boolean {
  return !sql(`select 1 from users limit 1`).empty();
}

/** @rpc */
export function signin(email: string, password: string) {
  let address = normalizeEmail(email);

  if (!address || !password) {
    throw new AuthError("enter your email and password");
  }

  let user = sql<Me>(
    `select id, name, email, role from users
     where email = ${address}
       and passwordHash = crypt(${password}, passwordHash)`,
  ).first();

  if (!user) {
    throw new AuthError("invalid email or password");
  }

  session.login({ userId: user.id, userName: user.name, role: user.role });
}

/** @rpc */
export function signout() {
  session.logout();
}

function checkNewAccount(name: string, password: string) {
  if (!name.trim()) {
    throw new ValidationError("enter your name");
  }

  if (password.length < MIN_PASSWORD) {
    throw new ValidationError(`password must be at least ${MIN_PASSWORD} characters`);
  }
}

/**
 * First run on an empty database: whoever sets up the team becomes its owner.
 * Refused once any user exists.
 * @rpc
 */
export function setupOwner(name: string, email: string, password: string) {
  let address = normalizeEmail(email);

  if (!isEmail(address)) {
    throw new ValidationError("enter a valid email address");
  }

  checkNewAccount(name, password);

  if (hasUsers()) {
    throw new ForbiddenError("this team already has an owner");
  }

  let user = sql<Me>(
    `insert into users (email, name, role, passwordHash)
     values (${address}, ${name.trim()}, 'owner', crypt(${password}, genSalt('bf', 12)))
     returning id, name, email, role`,
  ).firstOrThrow();

  session.login({ userId: user.id, userName: user.name, role: user.role });
}

export interface InviteInfo {
  email: string;
  invitedBy: string;
}

export function findInvite(token: string): InviteInfo | undefined {
  return sql<InviteInfo>(
    `select i.email, coalesce(u.name, 'the owner') as invitedBy
     from invites i left join users u on u.id = i.invitedById
     where i.token = ${token} and i.acceptedAt is null and i.expiresAt > now()`,
  ).first();
}

/** @rpc */
export function acceptInvite(token: string, name: string, password: string) {
  let invite = findInvite(token);

  if (!invite) {
    throw new ValidationError("this invite has expired or was already used");
  }

  checkNewAccount(name, password);

  if (!sql(`select 1 from users where email = ${invite.email}`).empty()) {
    throw new ValidationError("that email already has an account; sign in instead");
  }

  let user = sql<Me>(
    `insert into users (email, name, role, passwordHash)
     values (${invite.email}, ${name.trim()}, 'rep', crypt(${password}, genSalt('bf', 12)))
     returning id, name, email, role`,
  ).firstOrThrow();

  sql(`update invites set acceptedAt = now() where token = ${token}`);

  session.login({ userId: user.id, userName: user.name, role: user.role });
}
