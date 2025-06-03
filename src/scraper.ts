import { redis } from "bun";
import { dataBos } from "./databos";

export async function getAuthToken(
  userId: string,
  password: string
): Promise<string> {
  const sessionKey = `auth_token:${userId}`;
  const sessionToken = await redis.get(sessionKey);

  if (sessionToken) {
    const valid = await dataBos.checkSession(sessionToken);
    if (valid) {
      return sessionToken;
    } else {
      await redis.del(sessionKey);
    }
  }

  const newSessionToken = await dataBos.authenticate({
    username: userId,
    password,
  });

  if (newSessionToken) {
    await redis.set(sessionKey, newSessionToken, "EX", 60 * 60 * 24); // Store for 24 hours
    return newSessionToken;
  }

  throw new Error("Authentication failed");
}

export function cached<T extends (...args: any[]) => Promise<any>>(
  fetchFunction: T,
  getKey: (args: Parameters<T>) => string,
  ttl: number
): T {
  return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
    const key = getKey(args);
    const cachedValue = await redis.get(key);

    if (cachedValue) {
      return JSON.parse(cachedValue) as ReturnType<T>;
    }

    const result = await fetchFunction.apply(this, args);
    await redis.set(key, JSON.stringify(result), "EX", ttl);
    return result;
  } as T;
}
