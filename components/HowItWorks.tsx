import { ArrowDownRight } from 'lucide-react';
const steps = [
 ['TELL US ABOUT YOU', 'Dates, interests, budget and travel style.'],
 ['WE UNDERSTAND YOUR TRIP', 'Your preferences are matched with destinations and experiences throughout Sri Lanka.'],
 ['YOUR JOURNEY COMES TOGETHER', 'Receive a personalized day-by-day Sri Lanka itinerary.'],
 ['CHANGE ANYTHING', 'More beach? Less travelling? Another adventure? Your journey adapts with you.'],
];
export function HowItWorks() {
 return <section id="how-it-works" className="how-it-works section-space" aria-labelledby="how-title"><div className="how-heading"><p className="eyebrow">A LITTLE ABOUT YOU. A WORLD OF POSSIBILITIES.</p><ArrowDownRight size={35} strokeWidth={1} /></div><h2 id="how-title">From <span>“I want to visit Sri Lanka”</span><br />to a journey made for you.</h2><ol className="steps-route">{steps.map(([title, description], i) => <li key={title}><div className="step-marker">0{i + 1}</div><h3>{title}</h3><p>{description}</p></li>)}</ol></section>;
}
