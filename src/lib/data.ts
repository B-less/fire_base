import type { Contact, Message } from './types';

export const CONTACTS: Contact[] = [];

// Since we are using localStorage as a mock database, we will store all messages here.
// The key will be a sorted combination of the two users' phone numbers.
// e.g., "user1-user2"
export type AllMessages = {
    [key: string]: Message[];
}
