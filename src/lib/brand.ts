/**
 * Brand constants — single source of truth for product identity.
 *
 * v4.0 introduced this to centralise the rename pain. Every email template,
 * marketing string, and outbound link reads from here. Renaming the product
 * again is a one-file edit.
 */

export const BRAND_NAME = 'Vidhya';

export const FROM_EMAIL =
  process.env.FROM_EMAIL || `${BRAND_NAME} <hello@vidhya.app>`;

export const BASE_URL =
  process.env.BASE_URL || 'https://gate-math-api.onrender.com';

/** Long-form tagline for marketing surfaces. Avoid in transactional copy. */
export const TAGLINE = 'Know exactly the three things to study tomorrow.';
