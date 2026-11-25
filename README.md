# Sled Finder preview

This is a **working preview** of the real Sled Finder app, built from the `backend` branch of [sled-collector-mockup](https://github.com/jonspangler1-byte/sled-collector-mockup) at commit b6d1594afe5006e98a3e285f510a467f7352c31f.

It is **not** the public clickable demo on GitHub Pages (`main`). That demo was not changed.

Open: https://jonspangler1-byte.github.io/sled-finder-preview/

Accounts and cloud sync talk to the live Supabase project. Sign-in needs the preview URL added to the project's Auth Redirect URLs, and (for anyone who is not a project team member) custom SMTP. See `docs/go-live.md` in the backend branch.

Join Premium is turned on here only, in Stripe test mode, so a practice payment can be tried. The `backend` branch in sled-collector-mockup still has `STRIPE_CHECKOUT` off.
