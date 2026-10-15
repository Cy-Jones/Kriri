# Kriri Brand & Design System Guidelines
*Modeled after the Asana Brand Guidelines (FY27) Architecture*  
*Prepared for Figma System Generation & Antigravity Standalone*

---

## Table of Contents
1. **Brand Identity & Dual-Mode Philosophy**
2. **Color Architecture & Figma Dual-Mode Variables**
   - 2.1 Canvas & Surface Hierarchy (Dark & Light)
   - 2.2 Text & Foreground Hierarchy (Dark & Light)
   - 2.3 Border & Hairline Rules (Dark & Light)
   - 2.4 Primary Accent (Monochrome)
   - 2.5 Functional Semantic Status & Presence Tokens
   - 2.6 Dual-Mode Contrast & Accessibility Matrix
3. **Typography System & Figma Text Styles**
   - 3.1 Type Families
   - 3.2 Complete Typography Scale Guide
   - 3.3 Type Hierarchy & Styling Standards
4. **Spatial Geometry, Elevation & Layout Grid**
   - 4.1 8-Point Spatial System
   - 4.2 Corner Radius Matrix
   - 4.3 Control Heights
   - 4.4 Dual-Mode Elevation & Depth Shadows
   - 4.5 Dot Matrix Background Grid
5. **Component Library & Figma Component Specifications**
   - 5.1 Buttons & Interactive Triggers (Dark & Light)
   - 5.2 Badges & Status Pills (Dark & Light)
   - 5.3 Avatars & Avatar Groups
   - 5.4 Floating User Hover Cards (Dark & Light)
   - 5.5 Form Inputs & Password Fields (Dark & Light)
   - 5.6 Progress Meters & Segmented Controls
   - 5.7 Workflow Pickers (Priority, Status, Health, Lead, Date)
   - 5.8 Command Palette (⌘K)
   - 5.9 Isometric Hairline Figures
6. **Motion & Interaction Tokens**
7. **Antigravity Standalone Figma Prompt Kit (Dual-Mode)**

---

# 1. Brand Identity & Dual-Mode Philosophy

### Brand Essence
**Kriri** is a high-velocity, precision project and team workspace built for elite engineering and product organizations.

### Visual Pillars
1. **Precision Dual-Mode Architecture**:
   - **Dark Mode (Default Production)**: Pure pitch backgrounds (`#000000`) layered with refined, matte dark surfaces (`#0a0a0a`, `#131416`, `#1e1f21`). Never muddy grays.
   - **Light Mode (Planned Companion)**: Clean pure white canvases (`#ffffff`), soft zinc off-white shells (`#fbfbfb`), crisp dark typography (`#09090b`), and subtle hairline boundaries (`rgba(0,0,0,0.08)`).
2. **Editorial Swiss Structure**: Modern grotesque sans-serifs (`Geist Variable` and `Inter`) paired with clean mono identifiers, rigid alignment, and generous breathing margins.
3. **Restrained Luminescence**: Crisp hairline alpha borders (`4%` to `20%`) and glowing semantic pips rather than heavy rainbow gradients or blurred neon blobs.
4. **Tactile Kinetic Response**: Micro-interactions driven by physics-calibrated spring tokens (`motionTokens`), subtle press scaling (`0.98`), and fluid morphing labels.

---

# 2. Color Architecture & Figma Dual-Mode Variables

Kriri utilizes **Figma Variable Modes**. The Figma Variable collection **`Color / Semantic`** contains two explicit modes:
- **`Dark`** (Default application mode)
- **`Light`** (Planned light mode)

Switching any Frame, Component, or Section in Figma from `Dark` to `Light` automatically switches every color variable to its corresponding value below.

### 2.1 Canvas & Surface Hierarchy

| Token Name | Figma Variable | Dark Mode Value | Light Mode Value | Role / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `canvas-pitch` | `Color/Canvas/Pitch` | `#000000` | `#ffffff` | Global viewport background, deepest canvas |
| `canvas-deep` | `Color/Canvas/Deep` | `#0a0a0a` | `#fbfbfb` | App workspace shell, showcase container, sidebar backdrop |
| `surface-default` | `Color/Surface/Default` | `#131416` | `#ffffff` | Base card fill, table rows, form group container |
| `surface-hover` | `Color/Surface/Hover` | `#1c1d21` | `#f4f4f5` | Interactive hover state for cards, table rows, list items |
| `surface-elevated` | `Color/Surface/Elevated` | `#1e1f21` | `#ffffff` | Dropdown menus, user hover cards, popover panels |
| `surface-floating` | `Color/Surface/Floating` | `#232429` | `#ffffff` | Floating command palette (⌘K), action bars, floating toasts |

