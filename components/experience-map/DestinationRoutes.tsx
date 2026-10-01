import { destinationRoutes, destinationRoutePosition } from '@/lib/experience-map/destinationRoutes';
import styles from './experience-map.module.css';

type Props = {
  selected: string | null;
};

export function DestinationRoutes({ selected }: Props) {
  return <svg className={styles.destinationRoutes} viewBox="0 0 800 800" aria-hidden="true" data-route-selected={Boolean(selected)}>
    <defs>{destinationRoutes.map(route => <mask key={route.destination.id} id={`destination-route-mask-${route.destination.id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
      <path data-destination-route-reveal={route.destination.id} d={route.path} fill="none" stroke="white" strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset="0" />
    </mask>)}</defs>
    {destinationRoutes.map(route => {
      const tip = destinationRoutePosition(route, 1);
      return <g key={route.destination.id} data-destination-route={route.destination.id} data-route-active={route.destination.id === selected} className={styles.destinationRoute}>
        <path className={styles.destinationRouteLine} d={route.path} mask={`url(#destination-route-mask-${route.destination.id})`} fill="none" strokeDasharray=".5 6" strokeLinecap="round" />
        <g data-destination-route-arrow={route.destination.id} transform={`translate(${tip.x} ${tip.y}) rotate(${tip.angle})`}>
          <path d="M-5-2.5L0 0L-5 2.5" className={styles.destinationRouteArrow} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>;
    })}
  </svg>;
}
