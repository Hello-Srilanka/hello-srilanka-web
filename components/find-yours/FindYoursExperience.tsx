'use client';
import { useRef, type ReactNode } from 'react';
import { Check, MoveDown, Undo2 } from 'lucide-react';
import { dayLabels, plannedStops, selectedInterests } from '@/lib/find-yours/journey';
import { JourneyScene } from './JourneyScene';
import { useFindYoursScroll } from './useFindYoursScroll';
import styles from './find-yours.module.css';

const storyNotes = [
  { text: 'Where to first?', start: 17, end: 27 },
  { text: 'Too much travelling?', start: 28, end: 37 },
  { text: 'Time and budget running out?', start: 38, end: 48 },
  { text: 'Let’s rewind.', start: 49, end: 64 },
  { text: 'What do you love?', start: 69, end: 79 },
  { text: 'Your trip. Your way.', start: 81, end: 87 },
  { text: 'Ready to go?', start: 88, end: 93 },
];

export function FindYoursExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useFindYoursScroll(root);
  return <div ref={root} className={styles.experience}>
    <a className={styles.skip} data-skip-story="" href="#your-planner">Skip to your planner</a>
    <div className={styles.stage} data-find-stage="">
      <div className={styles.intro} data-question="">
        <p className="eyebrow">03 — FIND YOURS</p>
        <h2 className="display">BUT WHICH<br />SRI LANKA<br /><span>IS YOURS?</span></h2>
        <MoveDown className={styles.introArrow} size={54} strokeWidth={1} aria-hidden="true" />
      </div>
      <div className={styles.animated} data-animated-scene=""><JourneyScene /></div>
      <div className={styles.storyNotes} aria-hidden="true">
        {storyNotes.map(note => <p key={note.start} data-story-note="" data-start={note.start} data-end={note.end}>{note.text}</p>)}
      </div>
      <div className={styles.fallback}>
        <figure><figcaption className={styles.caption}>Where to first?</figcaption><JourneyScene state="messy" /><p className={styles.srOnly}>An illustrative unplanned journey doubles back between Colombo, Ella, Galle, Kandy, Yala and Mirissa. Days and budget drain during transfers, and rain clashes with a beach activity.</p></figure>
        <div className={styles.rewindCaption}><Undo2 size={36} strokeWidth={1} aria-hidden="true" /><span>Let’s rewind.</span></div>
        <figure><figcaption className={styles.caption}>Still at home.</figcaption><JourneyScene state="home" /><div className={styles.staticChoices}>{selectedInterests.map(interest => <span key={interest.name}>{interest.name}<Check size={14} aria-hidden="true" /></span>)}</div><p className={styles.srOnly}>The journey rewinds into a laptop. The traveller is still at home, choosing Nature, Culture and Wildlife for a balanced seven-day trip in HelloSriLanka.</p></figure>
        <figure><figcaption className={styles.caption}>Your trip. Your way.</figcaption><JourneyScene state="planned" /><ol className={styles.staticRoute}>{plannedStops.map((stop, i) => <li key={stop.id}><span>{dayLabels[i]}</span>{stop.name.replace(' National Park', '')}</li>)}</ol><p className={styles.srOnly}>A sample route progresses from BIA to Kandy, Ella, Udawalawe, Mirissa and Galle. Activities and days line up, with time and budget distributed more evenly. These are symbolic indicators, not prices or weather predictions.</p></figure>
        <figure><figcaption className={styles.caption}>Ready to go?</figcaption><JourneyScene state="phone" /><p className={styles.srOnly}>The itinerary moves to the phone beside the packed suitcase and passport. Continue into the interactive HelloSriLanka planner below.</p></figure>
      </div>
      <p className={styles.desktopDescription}>An unplanned journey crosses the island repeatedly, using up days and budget, with a beach activity caught in rain. Rewind: the traveller is still at home. On their laptop they select Nature, Culture and Wildlife. A balanced seven-day example route connects BIA, Kandy, Ella, Udawalawe, Mirissa and Galle, then moves to their phone. The following planner lets you choose your own interests. This is an illustration, not a forecast or a budget estimate.</p>
      <div id="your-planner" className={styles.planner} data-live-planner="">{children}</div>
    </div>
  </div>;
}
