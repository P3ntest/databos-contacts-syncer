import express from "express";
import morgan from "morgan";
import nepheleServer from "nephele";
import type { AuthResponse, Method, Plugin, Resource } from "nephele";
import CustomAuthenticator, { User } from "@nephele/authenticator-custom";
import ReadOnlyPlugin from "@nephele/plugin-read-only";
import VirtualAdapter from "@nephele/adapter-virtual";

export const server = express();

class RedirectPlugin implements Plugin {
  prePropfind?: (
    request: express,
    response: AuthResponse,
    data: { method: Method; resource: Resource; depth: string }
  ) => Promise<false | void> = async (request, response, data) => {
    // Redirect to a specific URL if the request is for the root
    if (request.url === "/") {
      response.redirect("/addressbooks");
      return false; // Prevent further processing
    }
  };
}

server.use(morgan("dev"));

server.use("/.well-known/carddav", (req, res, next) => {
  console.log("Redirecting to /addressbooks/user");
  // redirect to /addressbooks
  return res.redirect("/addressbooks/user");
});

server.use(
  "/",
  nepheleServer({
    async adapter(request, response) {
      const user = response.locals.user;
      if (!user) {
        return new VirtualAdapter({
          files: {
            properties: {
              creationdate: new Date(),
              getlastmodified: new Date(),
            },
            locks: {},
            children: [],
          },
        });
      }

      return new VirtualAdapter({
        files: {
          properties: {
            creationdate: new Date(),
            getlastmodified: new Date(),
          },
          locks: {},
          children: [
            {
              name: "addressbooks",
              properties: {
                creationdate: new Date(),
                getlastmodified: new Date(),
              },
              locks: {},
              children: [
                {
                  name: "user",
                  properties: {
                    creationdate: new Date(),
                    getlastmodified: new Date(),
                  },
                  locks: {},
                  children: [
                    {
                      name: "contact1.vcf",
                      properties: {
                        creationdate: new Date(),
                        getlastmodified: new Date(),
                      },
                      locks: {},
                      content: Buffer.from(`BEGIN:VCARD
VERSION:3.0
FN:John Doe${user.username}
TEL;TYPE=work,voice;VALUE=uri:tel:+1-111-555-1212
EMAIL:johndoe@example.com
END:VCARD
`),
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
    },
    plugins: [
      new ReadOnlyPlugin(),
      // new RedirectPlugin()
    ],
    authenticator: new CustomAuthenticator({
      realm: "Contacts",
      async getUser(username) {
        if (username === "admin") {
          return new User({
            username: "admin",
          });
        } else {
          return null;
        }
      },
      async authBasic(user, password) {
        return user.username === "admin" && password === "password";
      },
    }),
  })
);

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
