# GrowPilot V2 design system

## 1. Goals

- Support focused daily use on desktop and mobile.
- Keep information readable over solid colors and wallpapers.
- Give Day, Night and Dusk distinct identities without changing information meaning.
- Keep charts understandable without color alone.
- Make seasonal motion optional and performance-aware.

## 2. Token layers

```text
foundation tokens
-> semantic tokens
-> component tokens
-> theme overrides
-> user wallpaper settings
```

Business modules use semantic tokens. They must not hard-code theme colors.

Examples:

- `--color-bg-canvas`
- `--color-bg-surface`
- `--color-text-primary`
- `--color-text-muted`
- `--color-action-primary`
- `--color-ai-accent`
- `--color-success`
- `--color-warning`
- `--color-danger`

## 3. Default themes

### Day

- warm light canvas
- white surfaces
- dark green-gray text
- green primary action
- blue information
- amber review reminders

### Night

- dark blue-black canvas
- dark gray surfaces
- soft light text
- teal primary action
- purple AI accent
- muted red risk state

### Dusk

- deep purple-brown canvas
- warm gray-purple surfaces
- amber primary action
- coral emphasis
- pale purple AI accent

Avoid pure black with pure white for long reading surfaces.

## 4. Charts

Each theme defines chart tokens for:

- axes
- grid
- labels
- tooltip
- focus series
- muted series
- success
- warning
- danger

Series meaning remains stable across themes.

Charts also use labels, point shapes, line styles or patterns. Never use color as the only distinction.

## 5. Built-in wallpapers

Static:

- Morning Desk
- Misty Forest

Dynamic:

- Spring: petals and new growth
- Summer: light water and ripple
- Autumn: warm falling leaves
- Winter: snow, frost and crystal

Use a readability overlay between wallpaper and application content.

## 6. Seasonal interaction feedback

- Spring: short petal burst
- Summer: click-position water ripple
- Autumn: short leaf scatter
- Winter: short frost or ice-crack overlay

Effects should be local, brief and decorative. A winter crack must disappear quickly and must not resemble persistent UI damage.

## 7. User wallpapers

Allow static images and approved looped media formats. Provide:

- crop or fit
- focal position
- blur
- brightness
- overlay strength
- loop control
- restore default

Uploaded media is content, never code.

## 8. Motion modes

- Full
- Reduced
- Off
- Follow system

Requirements:

- pause dynamic wallpaper when the page is hidden
- show a poster before video is ready
- avoid a white flash during theme hydration
- degrade on low-performance conditions
- keep forms and charts readable
- keep route transitions subtle
- respect reduced-motion preference

## 9. Component behavior

Every button has visible hover, pressed, focus and disabled states.

Task completion, badge illumination and plan revision use purposeful motion. Decorative motion must never block an action or carry essential information.

## 10. Demo acceptance

The first V2 demo must include:

- Day, Night and Dusk switching
- persistent theme preference
- theme-safe chart examples
- a wallpaper overlay control
- reduced-motion behavior
- clear button feedback

Seasonal final media assets may be represented by lightweight prototypes until approved assets are available.
