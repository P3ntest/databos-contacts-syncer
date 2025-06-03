import { DAVClient } from "tsdav";

const client = new DAVClient({
  serverUrl: "http://localhost:3000",
  credentials: {
    username: "YOUR_APPLE_ID",
    password: "YOUR_APP_SPECIFIC_PASSWORD",
  },
  authMethod: "Basic",
  defaultAccountType: "carddav",
});

(async () => {
  await client.login();

  const addressBooks = await client.fetchAddressBooks();

  const vcards = await client.fetchVCards({
    addressBook: addressBooks[0]!,
  });
  console.log("Address Books:", addressBooks);
  console.log("VCards:", vcards);
})();
