---
name: Sonic Pulse
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#cfc2d6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#988d9f'
  outline-variant: '#4d4354'
  surface-tint: '#ddb7ff'
  primary: '#ddb7ff'
  on-primary: '#490080'
  primary-container: '#b76dff'
  on-primary-container: '#400071'
  inverse-primary: '#842bd2'
  secondary: '#4ae176'
  on-secondary: '#003915'
  secondary-container: '#00b954'
  on-secondary-container: '#004119'
  tertiary: '#ffb0cd'
  on-tertiary: '#640039'
  tertiary-container: '#f751a1'
  on-tertiary-container: '#570032'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f0dbff'
  primary-fixed-dim: '#ddb7ff'
  on-primary-fixed: '#2c0051'
  on-primary-fixed-variant: '#6900b3'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffd9e4'
  tertiary-fixed-dim: '#ffb0cd'
  on-tertiary-fixed: '#3e0022'
  on-tertiary-fixed-variant: '#8c0053'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-xl:
    fontFamily: Spline Sans
    fontSize: 64px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Spline Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Spline Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

## Brand & Style

The design system is engineered for the high-octane world of modern music consumption, targeting a Gen-Z and Millennial audience that demands both luxury and energy. The brand personality is "Electric Premium"—it feels like a front-row VIP experience at a late-night festival. 

The visual language combines **High-Contrast Boldness** with **Glassmorphism**. This juxtaposition of heavy, aggressive typography against ethereal, translucent surfaces creates an immersive depth that mimics the feeling of sound waves moving through space. Every interaction should feel tactile and responsive, evoking an emotional state of excitement and flow.

## Colors

The color palette of this design system is rooted in the "Void" aesthetics. The base is absolute black (#000000) for true depth on OLED screens, while #121212 serves as the surface color for depth layering. 

Interactive highlights utilize three high-energy neons:
- **Electric Purple (#A855F7):** The primary signal for core actions and main branding.
- **Neon Green (#22C55E):** Used for "Active" states, playback indicators, and "Live" status.
- **Hot Pink (#EC4899):** Reserved for secondary emotional triggers like "Liked" songs and high-energy playlist accents.

Text and icons primarily use high-brightness whites and muted grays to maintain accessible contrast against the deep backgrounds.

## Typography

Typography in this design system is loud and unapologetic. We use **Spline Sans** for all headlines and display text to capture its dynamic, energetic, and slightly futuristic geometric character. Weights for headlines should rarely drop below 700 to maintain high visual impact.

For body copy and functional metadata, **Be Vietnam Pro** provides a contemporary and approachable balance, ensuring long-form reading (like artist bios or lyrics) remains comfortable. Tight letter-spacing on display sizes mimics the feel of premium editorial layouts.

## Layout & Spacing

This design system utilizes a **fluid grid model** with a base 8px rhythmic unit. On mobile, the layout relies on a 4-column system with 24px outer margins to allow imagery to breathe. Desktop layouts scale to a 12-column grid.

Content is grouped into "Immersive Blocks." Padding within glass containers should be generous (24px+) to prevent elements from feeling cramped. Vertical spacing between different sections (e.g., "Recently Played" vs "New Releases") is kept wide (64px) to emphasize a premium, curated feel.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** rather than traditional shadows. This design system treats the interface as layers of semi-transparent acrylic.

- **Base Layer:** Pure #000000.
- **Content Layer:** #121212 with 80% opacity and a 20px backdrop blur.
- **Interactive Layer:** Vibrant gradients with a 40px backdrop blur.

Each glass element must feature a subtle 1px inner border (stroke) at 15% white opacity on the top and left edges to simulate light hitting the edge of the glass. Background blurs are essential to maintain legibility over colorful, high-quality album art.

## Shapes

The shape language is smooth and approachable, avoiding aggressive sharp corners to maintain the premium feel. 

- **Standard Containers:** Use a 1rem (16px) corner radius.
- **Interactive Elements:** Buttons and tags use a full pill-shape (32px+) to signify touch-friendliness.
- **Media Assets:** Album art and artist profile images should always utilize the `rounded-lg` (16px) or `rounded-xl` (24px) radius to soften the high-contrast aesthetic.

## Components

### Buttons & Interaction
Primary buttons are pill-shaped and utilize vibrant gradients (e.g., Purple to Pink). They should feature a "glow" effect—a soft, colored drop shadow matching the button’s primary hue.

### Glass Cards
Cards for playlists and albums use the glassmorphism style defined in the Elevation section. Text is placed on the lower third of the card, overlaying a subtle dark gradient to ensure readability against dynamic album art.

### Now Playing Bar
A persistent floating element at the bottom of the screen. It uses a high-blur (40px) frosted glass effect with a neon progress bar (Neon Green) that appears to "pulse" or glow.

### Interactive Chips
Used for genre tags or filters. In their inactive state, they are dark gray outlines. When active, they fill with a vibrant accent color and use bold white typography.

### Imagery
Placeholder imagery should be high-contrast, saturated photography with a focus on movement and lighting (concert photography, neon-lit portraits). All media containers must have a subtle inner glow to separate them from the pure black background.