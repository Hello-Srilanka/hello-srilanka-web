'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cultureChapters } from '@/lib/culture/chapters';
import { CultureArtwork } from './CultureArtwork';
import { CultureGallery } from './CultureGallery';
import { CultureThread } from './CultureThread';
import { useCultureScroll } from './useCultureScroll';
import styles from './culture.module.css';

export function CultureExperience() {
  const root = useRef<HTMLElement>(null);
  const navigate = useCultureScroll(root);
  return <section id="experiences" ref={root} className={styles.experience} aria-labelledby="culture-title">
    <div className={styles.stage} data-culture-stage>
      <div className={styles.night} aria-hidden="true" />
      <CultureThread />
      <nav className={styles.navigation} aria-label="Culture chapters">
        {cultureChapters.map((chapter, i) => <a key={chapter.id} href={`#culture-${chapter.id}`} data-culture-nav aria-label={`${chapter.number} — ${chapter.keyword}: ${chapter.name}`} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          // This section maps links to timeline positions; do not also let Lenis seek the DOM panel.
          event.preventDefault();
          event.stopPropagation();
          if (!navigate.current?.(i + 1)) {
            const panel = document.getElementById(`culture-${chapter.id}`);
            const nav = event.currentTarget.closest('nav');
            if (panel && nav) window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 900 ? 91 : 76) - nav.offsetHeight - 12, behavior: 'instant' });
          }
          history.pushState(null, '', `#culture-${chapter.id}`);
        }}><i aria-hidden="true" /></a>)}
      </nav>
      <div className={`${styles.panel} ${styles.intro}`} id="culture-intro" data-culture-panel>
        <div><h2 id="culture-title">AN ISLAND<br />YOU DON’T JUST SEE.<br /><em>YOU FEEL IT.</em></h2></div>
      </div>
      {cultureChapters.map(chapter => <section key={chapter.id} id={`culture-${chapter.id}`} className={styles.panel} data-culture-panel data-theme={chapter.theme} aria-labelledby={`culture-${chapter.id}-title`}>
        <div className={styles.copy}><h3 id={`culture-${chapter.id}-title`}>{chapter.title.map((line,i) => <span key={line} className={i === chapter.title.length - 1 ? styles.accent : undefined}>{line}</span>)}</h3><div className={styles.illustration}><CultureArtwork type={chapter.id} /></div></div>
        <div className={styles.artwork}><CultureGallery type={chapter.id} name={chapter.name} /></div>
      </section>)}
      <div id="culture-finale" className={`${styles.panel} ${styles.finale}`} data-culture-panel><div><h3>NOT KEPT<br />BEHIND GLASS.<br /><em>STILL BEING LIVED.</em></h3><Link href="/memories" className={styles.cta}>Explore the stories <ArrowUpRight size={24} strokeWidth={1.5} /></Link></div></div>
    </div>
  </section>;
}
