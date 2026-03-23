
'use server';

import { admin, adminDb } from '@/lib/firebase-admin';

export type AIFeature = 'chat' | 'image' | 'video' | 'smart-reply' | 'push-notification';

export async function logAIUsage(feature: AIFeature, metadata: Record<string, unknown> = {}) {
  try {
    const logRef = adminDb.ref('aiUsageLogs');
    await logRef.push({
      feature,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      ...metadata,
    });
  } catch (error) {
    console.error(`Failed to log AI usage for feature: ${feature}`, error);
  }
}

    
