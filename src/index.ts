import { createDAVClient } from "tsdav";
import { dataBos } from "./databos";

console.log("Hello via Bun!");

const client = await createDAVClient({});