### 2.2 Text & Foreground Hierarchy

| Token Name | Figma Variable | Dark Mode Value | Light Mode Value | Role / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-primary` | `Color/Text/Primary` | `#ffffff` | `#09090b` | Headings, active values, button primary labels |
| `text-body` | `Color/Text/Body` | `#f2f2f2` | `#18181b` | Standard body copy, form labels, card titles |
| `text-secondary`| `Color/Text/Secondary` | `#8a8a93` (`#d1d2d5`) | `#52525b` | Subtitles, timestamps, breadcrumbs, descriptions |
| `text-muted` | `Color/Text/Muted` | `#5f6066` (`#8a8f98`) | `#71717a` | Meta details, issue IDs, table headers, offline labels |
| `text-faint` | `Color/Text/Faint` | `#373940` | `#a1a1aa` | Placeholders, keyboard shortcuts, disabled copy |

### 2.3 Border & Hairline Rules

| Token Name | Figma Variable | Dark Mode Value | Light Mode Value | Role / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `border-subtle` | `Color/Border/Subtle` | `rgba(255, 255, 255, 0.04)` | `rgba(0, 0, 0, 0.04)` (`#f0f0f2`) | Inner card dividers, progress track, internal grid lines |
| `border-default`| `Color/Border/Default` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` (`#e4e4e7`) | Standard card boundaries, inputs, containers |
| `border-hover` | `Color/Border/Hover` | `rgba(255, 255, 255, 0.15)` | `rgba(0, 0, 0, 0.16)` (`#d4d4d8`) | Hover boundaries on cards and interactive buttons |
| `border-strong` | `Color/Border/Strong` | `rgba(255, 255, 255, 0.20)` | `rgba(0, 0, 0, 0.24)` (`#a1a1aa`) | Active card states, modal outlines, header separators |
| `border-popover`| `Color/Border/Popover` | `#333538` | `rgba(0, 0, 0, 0.12)` (`#e4e4e7`) | Solid borders on tooltips, popovers, hover cards |

### 2.4 Primary Accent (Monochrome)

Kriri is strictly monochromatic. In both Dark and Light modes, the primary action accent is high-contrast neutral:

| Token Name | Figma Variable | Dark Mode Value | Light Mode Value | Role / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `accent-primary` | `Color/Accent/Primary` | `#ffffff` | `#09090b` | Primary action button fill, active segment thumbs |
| `accent-hover` | `Color/Accent/Hover` | `#e8e8e8` | `#27272a` | Hover state on primary action buttons |
| `accent-subtle` | `Color/Accent/Subtle` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.05)` | Ghost button hover, subtle selection highlight |
| `accent-foreground` | `Color/Accent/Foreground` | `#000000` | `#ffffff` | Text & icon color inside solid primary button |

### 2.5 Functional Semantic Status & Presence Tokens

Kriri uses non-monochromatic color solely for functional status indicators, presence dots, and issue triage. There are **no rainbow theme palettes**. All badges use restrained alpha fills tuned specifically for their background canvas in each mode:

| Semantic Role | Dark Mode Dot | Dark Mode Badge Fill | Dark Mode Border | Dark Mode Text | Light Mode Dot | Light Mode Badge Fill | Light Mode Border | Light Mode Text | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Online / Success** | `#3fb950` / `#30a46c` | `rgba(48,164,108,0.12)` | `rgba(48,164,108,0.25)` | `#34d399` | `#16a34a` | `rgba(22,163,74,0.08)` | `rgba(22,163,74,0.20)` | `#15803d` | Online presence dot, Done issue status, merged PR badge |
| **In Review / Warning** | `#f5a623` | `rgba(245,166,35,0.12)` | `rgba(245,166,35,0.25)` | `#fbbf24` | `#d97706` | `rgba(217,119,6,0.08)` | `rgba(217,119,6,0.20)` | `#b45309` | In Review status, high priority, review requested |
| **In Progress / Info** | `#0091ff` | `rgba(0,145,255,0.12)` | `rgba(0,145,255,0.25)` | `#60a5fa` | `#2563eb` | `rgba(37,99,235,0.08)` | `rgba(37,99,235,0.20)` | `#1d4ed8` | In Progress status, active milestone, roadmap items |
| **Danger / Urgent** | `#e5484d` | `rgba(229,72,77,0.12)` | `rgba(229,72,77,0.25)` | `#f87171` | `#dc2626` | `rgba(220,38,38,0.08)` | `rgba(220,38,38,0.20)` | `#b91c1c` | Urgent priority, build failed, destructive dialogs |
| **Offline / Neutral** | `#71717a` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.08)` | `#8a8f98` | `#71717a` | `rgba(0,0,0,0.04)` | `rgba(0,0,0,0.08)` | `#71717a` | Offline team presence, backlog status, draft PRs |

