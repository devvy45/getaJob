"use client";

import { useMemo } from "react";
import { AsYouType, getCountries, getCountryCallingCode, isValidPhoneNumber, type CountryCode } from "libphonenumber-js/mobile";
import styles from "./phone-input.module.css";

const flag = (code: string) => code.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

/** Every country with its dial code, named in English and sorted A–Z. */
function useCountries() {
  return useMemo(() => {
    const names = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
    return getCountries()
      .map((code) => ({ code, name: names?.of(code) || code, dial: getCountryCallingCode(code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

/** Best guess at the person's country from their browser, falling back to India. */
/**
 * Should these digits be accepted for this country? Blocks typing past a complete mobile
 * number (India stops at 10), while still allowing countries with two valid lengths.
 */
export function acceptDigits(previous: string, next: string, country: CountryCode) {
  if (next.length > 15) return false;
  if (next.length <= previous.length) return true;
  return !(isValidPhoneNumber(previous, country) && !isValidPhoneNumber(next, country));
}

/** For pasted numbers: trim extra digits back to the longest valid mobile number. */
export function trimToValid(digits: string, country: CountryCode) {
  const capped = digits.slice(0, 15);
  if (isValidPhoneNumber(capped, country)) return capped;
  for (let length = capped.length - 1; length > 0; length -= 1) {
    if (isValidPhoneNumber(capped.slice(0, length), country)) return capped.slice(0, length);
  }
  return capped;
}

export function guessCountry(): CountryCode {
  if (typeof navigator === "undefined") return "IN";
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (zone === "Asia/Kolkata" || zone === "Asia/Calcutta") return "IN";
  const region = navigator.language?.split("-")[1]?.toUpperCase();
  return region && (getCountries() as string[]).includes(region) ? region as CountryCode : "IN";
}

export default function PhoneInput({ country, number, onCountry, onNumber, invalid }: {
  country: CountryCode;
  number: string;
  onCountry: (country: CountryCode) => void;
  onNumber: (number: string) => void;
  invalid?: boolean;
}) {
  const countries = useCountries();
  return <div className={`${styles.row} ${invalid ? styles.invalid : ""}`}>
    <label className={styles.country}>
      <span className={styles.visible} aria-hidden="true">{flag(country)} +{getCountryCallingCode(country)}</span>
      <select value={country} onChange={(e) => onCountry(e.target.value as CountryCode)} aria-label="Country code">
        {countries.map((c) => <option key={c.code} value={c.code}>{flag(c.code)} {c.name} (+{c.dial})</option>)}
      </select>
    </label>
    <input
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      value={number}
      onChange={(e) => {
        const previous = number.replace(/\D/g, "");
        let digits = e.target.value.replace(/\D/g, "");
        if (digits.length - previous.length > 1) digits = trimToValid(digits, country);
        else if (!acceptDigits(previous, digits, country)) return;
        onNumber(digits ? new AsYouType(country).input(digits) : "");
      }}
      placeholder="Phone number"
      aria-label="Phone number"
    />
  </div>;
}
