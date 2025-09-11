
'use server';

import { db } from '@/lib/firebase';
import { push, ref, serverTimestamp } from 'firebase/database';

export type AIFeature = 'chat' | 'image' | 'video' | 'smart-reply' | 'push-notification';

export async function logAIUsage(feature: AIFeature, metadata: Record<string, any> = {}) {
  try {
    const logRef = ref(db, 'aiUsageLogs');
    await push(logRef, {
      feature,
      timestamp: serverTimestamp(),
      ...metadata,
    });
  } catch (error) {
    console.error(`Failed to log AI usage for feature: ${feature}`, error);
  }
}

    