### 2.6 Dual-Mode Contrast & Accessibility Matrix

All primary and secondary token combinations exceed WCAG 2.1 AA / AAA requirements:

- **Dark Mode**:
  - `text-primary` (`#ffffff`) on `canvas-pitch` (`#000000`): **21.0:1** (AAA Pass)
  - `text-primary` (`#ffffff`) on `surface-default` (`#131416`): **17.5:1** (AAA Pass)
  - `text-body` (`#f2f2f2`) on `surface-default` (`#131416`): **15.8:1** (AAA Pass)
  - `text-secondary` (`#8a8a93`) on `surface-default` (`#131416`): **5.9:1** (AA Pass)
  - `text-muted` (`#5f6066`) on `surface-default` (`#131416`): **3.2:1** (Large text / UI Pass)

- **Light Mode**:
  - `text-primary` (`#09090b`) on `canvas-pitch` (`#ffffff`): **19.8:1** (AAA Pass)
  - `text-primary` (`#09090b`) on `canvas-deep` (`#fbfbfb`): **19.2:1** (AAA Pass)
  - `text-body` (`#18181b`) on `surface-hover` (`#f4f4f5`): **15.2:1** (AAA Pass)
  - `text-secondary` (`#52525b`) on `surface-default` (`#ffffff`): **7.8:1** (AAA Pass)
  - `text-muted` (`#71717a`) on `surface-default` (`#ffffff`): **4.6:1** (AA Pass)

---

# 3. Typography System & Figma Text Styles

### 3.1 Type Families
- **Display & Headings**: `Geist Variable` (Weights: 400 Regular, 500 Medium, 600 SemiBold)
- **Body & Controls**: `Inter` / `Geist Variable` (Weights: 400 Regular, 500 Medium, 600 SemiBold)
- **Code & Identifiers**: `Geist Mono` / `JetBrains Mono` (Weights: 400 Regular, 500 Medium)

### 3.2 Typography Scale Guide

