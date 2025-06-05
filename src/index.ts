import { createDAVClient } from "tsdav";
import { dataBos } from "./databos";
import VCard from "vcard-creator";

console.log("Hello via Bun!");

async function sync() {
  console.log("Starting sync...");

  const client = await createDAVClient({
    serverUrl: Bun.env.DAV_URL,
    credentials: {
      username: Bun.env.DAV_USERNAME,
      password: Bun.env.DAV_PASSWORD,
    },
    authMethod: "Basic",
    defaultAccountType: "carddav",
  });

  const addressBooks = await client.fetchAddressBooks();

  if (addressBooks.length !== 1) {
    console.log("There should be exactly one address book.");
  }

  const addressBook = addressBooks[0];

  console.log("Using Address Book:", addressBook.displayName);

  const vcards = (
    await client.fetchVCards({
      addressBook: addressBook,
    })
  ).map((vcard) => ({
    ...vcard,
    uid: vcard.url.split("/").pop().replace(".vcf", ""),
  }));

  console.log(`Found ${vcards.length} vCards in the address book.`);

  console.log("Logging in to DataBos...");
  const { sessionToken } = await dataBos.authenticate({
    username: Bun.env.DATABOS_USERNAME,
    password: Bun.env.DATABOS_PASSWORD,
  });

  if (!sessionToken) {
    console.error("Failed to authenticate with DataBos.");
    return;
  }

  const contacts = await dataBos.getContacts(sessionToken);
  console.log(`Found ${contacts.length} contacts in DataBos.`);

  let i = 0;
  for (const contact of contacts) {
    i++;
    console.log(`Processing contact ${i}/${contacts.length}: ${contact.name}`);
    console.log(`Processing contact: ${contact.name}`);

    const fullContact = await dataBos.getContact(sessionToken, contact.id);

    const card = new VCard();
    card.addName(`${fullContact.name} [${contact.id}]`);
    // card.addFirstName(contact.firstname);
    // card.addLastName(contact.lastname);
    card.addCompany(Bun.env.CONTACT_ORGANIZATION);
    // card.addOrganization(Bun.env.CONTACT_ORGANIZATION, []);
    card.addUID(contact.id.toString());
    // card.setUID(contact.id.toString());

    // card.photo.attachFromUrl(fullContact.avatar, "JPEG");

    fullContact.mobile && card.addPhoneNumber(fullContact.mobile, "CELL");
    fullContact.homephone && card.addPhoneNumber(fullContact.homephone, "HOME");
    fullContact.officephone &&
      card.addPhoneNumber(fullContact.officephone, "WORK");

    fullContact.email && card.addEmail(fullContact.email);
    fullContact.ffoMail && card.addEmail(fullContact.ffoMail);

    const cardString = card.toString();
    const vCardName = `${contact.id}.vcf`;

    console.log(`Creating vCard for ${contact.name} with ID ${contact.id}`);
    console.log("vCard content:", cardString);
    console.log("vCard filename:", vCardName);

    const existingVCard = vcards.find((v) => v.uid === contact.id.toString());
    if (existingVCard) {
      console.log(`Deleting existing vCard for ${contact.name}`);
      await client.deleteVCard({
        vCard: vcards.find((v) => v.uid === contact.id.toString()),
      });
    }

    const res = await client.createVCard({
      addressBook: addressBook,
      vCardString: cardString,
      filename: vCardName,
    });
    console.log(`Created vCard for ${contact.name}`, await res.text());
  }
}

sync();
