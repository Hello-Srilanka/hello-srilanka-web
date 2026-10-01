import { plannerJobStore } from '../../lib/planner/async-job';

export default async function cleanupPlannerJobs() {
  const store = plannerJobStore();
  const now = Date.now();
  for await (const page of store.list({ paginate: true })) {
    for (const blob of page.blobs) {
      const entry = await store.getMetadata(blob.key);
      if (typeof entry?.metadata.expiresAt === 'number' && entry.metadata.expiresAt < now) {
        await store.delete(blob.key);
      }
    }
  }
}

export const config = { schedule: '@daily' };
