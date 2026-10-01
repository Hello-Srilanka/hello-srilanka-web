// Equal-length point sets let the same path flow between forms without a morph plugin.
const forms = [
  [[-180,0],[110,60],[430,140],[468,338],[331,454],[181,395],[231,256],[453,340],[760,590]],
  [[-180,300],[142,403],[188,278],[144,180],[239,265],[319,385],[395,298],[465,173],[760,370]],
  [[-180,411],[82,443],[155,440],[220,450],[298,436],[366,447],[439,439],[530,451],[760,400]],
  [[-180,380],[116,382],[163,168],[350,103],[477,248],[368,428],[175,409],[196,272],[760,348]],
  [[-180,270],[150,271],[450,271],[450,315],[150,315],[150,360],[450,360],[450,401],[760,401]],
  [[-180,430],[136,448],[264,418],[320,302],[321,199],[354,141],[450,277],[399,388],[760,281]],
  [[-180,79],[80,117],[145,138],[235,113],[313,89],[403,147],[483,150],[555,128],[760,65]],
  [[-180,10],[111,54],[352,121],[455,265],[428,404],[309,462],[313,535],[408,635],[410,880]],
] as const;

export function threadPath(from: number, to = from, amount = 0) {
  const points = forms[from].map((point, i) => point.map((n, axis) => n + (forms[to][i][axis] - n) * amount));
  let path = `M${points[0].join(' ')}`;
  for (let i = 0; i < points.length - 1; i++) {
    const before = points[Math.max(0, i - 1)], a = points[i], b = points[i + 1], after = points[Math.min(points.length - 1, i + 2)];
    path += ` C${a[0] + (b[0] - before[0]) / 6} ${a[1] + (b[1] - before[1]) / 6} ${b[0] - (after[0] - a[0]) / 6} ${b[1] - (after[1] - a[1]) / 6} ${b.join(' ')}`;
  }
  return path;
}
export function CultureThread() {
  return <svg data-culture-thread viewBox="0 0 600 600" aria-hidden="true" focusable="false"><path d={threadPath(0)} fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg>;
}
