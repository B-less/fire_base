import { NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizePhoneNumber } from '@/lib/contacts';
import { adminDb } from '@/lib/firebase-admin';
import type { MatchedContact } from '@/lib/types';

const MatchContactsRequestSchema = z.object({
  phones: z.array(z.string()).max(1000),
});

const buildMatchedContact = (phone: string, value: unknown): MatchedContact | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const user = value as {
    name?: unknown;
  };

  if (typeof user.name !== 'string' || !user.name.trim()) {
    return null;
  }

  return {
    id: phone,
    name: user.name.trim(),
    phone,
  };
};

const hydrateLegacyPublicUser = async (phone: string): Promise<MatchedContact | null> => {
  const nameSnapshot = await adminDb.ref(`users/${phone}/name`).get();
  const name = nameSnapshot.val();

  if (typeof name !== 'string' || !name.trim()) {
    return null;
  }

  const matchedUser = {
    id: phone,
    name: name.trim(),
    phone,
  };

  await adminDb.ref(`publicUsers/${phone}`).set({
    name: matchedUser.name,
  });

  return matchedUser;
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

    const publicUsersSnapshot = await adminDb.ref('publicUsers').get();
    const publicUsers = publicUsersSnapshot.exists()
      ? (publicUsersSnapshot.val() as Record<string, unknown>)
      : {};

    const matchedUsers = new Map<string, MatchedContact>();
    const missingPhones: string[] = [];

    phones.forEach((phone) => {
      const match = buildMatchedContact(phone, publicUsers[phone]);
      if (match) {
        matchedUsers.set(phone, match);
      } else {
        missingPhones.push(phone);
      }
    });

    if (missingPhones.length > 0) {
      const hydratedMatches = await Promise.all(
        missingPhones.map((phone) => hydrateLegacyPublicUser(phone))
      );

      hydratedMatches.forEach((match) => {
        if (match) {
          matchedUsers.set(match.phone, match);
        }
      });
    }

    return NextResponse.json(
      Array.from(matchedUsers.values())
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
