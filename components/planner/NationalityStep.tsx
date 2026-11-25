'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { otherCountries } from '@/lib/planner/countries';
import { supportedNationalities } from '@/lib/planner/nationality';
import type { Errors, Preferences } from '@/lib/planner/model';

type Props = {
  p: Preferences;
  errors: Errors;
  update: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

function CountryFlag({ code }: { code: string }) {
  return <span className={`country-flag fi fi-${code.toLowerCase()}`} aria-hidden="true" />;
}

export default function NationalityStep({ p, errors, update }: Props) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const otherButtonRef = useRef<HTMLButtonElement>(null);
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

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  function chooseOther(name: string) {
    update('nationality', 'Other');
    update('otherNationality', name);
    closeSearch();
  }

  return <div className="nationality-step">
    <fieldset className="nationality-fieldset" id="nationality" aria-describedby={errors.nationality ? 'nationality-error' : undefined}>
      <legend className="sr-only">Choose your nationality</legend>
      <div className="nationality-grid">
        {supportedNationalities.map(country => <label key={country.code} className={`nationality-card ${p.nationality === country.name ? 'selected' : ''}`}>
          <input type="radio" name="nationality" value={country.name} checked={p.nationality === country.name} onChange={() => update('nationality', country.name)} aria-label={country.name} />
          <span className="nationality-card-icon"><CountryFlag code={country.code} /></span><strong>{country.name}</strong><span className="nationality-check">{p.nationality === country.name && <Check size={15} />}</span>
        </label>)}
        <button ref={otherButtonRef} type="button" id="otherNationality" className={`nationality-card nationality-other ${p.nationality === 'Other' ? 'selected' : ''}`} aria-haspopup="dialog" aria-pressed={p.nationality === 'Other'} aria-describedby={errors.otherNationality ? 'otherNationality-error' : undefined} onClick={() => { setQuery(''); setSearchOpen(true); }}>
          <span className="nationality-card-icon" aria-hidden="true">{p.nationality === 'Other' && selectedOther ? <CountryFlag code={selectedOther.code} /> : <Search size={28} />}</span><strong>Other</strong><small>{p.nationality === 'Other' && p.otherNationality ? p.otherNationality : 'Search your country'}</small><span className="nationality-check">{p.nationality === 'Other' && <Check size={15} />}</span>
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
        {matches.length ? matches.map(country => <button type="button" key={country.code} onClick={() => chooseOther(country.name)}><CountryFlag code={country.code} />{country.name}</button>) : <p>No matching country found.</p>}
      </div>
    </dialog>}

    <label className="nationality-decline"><input type="radio" name="nationality" value="Prefer not to say" checked={p.nationality === 'Prefer not to say'} onChange={() => update('nationality', 'Prefer not to say')} /> Prefer not to say</label>
  </div>;
}
