export function Brand({ footer = false, href = '#arrive' }: { footer?: boolean; href?: string }) {
  // Replace this wordmark with the final Journey Mark logo; retain the accessible name.
  return <a className={`wordmark${footer ? ' wordmark-footer' : ''}`} href={href} aria-label="HelloSriLanka home">hello<span>srilanka</span><span className="brand-period">.</span></a>;
}
