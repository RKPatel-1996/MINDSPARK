# Android Artifact Notice & Authority Policy

> **CRITICAL BUILD INVARIANT**:
> Do NOT treat files under this directory (`android/`) as source authority for web assets or application logic.

1. **Source Authority**: All application source code, UI components, FSRS scheduling routines, styles, and static assets reside exclusively in `src/` and `public/`.
2. **Derivative Artifacts**: Assets in this directory synced by Capacitor (`android/app/src/main/assets/public/`) are strictly generated build outputs.
3. **Regeneration Procedure**: Whenever changes are made to the web application, regenerate Android artifacts by running:
   ```bash
   npm run build:android
   ```
   (which executes `npm run build && npx cap sync android`).
4. **Manual Edits Forbidden**: Never manually edit files inside the synced web asset directories.
