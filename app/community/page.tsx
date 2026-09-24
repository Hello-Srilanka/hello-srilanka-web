import { redirect } from 'next/navigation';

// Keep existing links and saved story fragments working after the rename.
export default function CommunityPage() { redirect('/memories'); }
