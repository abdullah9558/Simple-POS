# App packaging assets

| File | Purpose |
|------|---------|
| `icon.png` | Application / installer icon (512×512+). electron-builder converts for Windows. |
| `icon.ico` | Optional multi-size Windows icon. If missing, PNG is used. |
| `splash.png` | Optional splash artwork reference (runtime splash is HTML in `electron/main.ts`). |

Generate `icon.ico` from PNG if needed:

```bash
# Example with ImageMagick
magick convert build/icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```
