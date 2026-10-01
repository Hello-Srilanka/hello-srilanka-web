import { Navbar } from '@/components/Navbar';
import { ChapterIndicator } from '@/components/ChapterIndicator';
import { PageMotion } from '@/components/PageMotion';
import { Hero } from '@/components/Hero';
import { ExperienceStory } from '@/components/ExperienceStory';
import { CultureExperience } from '@/components/culture/CultureExperience';
import { FindYours } from '@/components/FindYours';
import { PersonalizationExperience } from '@/components/PersonalizationExperience';
import { MemoryTransition } from '@/components/memory-transition/MemoryTransition';
import { Footer } from '@/components/Footer';
import { SriLankaExperience } from '@/components/experience-map/SriLankaExperience';
export default function Home() {
 return <><PageMotion /><Navbar /><ChapterIndicator /><main id="main"><Hero />
 <section id="experience" data-chapter="02" aria-labelledby="experience-title"><SriLankaExperience /><div id="island-stories"><ExperienceStory /></div><CultureExperience /></section>
 <section id="find-yours" data-chapter="03" aria-label="Find your Sri Lanka"><FindYours><MemoryTransition><PersonalizationExperience /></MemoryTransition></FindYours></section>
 </main><Footer /></>;
}
