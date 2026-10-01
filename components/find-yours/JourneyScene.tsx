import { CarFront, CloudRain, Coffee, Landmark, Leaf, Mountain, PawPrint, Sun, Waves } from 'lucide-react';
import { islandPaths } from '@/lib/experience-map/geography';
import { arrival, dayLabels, messyPath, messyStops, plannedPath, plannedStops, selectedInterests } from '@/lib/find-yours/journey';
import styles from './find-yours.module.css';

export type SceneState = 'animated' | 'messy' | 'home' | 'planned' | 'phone';
const activityIcons = [Landmark, Mountain, PawPrint, Waves, Landmark];
const labelOffsets = [[-115, -22], [67, -12], [90, 18], [38, 64], [-104, 30]];

function Suitcase() {
  return <g data-suitcase="" stroke="currentColor" strokeWidth="2" fill="none">
    <ellipse cx="254" cy="526" rx="73" ry="12" fill="#12372a" opacity=".06" stroke="none" />
    <path d="M235 381v-36h38v36" />
    <rect x="199" y="380" width="105" height="137" rx="12" fill="#d8d9c7" />
    <path data-case-lid="" d="M199 380l8-12h89l8 12" fill="#d8d9c7" />
    <path d="M214 391v114m75-114v114M233 404v83m20-83v83m20-83v83" opacity=".35" />
    <path data-case-seam="" d="M203 389h96" stroke="#a84d35" />
    <circle cx="218" cy="522" r="5" fill="currentColor" /><circle cx="285" cy="522" r="5" fill="currentColor" />
    <path d="M292 409l24 15-13 23-24-15z" fill="#f5f0e6" /><path d="m291 426 9 5" stroke="#a84d35" />
  </g>;
}

