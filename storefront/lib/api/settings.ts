import { apiFetch } from './client';

export interface HeroSlideConfig {
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface SiteSettings {
  heroImageUrl?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroCtaText?: string | null;
  heroCtaHref?: string | null;
  heroSlides?: HeroSlideConfig[] | null;
  storeAddress?: string | null;
  storePhone?: string | null;
  storeEmail?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
}

export function getSiteSettings() {
  return apiFetch<SiteSettings>('/settings');
}
