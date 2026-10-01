export const nationalityProfiles = {
  India: {
    interests: ['Culture', 'Beaches', 'Food', 'Wellness', 'Local life'],
    ideas: 'Cultural and religious sites, coastal stays, sightseeing, local dining and markets, and wellness experiences.',
    source: 'https://www.sltda.gov.lk/storage/common_media/telecommunication_data_new.pdf',
  },
  'United Kingdom': {
    interests: ['Wildlife', 'Beaches', 'Adventure', 'Culture', 'Wellness'],
    ideas: 'Wildlife safaris, beach time, hiking, cultural sites, and wellness experiences.',
    source: 'https://www.sltda.gov.lk/storage/common_media/telecommunication_data_new.pdf',
  },
  China: {
    interests: ['Culture', 'Beaches', 'Scenic journeys', 'Nature'],
    ideas: 'Well-known heritage sites, beaches, tea country, scenic sightseeing, and city visits.',
    source: 'https://www.sltda.gov.lk/storage/common_media/telecommunication_data_new.pdf',
  },
  Germany: {
    interests: ['Adventure', 'Nature', 'Wildlife', 'Beaches', 'Wellness'],
    ideas: 'Hill-country hiking, wildlife, beach and water activities, heritage sites, and Ayurveda wellness.',
    source: 'https://www.sltda.gov.lk/storage/common_media/telecommunication_data_new.pdf',
  },
  Australia: {
    interests: ['Wildlife', 'Culture', 'Food', 'Nature'],
    ideas: 'Wildlife, cultural visits, and local food experiences. Evidence for an Australian activity ranking is limited.',
    source: 'https://www.abc.net.au/news/2019-04-04/australian-tourists-bored-with-bali-look-to-sri-lanka/10954176',
  },
} as const;

export type SupportedNationality = keyof typeof nationalityProfiles;
export const supportedNationalities = [
  { name: 'India', code: 'IN' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'China', code: 'CN' },
  { name: 'Germany', code: 'DE' },
  { name: 'Australia', code: 'AU' },
] as const;

export function nationalityProfile(nationality: string) {
  return Object.hasOwn(nationalityProfiles, nationality)
    ? nationalityProfiles[nationality as SupportedNationality]
    : null;
}
