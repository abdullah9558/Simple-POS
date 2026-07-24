# Code Signing (Windows)

This folder holds **placeholders** for Authenticode code signing of the Windows installer.

## Required files (do not commit real secrets)

| File | Description |
|------|-------------|
| `certificate.pfx` | Your code-signing certificate (PKCS#12). **Not included** — place privately. |
| `.env.signing` | Local env file for passwords (gitignored). |

## Environment variables (electron-builder)

```bash
# Preferred (electron-builder standard)
set CSC_LINK=certs/certificate.pfx
set CSC_KEY_PASSWORD=your-pfx-password

# Or absolute path
set CSC_LINK=C:\secure\pos-code-signing.pfx
```

## package.json placeholders

The `build.win` section references:

- `certificateFile`: `certs/certificate.pfx`
- `certificatePassword`: read from `CSC_KEY_PASSWORD` / env at build time

Until a real certificate is provided, leave signing disabled (`forceCodeSigning: false`) and ship unsigned installers for internal testing.

## Verify a signed build

```powershell
Get-AuthenticodeSignature .\release\POS System Setup *.exe
```

Replace the certificate with a valid EV/OV Authenticode cert from a trusted CA before public release.
