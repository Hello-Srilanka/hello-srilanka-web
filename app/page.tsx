import { Navbar } from '@/components/Navbar';
import { ChapterIndicator } from '@/components/ChapterIndicator';
import { PageMotion } from '@/components/PageMotion';
import { Hero } from '@/components/Hero';
import { ExperienceStory } from '@/components/ExperienceStory';
import { ExperienceEditorial } from '@/components/ExperienceEditorial';
import { FindYours } from '@/components/FindYours';
import { PersonalizationExperience } from '@/components/PersonalizationExperience';
import { JourneyExamples } from '@/components/JourneyExamples';
import { HowItWorks } from '@/components/HowItWorks';
import { TravelCompanion } from '@/components/TravelCompanion';
import { FinalJourneyCTA } from '@/components/FinalJourneyCTA';
import { Footer } from '@/components/Footer';
import { ArrowDownRight } from 'lucide-react';
export default function Home() {
 return <><PageMotion /><Navbar /><ChapterIndicator /><main id="main"><Hero />
 <section id="experience" data-chapter="02" aria-labelledby="experience-title"><div className="intro section-space"><div className="chapter-label"><p className="eyebrow">02 — EXPERIENCE</p><span className="eyebrow">COME FOR THE ISLAND. STAY FOR THE FEELING.</span></div><div className="intro-heading"><h2 id="experience-title" className="display">ONE ISLAND.<br />A THOUSAND WAYS<br /><span>TO EXPERIENCE IT.</span></h2><ArrowDownRight size={76} strokeWidth={.8} /></div><div className="intro-bottom"><p>From the first light in the hills<br />to the last song by the sea.</p><p>Follow the feeling.<br />See where it takes you.</p></div></div><ExperienceStory /><ExperienceEditorial /></section>
 <section id="find-yours" data-chapter="03" aria-label="Find your Sri Lanka"><FindYours /><PersonalizationExperience /></section>
 <section id="understand" data-chapter="04" aria-label="A journey designed around you"><JourneyExamples /><HowItWorks /><TravelCompanion /></section>
 <FinalJourneyCTA /></main><Footer /></>;
}