| Figma Style Name | Font Family | Weight | Size (px / pt) | Line Height | Letter Spacing | Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Display/Hero` | Geist Variable | 600 SemiBold | `72px` | `76px` (`1.05`) | `-0.05em` (`-3.6px`) | Normal |
| `Display/1` | Geist Variable | 600 SemiBold | `52px` | `56px` (`1.08`) | `-0.05em` (`-2.6px`) | Normal |
| `Display/2` | Geist Variable | 500 Medium | `36px` | `42px` (`1.15`) | `-0.04em` (`-1.4px`) | Normal |
| `Heading/1` | Geist Variable | 500 Medium | `28px` | `34px` (`1.20`) | `-0.03em` (`-0.8px`) | Normal |
| `Heading/2` | Geist Variable | 500 Medium | `22px` | `28px` (`1.25`) | `-0.03em` (`-0.6px`) | Normal |
| `Heading/3` | Geist Variable | 500 Medium | `18px` | `24px` (`1.30`) | `-0.02em` (`-0.4px`) | Normal |
| `Body/Large` | Inter | 400 Regular | `18px` | `28px` (`1.55`) | `-0.01em` (`-0.2px`) | Normal |
| `Body/Default` | Inter | 400 Regular | `14px` | `20px` (`1.40`) | `-0.01em` (`-0.14px`) | Normal |
| `Body/Medium` | Inter | 500 Medium | `14px` | `20px` (`1.40`) | `-0.01em` (`-0.14px`) | Normal |
| `Body/Small` | Inter | 400 Regular | `13px` | `18px` (`1.38`) | `-0.01em` (`-0.13px`) | Normal |
| `Caption` | Inter | 400 Regular | `12px` | `16px` (`1.33`) | `0.00em` (`0px`) | Normal |
| `Caption/Medium`| Inter | 500 Medium | `12px` | `16px` (`1.33`) | `0.00em` (`0px`) | Normal |
| `Micro/Pill` | Inter | 500 Medium | `10px` | `12px` (`1.20`) | `+0.02em` (`+0.2px`) | Normal |
| `Code/Default` | Geist Mono | 400 Regular | `13px` | `18px` (`1.38`) | `0.00em` (`0px`) | Monospace |
| `Code/Small` | Geist Mono | 400 Regular | `11px` | `14px` (`1.27`) | `+0.01em` (`+0.1px`) | Monospace |

---

# 4. Spatial Geometry, Elevation & Layout Grid

### 4.1 8-Point Spatial System (Figma Spacing Variables)

```
space-1  =  4px   (Micro padding, icon offsets, gap in tight badges)
space-2  =  8px   (Icon to label gaps, pill padding-y, segmented control insets)
space-3  = 12px   (Compact card padding, button sm padding-x, input insets)
space-4  = 16px   (Standard card padding, button md padding-x, layout gap)
space-5  = 20px   (Generous card padding, modal internal gap, section sub-gap)
space-6  = 24px   (Section gap, card group spacing, sidebar horizontal pad)
space-8  = 32px   (Showcase container padding, page header margins)
space-10 = 40px   (Modal outer margin, large container padding)
space-12 = 48px   (Showcase stage margins, major section dividers)
space-16 = 64px   (Landing section vertical spacing)
space-20 = 80px   (Hero section vertical breathing room)
space-24 = 96px   (Landing block separation)
```

### 4.2 Corner Radius Matrix

| Token Name | Value | Tailwind Class | Figma Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `radius-xs` | `4px` | `rounded-sm` | `Radius/XS` | Badges, code snippets, micro pills |
| `radius-sm` | `6px` | `rounded` | `Radius/SM` | Tooltips, small menu items |
| `radius-md` | `8px` | `rounded-lg` | `Radius/MD` | Form inputs, dropdown menus |
| `radius-control`| `12px` - `18px`| `rounded-xl` | `Radius/Control` | Interactive buttons, segmented controls |
| `radius-card` | `16px` | `rounded-2xl` | `Radius/Card` | Work item cards, timeline nodes, hover cards |
| `radius-panel` | `24px` | `rounded-3xl` | `Radius/Panel` | Large showcase card, modal dialogs |
| `radius-pill` | `9999px` | `rounded-full`| `Radius/Pill` | Avatars, live indicator pills, progress bars |

### 4.3 Control Heights

| Size Key | Height | Horizontal Pad | Font Style | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Control/SM` | `36px` (`2.25rem`) | `12px` | `Body/Small (13px)` | Compact actions, table filters, icon buttons |
| `Control/MD` | `44px` (`2.75rem`) | `16px` | `Body/Medium (14px)` | Standard form inputs, primary dialog buttons |
| `Control/LG` | `50px` (`3.125rem`) | `20px` | `Body/Medium (15px)` | Hero CTA buttons, auth form submit buttons |

### 4.4 Dual-Mode Elevation & Depth Shadows

```css
/* --- DARK MODE ELEVATION --- */
/* Elevation 0 (Flat Cards) */
border: 1px solid rgba(255, 255, 255, 0.08);

/* Elevation 1 (Resting Cards) */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
border: 1px solid rgba(255, 255, 255, 0.08);

/* Elevation 2 (Raised / Hover) */
box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
border: 1px solid rgba(255, 255, 255, 0.15);

/* Elevation 3 (Floating Popovers / Hover Cards) */
box-shadow: 0 22px 55px rgba(0, 0, 0, 0.50);
border: 1px solid #333538;


/* --- LIGHT MODE ELEVATION --- */
/* Elevation 0 (Flat Cards) */
border: 1px solid rgba(0, 0, 0, 0.08);

/* Elevation 1 (Resting Cards) */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
border: 1px solid rgba(0, 0, 0, 0.08);

/* Elevation 2 (Raised / Hover) */
box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03);
border: 1px solid rgba(0, 0, 0, 0.12);

/* Elevation 3 (Floating Popovers / Hover Cards) */
box-shadow: 0 16px 36px rgba(0, 0, 0, 0.09), 0 2px 6px rgba(0, 0, 0, 0.04);
border: 1px solid rgba(0, 0, 0, 0.10);
```

### 4.5 Dot Matrix Background Grid
- **Dot Size**: `1px` circle
- **Dark Mode Dot Color**: `#ffffff` at `2.5%` opacity (`rgba(255, 255, 255, 0.025)`)
- **Light Mode Dot Color**: `#000000` at `3.5%` opacity (`rgba(0, 0, 0, 0.035)`)
- **Grid Spacing**: `24px × 24px` square tile

---

# 5. Component Library & Figma Component Specifications

