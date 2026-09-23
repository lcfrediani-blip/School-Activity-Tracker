/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#18253d',
    tint: '#18253d',

    // Core surfaces
    background: '#f8f6f1',
    foreground: '#18253d',

    // Cards / elevated surfaces
    card: '#fffdf9',
    cardForeground: '#18253d',

    // Primary action color (buttons, links, active states)
    primary: '#18253d',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#ebe8e0',
    secondaryForeground: '#4d5564',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#ebe8e0',
    mutedForeground: '#7e8490',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#f4c9bd',
    accentForeground: '#18253d',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e5e2da',
    input: '#e5e2da',
  },

  dark: {
    text: '#f8f6f1',
    tint: '#f4c9bd',
    background: '#111a2b',
    foreground: '#f8f6f1',
    card: '#1b263b',
    cardForeground: '#f8f6f1',
    primary: '#f4c9bd',
    primaryForeground: '#18253d',
    secondary: '#27334a',
    secondaryForeground: '#e4e8ee',
    muted: '#27334a',
    mutedForeground: '#aab3c3',
    accent: '#5d4c58',
    accentForeground: '#f8f6f1',
    destructive: '#f07772',
    destructiveForeground: '#ffffff',
    border: '#34415a',
    input: '#34415a',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 14,
};

export default colors;
