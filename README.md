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

## Web navigation

Navigation is an icon rail down the left edge, not a hamburger. A drawer costs two actions to
reach anywhere (open it, then pick); the rail costs one and is always visible, which is the right
trade on a desktop console where the horizontal space is there anyway.

The rail carries only areas that also exist in the Android app:

- Chats
- Emails
- Calls
- Social
- Settings (pinned to the bottom of the rail)

Help is reached from inside Settings, exactly as it is on the phone. Email automation was removed
outright, because the app has no such screen and the web should not offer features the phone
cannot show. Emails and Social only appear when the workspace's plan includes them.