### 5.1 Buttons (`Component/Button`)
- **Properties**:
  - `Mode`: `Dark` | `Light` (Bound to Figma Mode)
  - `Variant`: `Primary` | `Secondary` | `Ghost` | `Danger`
  - `Size`: `SM (36px)` | `MD (44px)` | `LG (50px)`
  - `State`: `Default` | `Hover` | `Active` | `Disabled` | `Loading`
  - `Icon`: `None` | `Leading` | `Trailing` | `Icon-Only`
- **Design Tokens (Dark Mode)**:
  - `Primary`: Fill `#ffffff`, Text `#000000`, Radius `12px`, Hover Opacity `0.91`
  - `Secondary`: Fill `#131416`, Text `#ffffff`, Border `white/8%`, Hover `white/15%`
  - `Ghost`: Fill `transparent`, Text `#d1d2d5`, Hover Fill `white/5%`, Hover Text `#ffffff`
  - `Danger`: Fill `#131416`, Text `#e5484d`, Border `white/8%`, Hover Border `#e5484d`
- **Design Tokens (Light Mode)**:
  - `Primary`: Fill `#09090b`, Text `#ffffff`, Radius `12px`, Hover Fill `#27272a`
  - `Secondary`: Fill `#ffffff`, Text `#09090b`, Border `rgba(0,0,0,0.12)`, Hover Fill `#f4f4f5`
  - `Ghost`: Fill `transparent`, Text `#52525b`, Hover Fill `rgba(0,0,0,0.05)`, Hover Text `#09090b`
  - `Danger`: Fill `#ffffff`, Text `#dc2626`, Border `rgba(220,38,38,0.25)`, Hover Fill `rgba(220,38,38,0.05)`
- **Press Interaction**: Scale `0.98` with `100ms` transition.

### 5.2 Badges & Status Pills (`Component/Badge`)
- **Properties**:
  - `Mode`: `Dark` | `Light`
  - `Tone`: `Neutral` | `Info` | `Success` | `Warning` | `Danger`
  - `Size`: `SM` (Height `22px`, Text `11px`, Pad `8px`) | `MD` (Height `26px`, Text `12px`, Pad `10px`)
  - `Dot`: `True` | `False`
- **Color Pairings (Dark Mode)**:
  - `Success`: Fill `rgba(48,164,108,0.12)`, Border `rgba(48,164,108,0.25)`, Text `#34d399`
  - `Warning`: Fill `rgba(245,166,35,0.12)`, Border `rgba(245,166,35,0.25)`, Text `#fbbf24`
  - `Info`: Fill `rgba(0,145,255,0.12)`, Border `rgba(0,145,255,0.25)`, Text `#60a5fa`
  - `Danger`: Fill `rgba(229,72,77,0.12)`, Border `rgba(229,72,77,0.25)`, Text `#f87171`
  - `Neutral`: Fill `rgba(255,255,255,0.04)`, Border `rgba(255,255,255,0.08)`, Text `#8a8f98`
- **Color Pairings (Light Mode)**:
  - `Success`: Fill `rgba(22,163,74,0.08)`, Border `rgba(22,163,74,0.20)`, Text `#15803d`
  - `Warning`: Fill `rgba(217,119,6,0.08)`, Border `rgba(217,119,6,0.20)`, Text `#b45309`
  - `Info`: Fill `rgba(37,99,235,0.08)`, Border `rgba(37,99,235,0.20)`, Text `#1d4ed8`
  - `Danger`: Fill `rgba(220,38,38,0.08)`, Border `rgba(220,38,38,0.20)`, Text `#b91c1c`
  - `Neutral`: Fill `rgba(0,0,0,0.04)`, Border `rgba(0,0,0,0.08)`, Text `#71717a`

### 5.3 Avatars & Avatar Groups (`Component/Avatar`, `Component/AvatarGroup`)
- **Avatar Sizes**:
  - `XS`: `24px` (Border 1px, Text 9px)
  - `SM`: `28px` (Border 1.5px, Text 10px, Status dot 8px)
  - `MD`: `36px` (Border 1.5px, Text 12px, Status dot 10px)
  - `LG`: `48px` (Border 2px, Text 14px, Status dot 12px)
  - `XL`: `88px` (Border 2px, Text 23px, Status dot 14px)
- **Status Dot Rules**:
  - `Online`: Solid `#3fb950` (Dark) / `#16a34a` (Light) with 2px cutout ring. Position: bottom-right.
  - `Offline`: **No indicator dot displayed on compact avatar**.
  - `Away`: Solid `#f5a623` (Dark) / `#d97706` (Light) with 2px cutout ring.
