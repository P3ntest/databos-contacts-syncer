# DataBos Contacts Syncer

This project is a simple script to sync contacts from [DataBos](https://www.databos.de/) to a CardDAV server.

It uses a reverse engineered DataBos API to fetch contacts and then uploads them to a CardDAV server using the `tsdav` package.

# How to use

Copy .env.example to .env and fill in all fields.

## Using Docker (recommended)

Build and run the Docker image (Dockerfile)

## Native

Install bun and then run `bun run start`

# Environment variables

```
DAV_URL= # URL of the CardDAV server, e.g. https://carddav.example.com
DAV_USERNAME= # Username for the CardDAV server
DAV_PASSWORD= # Password for the CardDAV server

DATABOS_URL= # The url of your DataBos instance, e.g. https://www.databos.de
DATABOS_USERNAME= # Username for DataBos (can be a number)
DATABOS_PASSWORD= # Password for DataBos

CONTACT_ORGANIZATION= # This will be set as the organization for all contacts, e.g. "My Company"
```
