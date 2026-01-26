/**
 * Subdomain Detection and Routing Utilities
 * 
 * This module handles the detection and parsing of subdomains for the multi-tenant
 * school website system. Schools automatically receive a subdomain like:
 * escola-slug.wivessistem.com.br
 */

export interface SubdomainInfo {
  type: 'main' | 'school' | 'unknown';
  slug: string | null;
  fullHost: string;
}

/**
 * Extracts subdomain information from the current host
 * @param systemDomain - The main system domain (e.g., wivessistem.com.br)
 * @returns SubdomainInfo object with type and slug
 */
export function getSubdomainInfo(systemDomain: string): SubdomainInfo {
  const host = window.location.host;
  
  // Clean the system domain (remove protocol and trailing slash)
  const cleanSystemDomain = systemDomain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase();
  
  const cleanHost = host.toLowerCase();
  
  // Check if we're on the main system domain (no subdomain)
  if (cleanHost === cleanSystemDomain || cleanHost === `www.${cleanSystemDomain}`) {
    return {
      type: 'main',
      slug: null,
      fullHost: host,
    };
  }
  
  // Check if this is a subdomain of the system domain
  if (cleanHost.endsWith(`.${cleanSystemDomain}`)) {
    const subdomain = cleanHost.replace(`.${cleanSystemDomain}`, '');
    
    // Ignore www subdomain
    if (subdomain === 'www') {
      return {
        type: 'main',
        slug: null,
        fullHost: host,
      };
    }
    
    return {
      type: 'school',
      slug: subdomain,
      fullHost: host,
    };
  }
  
  // Unknown domain - could be a custom domain or development environment
  return {
    type: 'unknown',
    slug: null,
    fullHost: host,
  };
}

/**
 * Generates the full subdomain URL for a school
 * @param slug - The school's unique slug
 * @param systemDomain - The main system domain
 * @returns Full URL for the school's subdomain
 */
export function getSchoolSubdomainUrl(slug: string, systemDomain: string): string {
  const cleanDomain = systemDomain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  
  const protocol = window.location.protocol;
  return `${protocol}//${slug}.${cleanDomain}`;
}

/**
 * Generates a valid slug from a school name
 * @param name - The school name
 * @returns URL-safe slug
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 50); // Limit length
}

/**
 * Validates if a slug is valid for use as a subdomain
 * @param slug - The slug to validate
 * @returns Boolean indicating if the slug is valid
 */
export function isValidSubdomainSlug(slug: string): boolean {
  // Must be at least 2 characters, max 63 (DNS limit)
  if (slug.length < 2 || slug.length > 63) return false;
  
  // Must start and end with alphanumeric
  if (!/^[a-z0-9]/.test(slug) || !/[a-z0-9]$/.test(slug)) return false;
  
  // Can only contain lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) return false;
  
  // Cannot have consecutive hyphens
  if (/--/.test(slug)) return false;
  
  // Reserved subdomains
  const reserved = ['www', 'api', 'admin', 'mail', 'ftp', 'app', 'cdn', 'static'];
  if (reserved.includes(slug)) return false;
  
  return true;
}

/**
 * Check if the current environment is a development/preview environment
 * @returns Boolean indicating if we're in development mode
 */
export function isDevelopmentEnvironment(): boolean {
  const host = window.location.host;
  return (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes('.lovable.app') ||
    host.includes('preview--')
  );
}