- **Avatar Group Architecture**:
  - Stack Spacing: `-8px` overlap.
  - Overflow Counter: `+N` pill (`28px` circle, background `var(--color-surface-hover)`, border `var(--color-border-default)`, text `10px mono`).

### 5.4 Floating User Hover Card (`Component/UserHoverCard`)
- **Dimensions**: Fixed width `260px`, Padding `16px`, Corner Radius `12px` (`rounded-xl`).
- **Dark Mode Surface**: Background `#1e1f21`, Border `1px solid #333538`, Shadow `Elevation 3 Dark`.
- **Light Mode Surface**: Background `#ffffff`, Border `1px solid rgba(0,0,0,0.12)`, Shadow `Elevation 3 Light`.
- **Layout (Vertical Auto-Layout, Gap 16px)**:
  - **Header Row (Horizontal Auto-Layout, Gap 12px)**:
    - Left: Avatar `MD (36px)` (matches presence dot state).
    - Right (Vertical Auto-Layout, Gap 2px):
      - Name row: Name (`14px Medium`) + Role pill (`10px`, pad `2px 6px`, radius `4px`).
      - Handle: `@username` (`13px Regular text-muted`).
  - **Meta Stack (Vertical Auto-Layout, Gap 8px)**:
    - Presence Row: `6px` round dot (`#3fb950`/`#16a34a` Online or `#71717a` Offline) + Status label (`12px`).
    - Local Time Row: Lucide `Clock` icon (`14px`) + `[time] local time` (`12px text-muted`).
    - Scope Row: Lucide `Box` icon (`14px`) + `Kriri Web Platform` (`12px`).

### 5.5 Form Inputs (`Component/Input`, `Component/PasswordField`)
- **Dimensions**: Height `44px`, Padding `0 16px`, Corner Radius `8px` (`rounded-lg`).
- **Dark Mode Surface**: Fill `rgba(255, 255, 255, 0.03)`, Border `1px solid rgba(255, 255, 255, 0.10)`. Focus Border `rgba(255,255,255,0.35)`. Text `#ffffff`, Placeholder `#5f6066`.
- **Light Mode Surface**: Fill `#ffffff`, Border `1px solid rgba(0, 0, 0, 0.12)`. Focus Border `#09090b`. Text `#09090b`, Placeholder `#a1a1aa`.
- **Password Action**: Trailing icon button with Lucide `Eye` / `EyeOff` (`16px text-muted`).

### 5.6 Progress Meters & Segmented Controls
- **Progress Bar (`Component/Progress`)**:
  - Track: Height `6px` (sm) or `10px` (md), Fill `border-subtle`, Radius `9999px`.
  - Indicator: Fill `accent-primary` with subtle glow.
- **Segmented Control (`Component/SegmentedControl`)**:
  - Dark Mode: Container Height `36px`, Padding `3px`, Fill `#131416`, Border `white/8%`, Radius `10px`. Active Segment: Fill `#ffffff` (text `#000000`).
  - Light Mode: Container Height `36px`, Padding `3px`, Fill `#f4f4f5`, Border `rgba(0,0,0,0.08)`, Radius `10px`. Active Segment: Fill `#ffffff` (text `#09090b`), Shadow `0 1px 3px rgba(0,0,0,0.10)`.

### 5.7 Workflow Pickers (`Component/Picker/...`)
- **Priority Picker**:
  - `Urgent`: Icon Lucide `AlertCircle`, Color `#e5484d` (Dark) / `#dc2626` (Light)
  - `High`: Icon Lucide `ArrowUp`, Color `#f5a623` (Dark) / `#d97706` (Light)
  - `Medium`: Icon Lucide `ArrowRight`, Color `#eab308`
  - `Low`: Icon Lucide `ArrowDown`, Color `#0091ff` (Dark) / `#2563eb` (Light)
  - `None`: Icon Lucide `Minus`, Color `#71717a`
- **Status Picker**:
  - `Backlog`: Gray circle
  - `Todo`: Dotted circle
  - `In Progress`: Half-filled blue circle
  - `In Review`: 3/4-filled amber circle
  - `Done`: Filled emerald checkmark
  - `Canceled`: Slashed circle
- **Health Picker**:
  - `On Track`: Emerald (`#30a46c` / `#16a34a`)
  - `At Risk`: Amber (`#f5a623` / `#d97706`)
  - `Off Track`: Rose / Red (`#e5484d` / `#dc2626`)

