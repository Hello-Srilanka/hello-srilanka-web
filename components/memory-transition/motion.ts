import type { gsap as GSAP } from 'gsap';

// Layout is read only while GSAP constructs/refreshes the timeline. There is no
// React state, DOM measurement, new pin or requestAnimationFrame loop per frame.
export function buildMemoryTimeline(gsap: typeof GSAP, root: HTMLElement) {
  root.dataset.memoryEnhanced = 'true';
  const get = (selector: string) => root.querySelector<HTMLElement>(selector)!;
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const itinerary = get('[data-memory-itinerary]');
  const paper = get('[data-sample-itinerary]');
  const image = get('[data-sample-itinerary] img');
  const wall = get('[data-memory-wall]');
  const invitation = get('[data-memory-invitation]');
  const phone = get('[data-memory-phone-scene]');
  const composer = get('[data-memory-composer]');
  const travellers = all('[data-travel-memory]');
  const neighbours = all('[data-community-memory]');
  const heading = invitation.querySelector('h2')!;

  // Offset coordinates ignore the preceding Find Yours camera transform.
  const box = (el: HTMLElement) => {
    let x = 0, y = 0, node: HTMLElement | null = el;
    while (node && node !== root) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
    return { x, y, width: el.offsetWidth, height: el.offsetHeight };
  };
  const relative = (el: HTMLElement) => {
    const bounds = box(el), origin = box(wall);
    return { ...bounds, x: bounds.x - origin.x, y: bounds.y - origin.y };
  };
  const row = (card: HTMLElement) => {
    const sheet = relative(image);
    return { x: sheet.x + sheet.width * 100 / 1440, y: sheet.y + sheet.height * Number(card.dataset.rowTop) / 1920,
      width: sheet.width * 1240 / 1440, height: sheet.height * Number(card.dataset.rowHeight) / 1920 };
  };
  const floating = (index: number) => {
    const w = root.offsetWidth, h = root.offsetHeight, origin = box(wall);
    const width = Math.min(345, w * .27), height = Math.min(235, h * .26);
    const coords = [[.08, .35], [.54, .20], [.29, .64], [.68, .62]][index];
    return { x: w * coords[0] - origin.x, y: h * coords[1] - origin.y, width, height };
  };
  const galleryBox = (index: number) => {
    // The phone is centered with a CSS transform. Offset geometry deliberately
    // ignores transforms, so account for this one stable layout transform here.
    const slot = relative(get(`[data-gallery-slot="${index}"]`)), frame = get('[data-memory-phone]');
    return { ...slot, x: slot.x - frame.offsetWidth / 2 + frame.clientLeft,
      y: slot.y - frame.offsetHeight * .42 + frame.clientTop };
  };
  const heroBox = () => {
    const slot = relative(get('[data-composer-photo]')), frame = get('[data-memory-phone]');
    return { ...slot, x: slot.x - frame.offsetWidth / 2 + frame.clientLeft,
      y: slot.y - frame.offsetHeight * .42 + frame.clientTop };
  };
  const rectangle = (read: () => ReturnType<typeof box>) => ({
    x: () => read().x, y: () => read().y, width: () => read().width, height: () => read().height,
  });
  const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  gsap.set([phone, invitation, get('[data-memory-note]'), composer, ...neighbours], { autoAlpha: 0 });
  gsap.set(get('[data-composer-photo] img'), { opacity: 0 });
  gsap.set(get('[data-share-check]'), { opacity: 0 });
  gsap.set(all('[data-memory-details]'), { autoAlpha: 0 });
  gsap.set(all('[data-moment-label]'), { autoAlpha: 0 });
  travellers.forEach((card, index) => {
    const photo = card.querySelector<HTMLElement>('[data-memory-photo]')!;
    const details = card.querySelector<HTMLElement>('[data-memory-details]')!;
    const slot = get(`[data-memory-slot="${index}"]`);
    gsap.set(card, { ...rectangle(() => row(card)), autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' });
    timeline.fromTo(card, { ...rectangle(() => row(card)), autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' },
      { ...rectangle(() => row(card)), autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 5 }, 10 + index * 5)
      .to(card, { ...rectangle(() => floating(index)), rotation: [-2, 2, 1, -2][index], duration: 13 }, 37 + index * 2)
      .to(card.querySelector('[data-moment-label]'), { autoAlpha: 1, duration: 4 }, 43 + index * 2)
      .to(card, { y: () => floating(index).y - 12, duration: 5, ease: 'sine.inOut' }, 53 + index)
      .to(card.querySelector('[data-moment-label]'), { autoAlpha: 0, duration: 3 }, 60)
      .to(card, { ...rectangle(() => galleryBox(index)), rotation: 0, duration: 9 }, 62 + index)
      .to(card, { ...rectangle(() => relative(slot)), rotation: 0, duration: 11 }, 82 + index)
      .to(details, { autoAlpha: 1, duration: 5 }, 86 + index)
      .to(photo, { height: () => Math.max(40, slot.offsetHeight - 120), duration: 8 }, 85 + index);
    if (index === 2) {
      gsap.set(card, { outline: '2px solid transparent', outlineOffset: 2 });
      timeline.to(card, { outlineColor: '#a84d35', duration: 1.5 }, 72.5)
        .to(card, { ...rectangle(heroBox), duration: 5 }, 74)
        .to(card, { outlineColor: 'transparent', duration: 2 }, 82)
        .to(card.querySelector('[data-memory-save]'), { fill: '#12372a', color: '#12372a', duration: 2 }, 94);
    } else {
      timeline.to(card, { autoAlpha: 0, duration: 2 }, 74)
        .to(card, { autoAlpha: 1, duration: 3 }, 82 + index);
    }
  });
  timeline.to(get('.personalization-copy'), { autoAlpha: 0, y: -25, duration: 12 }, 26)
    .to(paper, { autoAlpha: 0, duration: 12 }, 33)
    .to(get('[data-memory-note]'), { autoAlpha: 1, duration: 6 }, 40)
    .to(get('[data-memory-note]'), { autoAlpha: 0, y: -12, duration: 5 }, 58)
    .to(phone, { autoAlpha: 1, duration: 5 }, 59)
    .to(composer, { autoAlpha: 1, duration: 4 }, 73)
    .to(get('[data-gallery-title]'), { autoAlpha: 0, duration: 3 }, 73)
    .to(get('[data-memory-share]'), { backgroundColor: '#a84d35', duration: 2 }, 79)
    .to(get('[data-share-check]'), { opacity: 1, duration: 2 }, 80)
    .to(get('[data-share-label]'), { opacity: .6, duration: 2 }, 80)
    .to(phone, { autoAlpha: 0, y: 16, duration: 8 }, 84)
    .fromTo(neighbours, { autoAlpha: 0, y: 28, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 7, stagger: 1.1 }, 85)
    .to(all('[data-community-memory] [data-memory-details]'), { autoAlpha: 1, duration: 5 }, 86)
    .to(all('[data-yours]'), { opacity: 0, duration: 4 }, 91)
    .to(invitation, { autoAlpha: 1, duration: 6 }, 89)
    // Leave a quiet final hold before the existing pin releases.
    .to({}, { duration: 5 }, 95);

  const setAccess = (el: HTMLElement, visible: boolean) => {
    el.inert = !visible;
    if (visible) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
  };
  const update = (time: number) => {
    setAccess(itinerary, time <= 28);
    setAccess(wall, time >= 94);
    setAccess(invitation, time >= 94);
    root.dataset.memoryPhase = time < 10 ? 'itinerary' : time < 37 ? 'moments' : time < 62 ? 'photographs' : time < 74 ? 'gallery' : time < 82 ? 'share' : time < 94 ? 'community' : 'wall';
  };
  update(0);
  return { timeline, update, focus: () => heading.focus({ preventScroll: true }), cleanup: () => {
    [itinerary, wall, invitation].forEach(el => setAccess(el, true));
    delete root.dataset.memoryEnhanced; delete root.dataset.memoryPhase;
    delete root.dataset.scrollStart; delete root.dataset.scrollEnd;
  } };
}
