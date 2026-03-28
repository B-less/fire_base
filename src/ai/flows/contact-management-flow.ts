'use server';

import { ai } from '@/ai/genkit';
import { toContactMap } from '@/lib/contacts';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { z } from 'genkit';

const ContactMutationInputSchema = z.object({
  idToken: z.string().min(1),
  contactPhoneNumber: z.string().regex(/^\+[1-9][0-9]{6,14}$/),
});

const ContactMutationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

type ContactMutationInput = z.infer<typeof ContactMutationInputSchema>;
type ContactMutationOutput = z.infer<typeof ContactMutationOutputSchema>;

const getCallerPhoneNumber = async (idToken: string) => {
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  if (!decodedToken.uid || !/^\+[1-9][0-9]{6,14}$/.test(decodedToken.uid)) {
    throw new Error('Invalid authenticated user.');
  }

  return decodedToken.uid;
};

const toNodeValue = (contacts: Record<string, true>) =>
  Object.keys(contacts).length > 0 ? contacts : null;

const addContactFlow = ai.defineFlow(
  {
    name: 'addContactFlow',
    inputSchema: ContactMutationInputSchema,
    outputSchema: ContactMutationOutputSchema,
  },
  async ({ idToken, contactPhoneNumber }) => {
    const callerPhoneNumber = await getCallerPhoneNumber(idToken);

    if (callerPhoneNumber === contactPhoneNumber) {
      return { success: false, message: 'You cannot add yourself as a contact.' };
    }

    const callerRef = adminDb.ref(`users/${callerPhoneNumber}/contacts`);
    const contactRef = adminDb.ref(`users/${contactPhoneNumber}/contacts`);
    const contactUserRef = adminDb.ref(`users/${contactPhoneNumber}`);

    const [callerSnapshot, contactSnapshot, contactUserSnapshot] = await Promise.all([
      callerRef.get(),
      contactRef.get(),
      contactUserRef.get(),
    ]);

    if (!contactUserSnapshot.exists()) {
      return { success: false, message: 'That user was not found.' };
    }

    const callerContacts = toContactMap(callerSnapshot.val());
    const contactContacts = toContactMap(contactSnapshot.val());

    callerContacts[contactPhoneNumber] = true;
    contactContacts[callerPhoneNumber] = true;

    await adminDb.ref().update({
      [`users/${callerPhoneNumber}/contacts`]: toNodeValue(callerContacts),
      [`users/${contactPhoneNumber}/contacts`]: toNodeValue(contactContacts),
    });

    return { success: true, message: 'Contact added successfully.' };
  }
);

const removeContactFlow = ai.defineFlow(
  {
    name: 'removeContactFlow',
    inputSchema: ContactMutationInputSchema,
    outputSchema: ContactMutationOutputSchema,
  },
  async ({ idToken, contactPhoneNumber }) => {
    const callerPhoneNumber = await getCallerPhoneNumber(idToken);

    const callerRef = adminDb.ref(`users/${callerPhoneNumber}/contacts`);
    const contactRef = adminDb.ref(`users/${contactPhoneNumber}/contacts`);

    const [callerSnapshot, contactSnapshot] = await Promise.all([callerRef.get(), contactRef.get()]);
    const callerContacts = toContactMap(callerSnapshot.val());
    const contactContacts = toContactMap(contactSnapshot.val());

    delete callerContacts[contactPhoneNumber];
    delete contactContacts[callerPhoneNumber];

    await adminDb.ref().update({
      [`users/${callerPhoneNumber}/contacts`]: toNodeValue(callerContacts),
      [`users/${contactPhoneNumber}/contacts`]: toNodeValue(contactContacts),
    });

    return { success: true, message: 'Contact removed successfully.' };
  }
);

export async function addContact(input: ContactMutationInput): Promise<ContactMutationOutput> {
  return addContactFlow(input);
}

export async function removeContact(input: ContactMutationInput): Promise<ContactMutationOutput> {
  return removeContactFlow(input);
}