export function JourneyScene({ state = 'animated' }: { state?: SceneState }) {
  const home = state === 'home';
  const phone = state === 'phone';
  const planned = state === 'planned' || phone;
  return <svg className={styles.scene} data-scene-state={state} viewBox={state === 'messy' || state === 'planned' ? '540 65 580 740' : phone ? '910 315 235 305' : '120 80 1080 600'} aria-hidden="true" focusable="false">
    <g data-world="">
      <g data-home="" opacity={home || phone ? 1 : 0}>
        <text x="331" y="114" className={styles.label}>AT HOME</text>
        <ellipse cx="637" cy="554" rx="362" ry="23" fill="#12372a" opacity=".045" />
        <rect x="331" y="135" width="602" height="403" rx="16" fill="#12372a" />
        <rect x="341" y="148" width="582" height="375" rx="5" fill="#f5f0e6" />
        <circle cx="632" cy="142" r="2" fill="#83947a" />
        <path d="M331 538h602l43 25H289z" fill="#b8c2b1" stroke="#12372a" strokeWidth="1.5" />
        <path d="M567 541h130l10 11H557z" fill="#e9e8dc" />
        <text x="372" y="187" className={styles.brand}>hellosrilanka<tspan fill="#a84d35">.</tspan></text>
        <path d="M370 203h520" stroke="#d4d4c9" />
        <g data-notebook="" transform="translate(970 178) rotate(12)">
          <rect width="105" height="134" rx="2" fill="#e4dfcf" stroke="#b4b9aa" />
          <path d="M14 0v134M30 30h55m-55 16h55m-55 16h42" stroke="#a9b19f" />
          <path d="M90 40v93" stroke="#a84d35" strokeWidth="5" />
        </g>
        <g transform="translate(225 213)"><circle r="37" fill="#e8e3d5" /><circle r="25" fill="#f5f0e6" stroke="#a6ad9e" /><circle r="18" fill="#80654c" /><path d="M23-9c24-8 24 27 0 18" fill="none" stroke="#a6ad9e" strokeWidth="5" /></g>
        <Coffee x="219" y="207" width="12" height="12" color="#eee4d3" strokeWidth="1" />
      </g>

      <g data-preferences="" opacity={home || phone ? 1 : 0}>
        <text x="372" y="237" className={styles.label}>WHAT DRAWS YOU IN?</text>
        {selectedInterests.map((interest, index) => {
          const Icon = [Leaf, Landmark, PawPrint][index];
          return <g key={interest.name} data-preference="" transform={`translate(372 ${255 + index * 49})`}>
            <rect width="174" height="38" rx="2" fill="#ebece1" stroke="#b6bdaa" />
            <rect data-choice-fill="" width="174" height="38" rx="2" fill="#12372a" opacity={home || phone ? 1 : 0} />
            <g data-choice-ink="" color={home || phone ? '#f5f0e6' : '#12372a'}><Icon x="12" y="10" width="18" height="18" strokeWidth="1.3" /><text x="40" y="24" fill="currentColor" fontSize="13">{interest.name}</text><path data-choice-check="" d="m149 19 5 5 9-10" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={home || phone ? 1 : 0} /></g>
          </g>;
        })}
        <text x="372" y="443" className={styles.label}>7 DAYS · BALANCED</text>
        <path d="M372 465h165" stroke="#d4d4c9" strokeWidth="3" /><path d="M372 465h96" stroke="#a84d35" strokeWidth="3" /><circle cx="468" cy="465" r="5" fill="#a84d35" />
      </g>
      {[Leaf, Landmark, PawPrint].map((Icon, index) => <g key={index} data-interest-token="" opacity="0" transform={`translate(553 ${274 + index * 49})`}><circle r="18" fill="#12372a" /><Icon x="-10" y="-10" width="20" height="20" color="#f5f0e6" strokeWidth="1.2" /></g>)}

      <g data-phone="" opacity={phone ? 1 : 0}>
        <rect x="968" y="334" width="137" height="262" rx="19" fill="#12372a" />
        <rect x="975" y="342" width="123" height="246" rx="14" fill="#f5f0e6" />
        <rect x="1015" y="346" width="43" height="6" rx="3" fill="#12372a" />
        <text x="991" y="375" className={styles.label}>YOUR JOURNEY</text>
        <path d="M1019 578h35" stroke="#12372a" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g data-map-shell="" transform={home ? 'translate(626 209) scale(.48)' : phone ? 'translate(993 396) scale(.27)' : 'translate(670 78) scale(.88)'}>
        <g transform="translate(-250 -45)">
          <g className={styles.island}>
            {islandPaths.map((d, i) => <path key={i} d={d} fill="#dce1cc" stroke="#91a18b" strokeWidth="1.1" />)}
            <path d="M420 365q65 50 35 145M430 382q35 15 42 54" fill="none" stroke="#b7c6a7" strokeWidth="14" opacity=".3" />
          </g>
          <circle cx={arrival.x} cy={arrival.y} r="5" fill="#12372a" />
          <text x={arrival.x - 12} y={arrival.y - 14} textAnchor="end" className={styles.mapLabel}>BIA</text>
          <g data-mess="" opacity={state === 'animated' || state === 'messy' ? 1 : 0}>
            <path data-mess-route="" d={messyPath} pathLength="1" strokeDasharray="1" strokeDashoffset={state === 'messy' ? 0 : 1} fill="none" stroke="#a84d35" strokeWidth="2" strokeLinejoin="round" />
            {messyStops.map((stop, index) => <g key={stop.id} data-mess-pin="" opacity={state === 'messy' ? 1 : 0}>
              <circle data-pulse="" cx={stop.point.x} cy={stop.point.y} r="13" fill="none" stroke="#a84d35" opacity=".3" />
              <circle cx={stop.point.x} cy={stop.point.y} r="4" fill="#a84d35" />
              <text x={stop.point.x + (index % 2 ? 12 : -12)} y={stop.point.y - 14} textAnchor={index % 2 ? 'start' : 'end'} className={styles.mapLabel}>{stop.name.replace(' National Park', '')}</text>
            </g>)}
            <g data-vehicle="" transform={`translate(${arrival.x} ${arrival.y})`}><circle r="16" fill="#f5f0e6" stroke="#a84d35" /><CarFront x="-10" y="-10" width="20" height="20" strokeWidth="1.3" /></g>
          </g>
          <g data-clean="" opacity={planned ? 1 : 0}>
            <path data-clean-route="" d={plannedPath} pathLength="1" strokeDasharray="1" strokeDashoffset={planned ? 0 : 1} fill="none" stroke="#a84d35" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {plannedStops.map((stop, index) => {
              const [dx, dy] = labelOffsets[index]; const Icon = activityIcons[index];
              return <g key={stop.id} data-clean-stop="" opacity={planned ? 1 : 0}>
                <circle cx={stop.point.x} cy={stop.point.y} r="5" fill="#a84d35" stroke="#f5f0e6" strokeWidth="2" />
                <g data-stop-label="" opacity={phone ? 0 : 1}><path d={`M${stop.point.x} ${stop.point.y}l${dx} ${dy}`} stroke="#91a18b" fill="none" strokeWidth=".7" />
                  <g transform={`translate(${stop.point.x + dx} ${stop.point.y + dy})`}>
                    <rect x={dx < 0 ? -116 : -8} y="-24" width="130" height="43" rx="2" fill="#f5f0e6" />
                    <Icon x={dx < 0 ? -110 : -2} y="-15" width="19" height="19" strokeWidth="1.3" />
                    <text x={dx < 0 ? -83 : 25} y="-3" className={styles.mapLabel}>{stop.name.replace(' National Park', '')}</text>
                    <text x={dx < 0 ? -83 : 25} y="12" fontSize="10" fill="#a84d35">{dayLabels[index]}</text>
                  </g>
                </g>
              </g>;
            })}
          </g>
        </g>
      </g>

      <g data-arrival-objects="" opacity={state === 'messy' || home || phone ? 1 : 0}>
        <Suitcase />
        <g data-passport=""><g transform="translate(330 582) rotate(-12)">
          <rect width="76" height="104" rx="4" fill="#12372a" /><rect x="6" y="6" width="64" height="92" rx="2" fill="none" stroke="#a9b49a" strokeWidth=".7" />
          <circle cx="38" cy="45" r="16" fill="none" stroke="#c3bd9b" /><ellipse cx="38" cy="45" rx="7" ry="16" fill="none" stroke="#c3bd9b" /><path d="M22 45h32" stroke="#c3bd9b" /><text x="38" y="78" textAnchor="middle" fill="#e4dcc5" fontSize="8" letterSpacing="1">PASSPORT</text>
        </g></g>
      </g>

      <g data-indicators="" opacity={state === 'messy' || state === 'planned' ? 1 : 0} transform={state === 'planned' ? 'translate(0 80)' : undefined}>
        <g transform="translate(588 621)"><text y="-19" className={styles.label}>DAYS</text>
          {Array.from({ length: 7 }, (_, i) => <g key={i}><rect x={i * 29} width="23" height="29" rx="1" fill="#e6e5d9" /><rect data-day="" x={i * 29} width="23" height="29" rx="1" fill={state === 'planned' ? '#12372a' : '#a84d35'} opacity={state === 'messy' && i < 6 ? .12 : 1} /><text x={i * 29 + 11} y="19" textAnchor="middle" fill="#f5f0e6" fontSize="11">{i + 1}</text></g>)}
        </g>
        <g transform="translate(830 621)"><text y="-19" className={styles.label}>BUDGET</text><rect width="162" height="5" y="12" fill="#deded1" /><rect data-budget="" width={state === 'messy' ? 23 : 130} height="5" y="12" fill={state === 'planned' ? '#12372a' : '#a84d35'} /></g>
      </g>
      <g data-weather="" opacity={state === 'messy' ? 1 : 0}>
        <g transform="translate(980 430)"><Sun width="32" height="32" strokeWidth="1" color="#a58e54" /></g>
        <g transform="translate(708 535)"><Waves width="27" height="27" strokeWidth="1.2" /><CloudRain data-rain="" x="-6" y="-44" width="42" height="42" color="#656a60" strokeWidth="1.3" /></g>
      </g>
      <g data-rewind="" opacity="0" fill="none" stroke="#a84d35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M534 367c0-42-65-54-86-17m0-28v28h28" />
      </g>
      <g data-day-order="" opacity="0">
        {plannedStops.map((stop, i) => { const Icon = activityIcons[i]; return <g key={stop.id} data-day-card="" transform={`translate(370 ${230 + i * 55})`}>
          <path d="M0 42h210" stroke="#c9cebe" /><text y="22" fill="#a84d35" fontSize="12">{dayLabels[i]}</text><text x="47" y="22" fontSize="13">{stop.name.replace(' National Park', '')}</text><Icon x="185" y="5" width="22" height="22" strokeWidth="1.2" />
        </g>; })}
      </g>
    </g>
  </svg>;
}
