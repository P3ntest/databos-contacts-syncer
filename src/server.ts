import express from "express";
import nepheleServer from "nephele";
import CustomAuthenticator, { User } from "@nephele/authenticator-custom";
import ReadOnlyPlugin from "@nephele/plugin-read-only";
import VirtualAdapter from "@nephele/adapter-virtual";

export const server = express();

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
                  name: user.username + "-contacts",
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
    plugins: [new ReadOnlyPlugin()],
    authenticator: new CustomAuthenticator({
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
