import { defaults, type Preferences } from './model';
import { sampleDraft } from './sample';
import { finalize } from './validation';

export const landingSamplePreferences: Preferences = {
  ...defaults,
  undecided: true,
  duration: 7,
  interests: ['Nature', 'Culture', 'Wildlife'],
  pace: 'Balanced',
  transport: 'Train & driver',
  accommodation: 'Boutique hotels',
};

// Use the same generator and validation as the planner's sample API response.
export function createLandingSample() {
  return finalize(sampleDraft(landingSamplePreferences), landingSamplePreferences, [], 'landing-sample', 'sample');
}
