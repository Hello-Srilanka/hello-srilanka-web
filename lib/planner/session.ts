import { defaults, readPreferences, type Preferences } from './model';
import { flowVersion, restoreDiscoveryStep, reviewStep } from './discovery';

export const plannerSessionKey = 'hellosrilanka-planner-session-v2';
export const legacyPlannerStorageKey = 'hellosrilanka-planner-v1';
export const plannerSessionTtl = 2 * 60 * 60 * 1000;

export type PlannerSession = {
  preferences: Preferences;
  step: number;
  furthest: number;
  editing: boolean;
  screen: 'form' | 'generating';
  requestId: string | null;
};

export function serializePlannerSession(state: PlannerSession, now = Date.now()) {
  return JSON.stringify({ version: 2, flowVersion, expiresAt: now + plannerSessionTtl, ...state });
}

export function parsePlannerSession(raw: string, now = Date.now()): PlannerSession | null {
  const data = JSON.parse(raw);
  if (data.version !== 2 || typeof data.expiresAt !== 'number' || data.expiresAt <= now) return null;
  const preferences = readPreferences(data.preferences);
  const step = restoreDiscoveryStep(data.step, data.flowVersion);
  const furthest = Math.max(step, restoreDiscoveryStep(data.furthest ?? data.step, data.flowVersion));
  const requestId = typeof data.requestId === 'string' && /^[a-f0-9-]{36}$/.test(data.requestId) ? data.requestId : null;
  const generating = data.screen === 'generating' && requestId !== null;
  return { preferences, step: generating ? reviewStep : step, furthest: generating ? reviewStep : furthest, editing: data.flowVersion === flowVersion && !!data.editing, screen: generating ? 'generating' : 'form', requestId };
}

export function isPristinePlannerSession(state: PlannerSession) {
  return state.screen === 'form' && state.step === 0 && state.furthest === 0 && !state.editing && state.requestId === null && JSON.stringify(state.preferences) === JSON.stringify(defaults);
}
