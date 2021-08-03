import { IContextualContact } from '@amc-technology/davinci-api';

export function getContactId(contact: IContextualContact) {
  return (
    (contact?.channels?.length > 0 && contact.channels[0].id) ||
    contact.uniqueId
  );
}
