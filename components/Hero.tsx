import { ArrowDown, ArrowUpRight, MoveUpRight } from 'lucide-react';
import { HeroMedia } from './HeroMedia';
export function Hero() {
 return <section id="arrive" data-chapter="01" className="hero" aria-labelledby="hero-title"><HeroMedia /><div className="hero-shade" />
  <div className="hero-content"><p className="eyebrow hero-eyebrow"></p><h1 id="hero-title">FIND YOUR<br /><span>SRI LANKA.</span></h1><div className="hero-details"><div><p className="hero-description">One island. A thousand ways to experience it.<br /> We create a journey around the way you want to travel.</p><div className="hero-actions"><a href="/plan" className="button button-sand">Plan My Journey <ArrowUpRight size={20} /></a><a href="#experience" className="text-link">Explore Sri Lanka <ArrowDown size={16} /></a></div></div><div className="hero-side-note"></div></div></div>
  
 </section>;
}
