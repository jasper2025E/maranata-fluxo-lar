/**
 * CSS Sanitizer - SEC-01 Protection
 * Removes dangerous CSS patterns that could be used for XSS attacks
 * or data exfiltration through CSS injection.
 */

// Dangerous CSS patterns that must be blocked
const DANGEROUS_PATTERNS: RegExp[] = [
  // Block @import which can load external stylesheets
  /@import\s+/gi,
  
  // Block javascript: protocol
  /javascript\s*:/gi,
  
  // Block expression() - IE CSS expressions
  /expression\s*\(/gi,
  
  // Block behavior: - IE CSS behaviors
  /behavior\s*:/gi,
  
  // Block -moz-binding - Firefox XBL bindings
  /-moz-binding\s*:/gi,
  
  // Block url() with data: protocol (can embed malicious content)
  /url\s*\(\s*["']?\s*data\s*:/gi,
  
  // Block url() with javascript: protocol
  /url\s*\(\s*["']?\s*javascript\s*:/gi,
  
  // Block vbscript: protocol
  /vbscript\s*:/gi,
  
  // Block -o-link and -o-link-source (Opera)
  /-o-link\s*:/gi,
  /-o-link-source\s*:/gi,
  
  // Block base64 encoded javascript
  /url\s*\([^)]*base64[^)]*script[^)]*\)/gi,
  
  // Block cursor with url to prevent custom cursor exploits
  /cursor\s*:\s*url\s*\([^)]*\)/gi,
];

// CSS properties that should never have url() values from untrusted sources
const URL_RESTRICTED_PROPERTIES = [
  'background',
  'background-image',
  'list-style',
  'list-style-image',
  'content',
  'border-image',
  'border-image-source',
  'mask',
  'mask-image',
];

/**
 * Sanitizes CSS string by removing dangerous patterns
 * that could be used for XSS or data exfiltration
 * 
 * @param css - Raw CSS string to sanitize
 * @returns Sanitized CSS string safe for injection
 */
export function sanitizeCSS(css: string | null | undefined): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  let sanitized = css;

  // Replace all dangerous patterns with block comment
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '/* [BLOCKED] */');
  }

  // Additional check: remove any remaining script-like content
  sanitized = sanitized.replace(/<\s*script/gi, '/* [BLOCKED:SCRIPT] */');
  sanitized = sanitized.replace(/<\s*\/\s*script/gi, '/* [BLOCKED:SCRIPT] */');
  
  // Remove HTML tags that might be embedded
  sanitized = sanitized.replace(/<[^>]+>/g, '/* [BLOCKED:HTML] */');

  // Limit CSS length to prevent DoS
  const MAX_CSS_LENGTH = 50000; // 50KB max
  if (sanitized.length > MAX_CSS_LENGTH) {
    sanitized = sanitized.substring(0, MAX_CSS_LENGTH);
    console.warn('[CSS Sanitizer] CSS truncated to prevent DoS');
  }

  return sanitized;
}

/**
 * Validates that CSS doesn't contain external resource references
 * Returns true if safe, false if contains external URLs
 * 
 * @param css - CSS string to validate
 * @returns boolean indicating if CSS is safe
 */
export function validateNoExternalResources(css: string | null | undefined): boolean {
  if (!css) return true;
  
  // Check for any url() that points to external domains
  const urlPattern = /url\s*\(\s*["']?\s*(https?:\/\/|\/\/)/gi;
  return !urlPattern.test(css);
}

/**
 * Creates a safe style element content by sanitizing CSS
 * and wrapping in a scoped selector
 * 
 * @param css - Raw CSS to sanitize
 * @param scopeSelector - Optional selector to scope styles to
 * @returns Safe CSS string
 */
export function createSafeStyles(
  css: string | null | undefined, 
  scopeSelector?: string
): string {
  const sanitized = sanitizeCSS(css);
  
  if (!sanitized) return '';
  
  if (scopeSelector) {
    // Attempt to scope styles - wrap each rule block
    // This is a simple implementation; production may need CSS parser
    return sanitized
      .replace(/([^{}]+)\{/g, `${scopeSelector} $1{`)
      .replace(new RegExp(`${scopeSelector}\\s+@`, 'g'), '@'); // Don't scope @rules
  }
  
  return sanitized;
}

export default sanitizeCSS;