### 5.8 Command Palette (`Component/CommandPalette`)
- **Dark Mode**: Backdrop `#000000` at `65%` blur(12px). Window Width `640px`, Corner Radius `16px`. Surface `#131416`, Border `1px solid rgba(255, 255, 255, 0.12)`.
- **Light Mode**: Backdrop `rgba(0, 0, 0, 0.25)` blur(12px). Window Width `640px`, Corner Radius `16px`. Surface `#ffffff`, Border `1px solid rgba(0, 0, 0, 0.12)`, Shadow `0 24px 64px rgba(0,0,0,0.18)`.
- **Search Header**: Height `56px`, Search icon `18px text-muted`, Input `16px text-primary`, ESC badge `11px mono`.
- **List Groups**: Header `11px mono uppercase text-muted`, item height `40px`, active item fill `surface-hover`.

### 5.9 Isometric Hairline Figures (`@lucasmarkes/hairline`)
- **Key Figures**: `Stack` (Sprint/Backlog), `Plot` (Roadmap/Charts), `Relay` (Telemetry/Realtime), `Branches` (Git PRs), `Terminal` (Logs/Health), `Vault` (Security/Auth).
- **Container Specs**: `64px × 64px`, Radius `16px` (`rounded-2xl`), Fill `surface-default`, Border `border-default`.
- **Render Mode**: Stroke thickness `1px`.
  - Dark Mode: Stroke color `#e4e4e7`, intensity `0.85`.
  - Light Mode: Stroke color `#18181b`, intensity `0.90`.

---

# 6. Motion & Interaction Tokens

```javascript
export const motionTokens = {
  duration: {
    instant: 0.12,     // 120ms (Tooltips, toggle feedback)
    fast: 0.16,        // 160ms (Hover state transitions, badge fades)
    exit: 0.18,        // 180ms (Dropdown dismissal, toast exits)
    standard: 0.24,    // 240ms (Modal entry, card expansion)
    considered: 0.48,  // 480ms (Large hero reveals, carousel transitions)
  },
  ease: {
    enter: [0.16, 1, 0.3, 1],       // Smooth cubic deceleration
    exit: [0.7, 0, 0.84, 0],        // Snappy cubic exit
    standard: [0.22, 1, 0.36, 1],   // Standard interface ease
    inOut: [0.65, 0, 0.35, 1],      // On-screen movement
  },
  spring: {
    responsive: { stiffness: 520, damping: 38 },
    gentle: { stiffness: 340, damping: 34 },
    snappy: { visualDuration: 0.26, bounce: 0.12 }, // Button clicks & icon checks
    smooth: { visualDuration: 0.40, bounce: 0 },    // Carousel slides & panels
    morph: { visualDuration: 0.42, bounce: 0.16 },  // Segmented control pill slide
  },
  stagger: {
    item: 0.035,
    word: 0.04,
  },
  blur: {
    subtle: 2,
    soft: 4,
    text: 8,
  }
};
```

---

# 7. Antigravity Standalone Figma Prompt Kit (Dual-Mode)

*Copy and paste the prompt below into Antigravity Standalone to instruct it to generate the design system inside your Figma canvas with complete Dark and Light mode separation.*

