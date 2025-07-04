import { z } from "zod";

const baseUrl = Bun.env.DATABOS_URL;

async function hashPassword(password: string) {
  const hasher = new Bun.CryptoHasher("sha1");
  hasher.update(password);
  const hash = hasher.digest();
  return hash.toString("hex");
}

async function authenticate({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const res = await fetch(baseUrl + "/api/login?isLogin=true", {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username,
      password: await hashPassword(password),
    }),
    method: "POST",
  });

  const json = await res.json();

  return z
    .object({
      sessionToken: z.string(),
      userID: z.number(),
      userInfo: z.object({}).passthrough(), // TODO
    })
    .parseAsync(json)
    .catch((err) => {
      return null;
    });
}

async function getContacts(sessionToken: string) {
  const res = await fetch(baseUrl + "/api/user/all", {
    headers: {
      authorization: sessionToken,
    },
    method: "GET",
  });

  return z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string(),
        groups: z.array(z.number()),
      })
    )
    .parseAsync(await res.json());
}

async function getContact(sessionToken: string, contactId: number) {
  const res = await fetch(baseUrl + "/api/user?userID=" + contactId, {
    headers: {
      authorization: sessionToken,
    },
  });

  return z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      ffoMail: z.string(),
      mobile: z.string(),
      homephone: z.string(),
      officephone: z.string().nullable(),
      street: z.string(),
      city: z.string(),
      appartment: z.string(),
      zipcode: z.number(),
      avatar: z.string().url(),
      groups: z.array(z.number()),
    })
    .parseAsync(await res.json());
}

async function checkSession(sessionToken: string) {
  const res = await fetch(baseUrl + "/api/session", {
    headers: {
      authorization: sessionToken,
    },
  });

  const parsed = await z
    .object({
      login: z.boolean(),
    })
    .parseAsync(await res.json());

  return parsed.login;
}

export const dataBos = {
  authenticate,
  checkSession,
  getContacts,
  getContact,
};
