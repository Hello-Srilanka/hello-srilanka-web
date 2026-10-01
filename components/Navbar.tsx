'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Brand } from './Brand';
const links = [['Discover', '#experience'], ['Experiences', '#experiences'], ['Memories', '/memories']];
export function Navbar({ memories = false }: { memories?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const interior = memories || account;
  useEffect(() => { const update = () => setScrolled(window.scrollY > 70); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, []);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (event.key === 'Tab') {
        const items = [toggle.current, ...Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])].filter(Boolean) as HTMLElement[];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const resize = () => { if (window.innerWidth > 900) setOpen(false); };
    document.addEventListener('keydown', key); window.addEventListener('resize', resize);
    return () => { document.body.style.overflow = original; document.removeEventListener('keydown', key); window.removeEventListener('resize', resize); };
  }, [open]);
  return <header className={`navbar${memories ? ' navbar-memories' : ''}${scrolled || open || account ? ' navbar-solid' : ''}`}>
    <Brand href={interior ? '/' : '#arrive'} />
    <nav className="desktop-nav" aria-label="Main navigation">{links.map(([name, href]) => <a key={name} href={interior && href.startsWith('#') ? `/${href}` : href} aria-current={(memories && name === 'Memories') || (account && name === 'Account') ? 'page' : undefined}>{name}</a>)}</nav>
    <a className="nav-cta" href="/plan">Plan My Journey <ArrowUpRight size={16} /></a>
    <button className="menu-toggle" ref={toggle} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <AnimatePresence>{open && <motion.div ref={panel} id="mobile-menu" data-lenis-prevent className="mobile-menu" initial={{ opacity: 0, y: reduced ? 0 : -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }}>
      <nav aria-label="Mobile navigation">{links.map(([name, href], i) => <a key={name} href={interior && href.startsWith('#') ? `/${href}` : href} aria-current={(memories && name === 'Memories') || (account && name === 'Account') ? 'page' : undefined} onClick={() => setOpen(false)}><span>0{i + 1}</span>{name}<ArrowUpRight /></a>)}<a href="/plan" className="mobile-plan">Plan My Journey <ArrowUpRight /></a></nav><p>Your Sri Lanka. Your way.</p>
    </motion.div>}</AnimatePresence>
  </header>;
}
