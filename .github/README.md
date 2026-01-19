# GitHub Actions Setup

## Release Workflow Secrets

The following secrets are required for the release workflow:

### All Platforms
- `GITHUB_TOKEN` - Automatically provided by GitHub

### macOS Code Signing
- `APPLE_CERTIFICATE` - Base64-encoded .p12 certificate (Developer ID Application)
- `APPLE_CERTIFICATE_PASSWORD` - Password for the .p12 file (saved in ProtonPass under "Apple Developer Application password for github")
- `APPLE_IDENTITY` - Signing identity (e.g., "Developer ID Application: Travis Bumgarner (669MM5WVSV)")
- `APPLE_ID` - Apple ID email for notarization
- `APPLE_PASSWORD` - App-specific password for notarization
- `APPLE_TEAM_ID` - Apple Developer Team ID

## Regenerating the Certificate

If you need to create a new certificate:

1. Open Keychain Access
2. Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority
3. Save the .certSigningRequest file to disk
4. Go to https://developer.apple.com/account/resources/certificates
5. Create a new "Developer ID Application" certificate using the CSR
6. Download and double-click the .cer file to install
7. In Keychain Access → Certificates, find the new certificate
8. Right-click → Export as .p12 with a password
9. Base64 encode it: `base64 -i cert.p12 | pbcopy`
10. Update the `APPLE_CERTIFICATE` and `APPLE_CERTIFICATE_PASSWORD` secrets in GitHub
