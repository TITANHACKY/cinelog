import { eq, or } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import { users } from "@/db/schema";
import type { NewUser, User } from "@/db/schema";

export async function findUserByUsername(username: string) {
  return getDb().query.users.findFirst({
    where: eq(users.username, username),
  });
}

export async function findUserByUsernameOrEmail(
  username: string,
  email: string,
) {
  return getDb().query.users.findFirst({
    where: or(eq(users.username, username), eq(users.email, email)),
  });
}

export async function findUserById(id: number) {
  return getDb().query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function findUserAndNameConflicts(
  userId: number,
  username?: string,
  email?: string,
) {
  const db = getDb();
  const queries: SqliteBatchQuery[] = [
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
  ];

  if (username) {
    queries.push(
      db.query.users.findFirst({
        where: eq(users.username, username),
      }),
    );
  }

  if (email) {
    queries.push(
      db.query.users.findFirst({
        where: eq(users.email, email),
      }),
    );
  }

  const results = await db.batch(asBatch(queries));
  let index = 1;
  const usernameOwner = username
    ? (results[index++] as User | undefined)
    : undefined;
  const emailOwner = email ? (results[index++] as User | undefined) : undefined;

  return {
    user: results[0] as User | undefined,
    usernameOwner,
    emailOwner,
  };
}

export async function insertUser(values: NewUser) {
  const [user] = await getDb().insert(users).values(values).returning();
  return user;
}

export async function updateUser(id: number, values: Partial<NewUser>) {
  const [user] = await getDb()
    .update(users)
    .set(values)
    .where(eq(users.id, id))
    .returning();
  return user;
}
