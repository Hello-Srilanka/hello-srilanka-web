import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
export function FinalJourneyCTA() {
 return <section id="go" data-chapter="05" className="final-cta" aria-labelledby="final-title"><Image src="/images/negombo-sunset.webp" alt="Beachgoers watching the last light over the ocean in Negombo, Sri Lanka" fill sizes="(max-width: 900px) 125vh, 100vw" /><div className="final-shade" /><p className="eyebrow">05 — YOUR NEXT CHAPTER</p><div className="final-content"><h2 id="final-title">THERE’S MORE THAN<br />ONE WAY TO SEE<br />SRI LANKA.</h2><p className="final-let">LET’S FIND YOURS.</p><p className="final-description">Tell us what you love.<br />We’ll help build the journey around it.</p><a href="/plan" className="button button-sand">PLAN MY SRI LANKA <ArrowUpRight size={23} /></a></div><div className="final-bottom"><p>Your Sri Lanka. Your way.</p><span>THE BEST STORIES START WITH A FEELING.</span></div></section>;
}