```markdown
You are a Staff Product Designer and Design Systems Architect.
Create the complete "Kriri Design System" inside this Figma document with full DUAL-MODE support (Dark Mode and Light Mode).

1. FIGMA VARIABLE COLLECTION: "Color / Semantic"
   Configure TWO MODES on this collection:
   - Mode 1: "Dark" (Default)
   - Mode 2: "Light"

   Populate each token with its corresponding Dark and Light values:
   - Canvas/Pitch:      Dark #000000 | Light #FFFFFF
   - Canvas/Deep:       Dark #0A0A0A | Light #FBFBFB
   - Surface/Default:   Dark #131416 | Light #FFFFFF
   - Surface/Hover:     Dark #1C1D21 | Light #F4F4F5
   - Surface/Elevated:  Dark #1E1F21 | Light #FFFFFF
   - Surface/Floating:  Dark #232429 | Light #FFFFFF
   - Text/Primary:      Dark #FFFFFF | Light #09090B
   - Text/Body:         Dark #F2F2F2 | Light #18181B
   - Text/Secondary:    Dark #8A8A93 | Light #52525B
   - Text/Muted:        Dark #5F6066 | Light #71717A
   - Text/Faint:        Dark #373940 | Light #A1A1AA
   - Border/Subtle:     Dark rgba(255,255,255,0.04) | Light rgba(0,0,0,0.04)
   - Border/Default:    Dark rgba(255,255,255,0.08) | Light rgba(0,0,0,0.08)
   - Border/Hover:      Dark rgba(255,255,255,0.15) | Light rgba(0,0,0,0.16)
   - Border/Strong:     Dark rgba(255,255,255,0.20) | Light rgba(0,0,0,0.24)
   - Border/Popover:    Dark #333538                | Light rgba(0,0,0,0.12)
   - Accent/Primary:    Dark #FFFFFF | Light #09090B
   - Accent/Hover:      Dark #E8E8E8 | Light #27272A
   - Accent/Foreground: Dark #000000 | Light #FFFFFF
   - Status/Online:     Dark #3FB950 | Light #16A34A
   - Status/Warning:    Dark #F5A623 | Light #D97706
   - Status/Info:       Dark #0091FF | Light #2563EB
   - Status/Danger:     Dark #E5484D | Light #DC2626
   - Status/Offline:    Dark #71717A | Light #71717A

   (DO NOT generate any rainbow accent columns or lavender/peach gradients. Kriri is strictly monochromatic with 5 functional status indicators).

2. FIGMA VARIABLE COLLECTION: "Spacing"
   - space-1: 4px, space-2: 8px, space-3: 12px, space-4: 16px, space-5: 20px, space-6: 24px, space-8: 32px, space-10: 40px, space-12: 48px, space-16: 64px

3. FIGMA VARIABLE COLLECTION: "Radius"
   - radius-xs: 4px, radius-sm: 6px, radius-md: 8px, radius-control: 12px, radius-card: 16px, radius-panel: 24px, radius-pill: 9999px

4. FIGMA TEXT STYLES:
   - Display/Hero: Geist Variable 600, 72px / 76px, -0.05em tracking
   - Display/1: Geist Variable 600, 52px / 56px, -0.05em tracking
   - Display/2: Geist Variable 500, 36px / 42px, -0.04em tracking
   - Heading/1: Geist Variable 500, 28px / 34px, -0.03em tracking
   - Heading/2: Geist Variable 500, 22px / 28px, -0.03em tracking
   - Heading/3: Geist Variable 500, 18px / 24px, -0.02em tracking
   - Body/Large: Inter 400, 18px / 28px, -0.01em tracking
   - Body/Default: Inter 400, 14px / 20px, -0.01em tracking
   - Body/Medium: Inter 500, 14px / 20px, -0.01em tracking
   - Body/Small: Inter 400, 13px / 18px, -0.01em tracking
   - Caption: Inter 400, 12px / 16px, 0.00em tracking
   - Caption/Medium: Inter 500, 12px / 16px, 0.00em tracking
   - Micro/Pill: Inter 500, 10px / 12px, +0.02em tracking
   - Code/Default: Geist Mono 400, 13px / 18px, 0.00em tracking
   - Code/Small: Geist Mono 400, 11px / 14px, +0.01em tracking

5. FIGMA COMPONENT SETS (Build with Mode-responsive variables):
   - Button Set: Variants (Primary, Secondary, Ghost, Danger) × Sizes (SM, MD, LG) × States (Default, Hover, Disabled).
   - Badge Set: Tones (Neutral, Info, Success, Warning, Danger) with optional presence dot.
   - Avatar Set: Sizes (XS 24px, SM 28px, MD 36px, LG 48px, XL 88px) × Status (None, Online, Away). (Offline avatars do NOT show an indicator dot).
   - AvatarGroup Component: -8px overlap + overflow pill.
   - UserHoverCard Component: Width 260px, surface-elevated, border-popover, radius 12px. Contains Avatar MD, Name, Role badge, Handle, Presence row, Local time row, and Scope row.
   - Input Field Set: Width 320px, height 44px, radius 8px.
   - PasswordField Component: Input with Eye action.
   - SegmentedControl Component: Pill tabs container with sliding active thumb.
   - PriorityPicker & StatusPicker components for Linear-style issue tracking.

6. LAYOUT PRESENTATION ON CANVAS:
   Organize into clean side-by-side boards to display both modes clearly:
   - Frame 1: Brand & Logo Lockup
   - Frame 2A: Color Variables & Contrast Matrix (Dark Mode Board)
   - Frame 2B: Color Variables & Contrast Matrix (Light Mode Board)
   - Frame 3: Typography Scale Board
   - Frame 4: Elevation & Spatial Rules (Side-by-side Dark and Light shadows)
   - Frame 5A: Core Component Library (Dark Mode)
   - Frame 5B: Core Component Library (Light Mode)
   - Frame 6: Workflow & Issue Pickers
   - Frame 7A: Live UI Sprint Board Mockup (Dark Mode)
   - Frame 7B: Live UI Sprint Board Mockup (Light Mode)
```
