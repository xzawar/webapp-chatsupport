# Support Chat Web 1.0.0

## Host this console

Upload the contents of this folder to an HTTPS location on `keykraftt.com`, for example:

`https://keykraftt.com/support-chat/`

Do **not** open `index.html` with `file://`. Firebase Authentication and secure browser cryptography require HTTPS.

## One-time Firebase setup

1. In Firebase Console, open **Authentication → Settings → Authorized domains**.
2. Add `keykraftt.com` and `www.keykraftt.com` (or the exact subdomain you use).
3. Confirm **Authentication → Sign-in method → Anonymous** is enabled.
4. From the Android/Firebase project folder, deploy the updated security rules:

```bash
firebase deploy --only database,firestore:rules
```

## Pair a browser

1. Open the hosted page.
2. In the Android app, go to **Settings → Link a computer**.
3. Scan the QR code on the web page.
4. The web console opens automatically once the phone grants access.

The web browser gets an anonymous Firebase account, not your owner account. The app grants that anonymous account access only to your tenant. Removing the session from the browser's **Storage and data → Log out** revokes it.

## Web menu

The hamburger menu intentionally has only the app-equivalent areas:

- Chats
- Email
- Email automation
- Phone call
- Social media
- Settings
