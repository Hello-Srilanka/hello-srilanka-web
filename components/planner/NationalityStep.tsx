'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { countryFlag, otherCountries } from '@/lib/planner/countries';
import { nationalityProfile, supportedNationalities } from '@/lib/planner/nationality';
import type { Errors, Preferences } from '@/lib/planner/model';

type Props = {
  p: Preferences;
  errors: Errors;
  update: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

export default function NationalityStep({ p, errors, update }: Props) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const otherButtonRef = useRef<HTMLButtonElement>(null);
  const profile = nationalityProfile(p.nationality);
  const selectedOther = otherCountries.find(country => country.name === p.otherNationality);
  const matches = otherCountries.filter(country => country.name.toLowerCase().includes(query.trim().toLowerCase()) || country.code.toLowerCase() === query.trim().toLowerCase()).slice(0, 12);

  useEffect(() => {
    if (!searchOpen) return;
    const dialog = dialogRef.current;
    const trigger = otherButtonRef.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    searchRef.current?.focus();
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [searchOpen]);

  function chooseNationality(value: string) {
    update('nationality', value);
    update('useNationalitySuggestions', false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  function chooseOther(name: string) {
    update('nationality', 'Other');
    update('otherNationality', name);
    update('useNationalitySuggestions', false);
    closeSearch();
  }

  return <div className="nationality-step">
    <fieldset className="nationality-fieldset" id="nationality" aria-describedby={errors.nationality ? 'nationality-error' : undefined}>
      <legend className="sr-only">Choose your nationality</legend>
      <div className="nationality-grid">
        {supportedNationalities.map(country => <label key={country.code} className={`nationality-card ${p.nationality === country.name ? 'selected' : ''}`}>
          <input type="radio" name="nationality" value={country.name} checked={p.nationality === country.name} onChange={() => chooseNationality(country.name)} aria-label={country.name} />
          <span className="nationality-flag" aria-hidden="true">{countryFlag(country.code)}</span><strong>{country.name}</strong><span className="nationality-check">{p.nationality === country.name && <Check size={15} />}</span>
        </label>)}
        <button ref={otherButtonRef} type="button" id="otherNationality" className={`nationality-card nationality-other ${p.nationality === 'Other' ? 'selected' : ''}`} aria-haspopup="dialog" aria-pressed={p.nationality === 'Other'} aria-describedby={errors.otherNationality ? 'otherNationality-error' : undefined} onClick={() => { setQuery(''); setSearchOpen(true); }}>
          <span className="nationality-other-icon" aria-hidden="true">{p.nationality === 'Other' && selectedOther ? selectedOther.flag : <Search size={28} />}</span><strong>Other</strong><small>{p.nationality === 'Other' && p.otherNationality ? p.otherNationality : 'Search your country'}</small><span className="nationality-check">{p.nationality === 'Other' && <Check size={15} />}</span>
        </button>
      </div>
      {errors.nationality && <p className="field-error" id="nationality-error">{errors.nationality}</p>}
      {errors.otherNationality && <p className="field-error" id="otherNationality-error">{errors.otherNationality}</p>}
    </fieldset>

    {searchOpen && <dialog ref={dialogRef} className="nationality-dialog" aria-labelledby="nationality-dialog-title" onCancel={event => { event.preventDefault(); closeSearch(); }} onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSearch(); }}>
      <div className="nationality-dialog-head"><div><p className="eyebrow">OTHER NATIONALITY</p><h2 id="nationality-dialog-title">Find your country</h2></div><button type="button" className="nationality-dialog-close" onClick={closeSearch} aria-label="Close country search"><X size={20} /></button></div>
      <label htmlFor="countrySearch">Search by country name</label>
      <input ref={searchRef} id="countrySearch" type="search" autoComplete="off" value={query} placeholder="Start typing a country name" onChange={event => setQuery(event.target.value)} aria-controls="country-results" />
      <div className="nationality-results" id="country-results" aria-label="Matching countries">
        {matches.length ? matches.map(country => <button type="button" key={country.code} onClick={() => chooseOther(country.name)}><span aria-hidden="true">{country.flag}</span>{country.name}</button>) : <p>No matching country found.</p>}
      </div>
      <p className="field-hint">Activity suggestions are available for the five countries shown on the planner.</p>
    </dialog>}

    {profile && <div className="nationality-suggestion"><p>Popular ideas for visitors from {p.nationality}: {profile.ideas} <a href={profile.source} target="_blank" rel="noopener noreferrer">Research source</a></p><label className="check-row"><input id="useNationalitySuggestions" type="checkbox" checked={p.useNationalitySuggestions} onChange={event => update('useNationalitySuggestions', event.target.checked)} /> Include these ideas when planning my itinerary</label><small>Your selected interests, trip needs and dates still guide the plan. These are broad trends, not assumptions about you.</small>{errors.useNationalitySuggestions && <p className="field-error" id="useNationalitySuggestions-error">{errors.useNationalitySuggestions}</p>}</div>}

    <label className="nationality-decline"><input type="radio" name="nationality" value="Prefer not to say" checked={p.nationality === 'Prefer not to say'} onChange={() => chooseNationality('Prefer not to say')} /> Prefer not to say</label>
  </div>;
}
