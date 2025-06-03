import vCardsJS from "vcards-js";
import { element, renderToString } from "@shun-shobon/littlexml";
import { Hono } from "hono";

export const server = new Hono();

function getContacts() {
  // Placeholder for the actual implementation
  return [
    {
      id: "1",
      name: "John Doe",
      email: "john@dow.com",
    },
  ];
}

server.on("PROPFIND", "/addressbooks", (c) => {
  const contacts = getContacts();
  const root = element("d:multistatus")
    .attr("xmlns:d", "DAV:")
    .attr("xmlns:cs", "http://calendarserver.org/ns/");

  contacts.forEach((contact) => {
    root.child(
      element("d:response")
        .child(element("d:href").text(`/addressbooks/${contact.id}.vcf/`))
        .child(
          element("d:propstat")
            .child(
              element("d:prop")
                .child(element("d:getcontenttype").text("text/vcard"))
                .child(element("cs:getctag").text("1"))
                .child(element("cs:getetag").text(`"${contact.id}"`))
            )
            .child(element("d:status").text("HTTP/1.1 200 OK"))
        )
    );
  });

  return c.body(renderToString(root), 200, {
    "Content-Type": "application/xml; charset=utf-8",
  });
});

server.get("/addressbooks/:id{.+\\.vcf}", (c) => {
  const contactId = c.req.param("id").replace(".vcf", "");
  if (contactId != "1") {
    console.warn("Contact not found:", c.req.param("id"));
    return c.text("Not Found", 404);
  }
  const card = vCardsJS();
  card.firstName = "John";
  card.lastName = "Doe";
  card.email = "john.dow@example.com";
  card.workPhone = "+1234567890";

  return c.body(card.getFormattedString(), 200, {
    "Content-Type": "text/vcard; charset=utf-8",
  });
});
