# UI kit — Telegram & WhatsApp

From `src/channels/telegram-adapter.ts` and `whatsapp-adapter.ts`. Toggle the two
apps in the rail; the conversation is identical because the rules are about
message shape, not chrome.

- **Linking is two lines** — what it does, then the link — and confirmation is one.
- **A photo is read back before it is solved**, the same law as camera scan.
- **The receipt becomes a sentence**: "Verified with Wolfram." No badge, no emoji.
- **Limits are stated with the way through**: a timed mock needs the app, and the
  message says so and links there.
- **The channel never initiates.** No streak pings, no daily reminders.
- Messages stay under four lines; longer answers split at 4096 characters on a
  sentence boundary, never mid-formula.
