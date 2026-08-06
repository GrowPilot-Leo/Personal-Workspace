# settings module

## Responsibility
Appearance (Day/Night/Dusk themes, wallpapers, motion), AI provider configuration UI, data and privacy. Providers are infrastructure, not business modules.

## Non-responsibility
- Does not store plaintext API keys in the browser
- Does not collect real personal photos or private documents

## Public API (`public.ts`)
- `ThemePreference` type: day | night | dusk
- `MotionPreference` type: full | reduced | off | system
- `WallpaperPreference` type
- `persistedTheme()`: safe read/write of theme preference

## Dependencies
- `core/identity`

## Data
Appearance preferences persist locally. Provider secrets remain server-side.
