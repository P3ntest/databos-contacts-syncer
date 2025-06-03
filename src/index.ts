import vCardsJS from "vcards-js";
import { createDAVClient } from "tsdav";
import { dataBos } from "./databos";

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

  const vcards = await client.fetchVCards({
    addressBook: addressBook,
  });

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

  for (const contact of contacts) {
    console.log(`Processing contact: ${contact.name}`);

    const fullContact = await dataBos.getContact(sessionToken, contact.id);

    const card = vCardsJS();
    card.version = "4.0";
    card.firstName = contact.firstname;
    card.lastName = contact.lastname;
    // card.organization = Bun.env.CONTACT_ORGANIZATION;
    card.uid = " hello world";
    // card.photo.attachFromUrl(fullContact.avatar, "JPEG");

    // both phones
    // card.cellPhone = fullContact.mobile;
    // card.homePhone = fullContact.homephone;
    // card.workPhone = fullContact.officephone;

    // card.email = fullContact.ffoMail || fullContact.email;

    // card.homeAddress = {
    //   street: fullContact.street,
    //   city: fullContact.city,
    //   postalCode: fullContact.zipcode.toString(),
    //   label: "Home",
    //   stateProvince: fullContact.appartment,
    //   countryRegion: "Germany",
    // };

    const cardString = card.getFormattedString();
    const vCardName = `${contact.id}.vcf`;

    console.log(`Creating vCard for ${contact.name} with ID ${contact.id}`);
    console.log("vCard content:", cardString);
    console.log("vCard filename:", vCardName);
    const res = await client.createVCard({
      addressBook: addressBook,
      vCardString: cardString,
      filename: vCardName,
    });
    console.log(`Created vCard for ${contact.name}`, await res.text());

    break;
  }
}

sync();
