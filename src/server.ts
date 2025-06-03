import express from "express";
import morgan from "morgan";
import nepheleServer from "nephele";
import type { AuthResponse, Method, Plugin, Resource } from "nephele";
import CustomAuthenticator, { User } from "@nephele/authenticator-custom";
import ReadOnlyPlugin from "@nephele/plugin-read-only";
import VirtualAdapter from "@nephele/adapter-virtual";

export const server = express();

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
      const fileDefaults = {
        properties: {
          creationdate: new Date(),
          getlastmodified: new Date(),
        },
        locks: {},
      };
      if (!user) {
        return new VirtualAdapter({
          files: {
            ...fileDefaults,
            children: [],
          },
        });
      }

      return new VirtualAdapter({
        files: {
          ...fileDefaults,
          children: [
            {
              ...fileDefaults,
              name: "addressbooks",
              children: [
                {
                  ...fileDefaults,
                  name: "user",
                  properties: {
                    ...fileDefaults.properties,
                    resourcetype: {
                      addressbook: true,
                    },
                    "supported-address-data": {
                      "address-data-type": {
                        contentType: "text/vcard",
                        version: "3.0",
                      },
                    },
                  },
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
            {
              ...fileDefaults,
              name: "principals",
              children: [
                {
                  ...fileDefaults,
                  name: "users",
                  children: [
                    {
                      ...fileDefaults,
                      name: user.username,
                      properties: {
                        ...fileDefaults.properties,
                        displayname: `User ${user.username}`,
                        "current-user-principal": {
                          href: `/principals/users/${user.username}/`,
                        },
                        "principal-URL": {
                          href: `/principals/users/${user.username}/`,
                        },

                        "addressbook-home-set": {
                          href: `/addressbooks/${user.username}/`,
                        },
                        resourcetype: {
                          principal: true,
                        },
                      },
                      children: [],
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
