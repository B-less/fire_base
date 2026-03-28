import { NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizePhoneNumber } from '@/lib/contacts';
import { adminDb } from '@/lib/firebase-admin';
import type { MatchedContact } from '@/lib/types';

const MatchContactsRequestSchema = z.object({
  phones: z.array(z.string()).max(1000),
});

const buildMatchedContact = (
  phone: string,
  value: unknown
): MatchedContact | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const user = value as {
    name?: unknown;
    profilePicture?: unknown;
  };

  if (typeof user.name !== 'string' || !user.name.trim()) {
    return null;
  }

  return {
    id: phone,
    name: user.name.trim(),
    phone,
    profilePicture:
      typeof user.profilePicture === 'string' ? user.profilePicture : undefined,
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedRequest = MatchContactsRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const phones = Array.from(
      new Set(
        parsedRequest.data.phones
          .map(normalizePhoneNumber)
          .filter((phone): phone is string => phone !== null)
      )
    );

    if (phones.length === 0) {
      return NextResponse.json([]);
    }

    const matchedUsers = await Promise.all(
      phones.map(async (phone) => {
        const snapshot = await adminDb.ref(`users/${phone}`).get();
        if (!snapshot.exists()) {
          return null;
        }

        return buildMatchedContact(phone, snapshot.val());
      })
    );

    return NextResponse.json(
      matchedUsers
        .filter((user): user is MatchedContact => user !== null)
        .sort((left, right) => left.name.localeCompare(right.name))
    );
  } catch (error) {
    console.error('Failed to match contacts.', error);
    return NextResponse.json(
      { error: 'Failed to match contacts.' },
      { status: 500 }
    );
  }
}
