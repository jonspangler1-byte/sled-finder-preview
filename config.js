// Sled Finder live-service settings.
// Leave SUPABASE_URL and SUPABASE_ANON_KEY empty and the app runs exactly as the demo (no accounts, everything
// saved only on this phone, "Viewing as" role switcher). Fill them in to turn on real accounts and cloud sync.
// The anon key is meant to be public: every table is locked down by row-level security (docs/supabase-schema.sql).
// NEVER put the Supabase service_role key or a Stripe secret key in this file.
window.SF_CONFIG = {
  SUPABASE_URL: "https://cpmieqcsbvozwrbjagqm.supabase.co",          // e.g. "https://abcd1234.supabase.co"  (Supabase → Project Settings → API)
  SUPABASE_ANON_KEY: "sb_publishable_tZSCKKnzcS51iyKWnDvddw_shhcX3Q4",     // the "anon public" key from the same page
  // Set true after the create-checkout / create-portal-session Edge Functions are deployed
  // and STRIPE_PRICE_ID is set in Supabase secrets. The functions create a Checkout Session
  // (and Customer Portal session) on the server so the account id cannot be edited in a URL.
  STRIPE_CHECKOUT: false,
  // Fallback only, if the Checkout function is off or fails: a Stripe Payment Link.
  STRIPE_PAYMENT_LINK: "",   // e.g. "https://buy.stripe.com/xxxxxxxx"
  // Fallback Customer Portal login link (used if the portal function is off or fails).
  STRIPE_PORTAL_LINK: "",    // Stripe customer-portal login link
  // Where magic-link emails send people back to. Empty = the page they signed in from.
  SITE_URL: "",              // e.g. "https://sledfinder.app/"
  // Show the made-up sample collectors and sample sale ads when live? Keep false for the real launch.
  SHOW_SAMPLE_DATA: false,
  // Web Push (installed PWA / browser). Public VAPID key only. Generate a pair with
  // `node scripts/generate-vapid-keys.mjs` and set the private key as the Supabase
  // secret VAPID_PRIVATE_KEY — never put the private key in this file or in the repo.
  VAPID_PUBLIC_KEY: "BH1sH0p7furLSS0TAq61RDV9ZIVGr7Qse7e5VuF9QfORVHh-KojbOLo7EPXwbv9h_U-dTzi9tbCurVuHO4LaC_o"
};
