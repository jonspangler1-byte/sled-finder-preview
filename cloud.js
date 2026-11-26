// Sled Finder cloud layer: real accounts (Supabase Auth, email code / magic link), cloud sync of sleds,
// sale ads, community photo posts, comments and photos (Supabase Postgres + Storage), with an offline outbox.
//
// Design: localStorage on the phone stays the working copy, so the app keeps working with no signal.
// Every local save also queues an "outbox" entry; the outbox is pushed when signed in and online.
// Pulls bring the member's own sleds/ads/photo posts (from any device), other members' SHARED sleds
// and community photos (Premium only, enforced by row-level security on the server) and, for any
// signed-in member, sale ads. Sleds for Sale is not public — you need to be signed in to browse listings.
//
// With no SUPABASE_URL / SUPABASE_ANON_KEY in config.js, this file does nothing and the app runs as the demo.
(function () {
  "use strict";
  // Detect a Play Store Trusted Web Activity so we can hide Stripe checkout
  // (Play Payments policy). Web / PWA browsers keep checkout. The TWA sets
  // start_url ?src=twa and/or document.referrer android-app://…
  window.SF_isAndroidTwa = function () {
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("src") === "twa") sessionStorage.setItem("sf-src-twa", "1");
      if (sessionStorage.getItem("sf-src-twa") === "1") return true;
    } catch (e) { /* private mode or no sessionStorage */ }
    const ref = document.referrer || "";
    if (ref.indexOf("android-app://") === 0) {
      try { sessionStorage.setItem("sf-src-twa", "1"); } catch (e) { /* ignore */ }
      return true;
    }
    return false;
  };
  try { window.SF_isAndroidTwa(); } catch (e) { /* ignore */ }

  const C = window.SF_CONFIG || {};
  const enabled = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  const K = k => "svc_" + k;
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(K(k))); return v == null ? d : v } catch (e) { return d } };
  const set = (k, v) => { try { localStorage.setItem(K(k), JSON.stringify(v)); return true } catch (e) { console.warn("cloud: local save failed", k, e); return false } };
  const COUNTRIES = ["US", "CA", "GB", "IE"];
  const listeners = [];
  const Cloud = {
    enabled, ready: false, client: null, user: null, profile: get("cloudProfile", null),
    syncing: false, lastError: "", lastSync: get("lastSync", 0),
  };
  window.SFCloud = Cloud;
  // In live mode the made-up sample collectors and sample sale ads are hidden unless config says otherwise.
  if (enabled && !C.SHOW_SAMPLE_DATA) { window.SAMPLE_SLEDS = []; window.SALE_LISTINGS = []; window.SAMPLE_PHOTO_POSTS = []; window.SAMPLE_COMMENTS = []; window.SAMPLE_NOTIFICATIONS = []; }

  const emit = () => listeners.forEach(fn => { try { fn() } catch (e) { console.error(e) } });
  Cloud.onChange = fn => listeners.push(fn);

  // ───────── roles ─────────
  // free = never paid · premium = paid and current · lapsed = paid before, now expired · admin = Sled Finder.
  // The server decides (profiles.premium_until / is_admin); the app only reads it. Admins may "view as"
  // another role locally to check screens; the server still treats them as admin.
  Cloud.realRole = () => {
    const p = Cloud.user && Cloud.profile;
    if (!p) return "free";
    if (p.is_admin) return "admin";
    if (p.premium_until && Date.parse(p.premium_until) > Date.now()) return "premium";
    return p.premium_until ? "lapsed" : "free";
  };
  Cloud.role = () => {
    const r = Cloud.realRole();
    const v = get("adminViewAs", "");
    return r === "admin" && v && v !== "admin" ? v : r;
  };
  Cloud.setViewAs = r => set("adminViewAs", r);
  Cloud.handle = () => (Cloud.profile && Cloud.profile.handle) || "";
  Cloud.email = () => (Cloud.user && Cloud.user.email) || "";

  // ───────── outbox ─────────
  const outbox = () => get("outbox", []);
  Cloud.pending = () => outbox().length;
  // kind: "sled" | "listing" | "photo" | "comment"; op: "upsert" | "delete"; id: local id or "c<uuid>" for others' posts (admin).
  Cloud.queue = (kind, id, op) => {
    if (!enabled) return;
    const q = outbox().filter(x => !(x.kind === kind && x.id === id));
    q.push({ kind, id: String(id), op: op || "upsert", t: Date.now() });
    set("outbox", q);
    Cloud.flush();
  };

  // ───────── local stores ─────────
  const KINDS = { sled: "sleds", listing: "listings", photo: "photo_posts", comment: "comments" };
  const localKey = kind => ({ sled: "sleds", listing: "listings", photo: "photoPosts", comment: "comments" }[kind]);
  const findLocal = (kind, id) => get(localKey(kind), []).find(x => String(x.id) === String(id));
  const cacheKey = kind => ({ sled: "cloudShared", listing: "cloudListings", photo: "cloudPhotos", comment: "cloudComments" }[kind]);
  Cloud.sharedSleds = () => (enabled ? get("cloudShared", []) : []);
  Cloud.publicListings = () => (enabled ? get("cloudListings", []) : []);
  Cloud.sharedPhotos = () => (enabled ? get("cloudPhotos", []) : []);
  Cloud.sharedComments = () => (enabled ? get("cloudComments", []) : []);
  Cloud.exclusives = () => (enabled ? get("cloudExclusives", null) : null);
  // All published articles (teasers for everyone; body/data only when RLS allows).
  // null = not loaded yet or last pull failed; [] = loaded, none to show.
  Cloud.articles = () => (enabled ? get("cloudArticles", null) : null);
  Cloud.isCloudId = id => /^c[0-9a-f-]{36}$/.test(String(id));
  const SLED_TYPES = ["","Runner","Toboggan","Cutter","Bobsled","Saucer","Traverse","Flexy Racer","Ski Sled","Steerable Sled","Clipper","Sleigh","Tri-Runner","Other"];
  const sledTypeOf = x => (SLED_TYPES.includes(x && (x.sledType || x.sled_type)) ? (x.sledType || x.sled_type) : "");

  // ───────── photos ─────────
  const resolvePhoto = u => (window.SFApp && window.SFApp.phURL ? window.SFApp.phURL(u) : u);
  async function sha(s) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(b)].slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join("");
  }
  async function uploadPhotos(kind, clientId, imgs) {
    const map = get("photoMap", {}), out = [];
    for (const raw of imgs || []) {
      const u = resolvePhoto(raw);
      if (!u) continue;
      if (!/^data:image\//.test(u)) { out.push(u); continue; }  // already a URL (cloud photo or bundled demo image)
      const h = await sha(u);
      if (map[h]) { out.push(map[h]); continue; }
      const blob = await (await fetch(u)).blob();
      const path = `${Cloud.user.id}/${kind}-${clientId}/${h}.jpg`;
      const { error } = await Cloud.client.storage.from("photos").upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      const url = Cloud.client.storage.from("photos").getPublicUrl(path).data.publicUrl;
      map[h] = url; set("photoMap", map); out.push(url);
    }
    return out;
  }

  // ───────── row mapping ─────────
  const LOCAL_ONLY = ["id", "user", "mine", "userAdded", "likes", "imgs", "img", "cloudOwner", "cloudId", "updatedAt", "editedBy"];
  const strip = o => { const d = {}; Object.keys(o).forEach(k => { if (!LOCAL_ONLY.includes(k) && o[k] !== undefined) d[k] = o[k] }); return d };
  const cc = c => (COUNTRIES.includes(c) ? c : "US");
  const num = v => (v == null || v === "" || isNaN(+v) ? null : +v);
  function sledRow(s, photos) {
    return { client_id: String(s.id), maker: +s.maker || 0, brand: +s.maker === 2 ? (s.brand || "") : "", model: String(s.model || ""),
      sled_type: sledTypeOf(s), country: cc(s.country), region: s.locType === "na" ? "" : String(s.region || ""), town: s.locType === "na" ? "" : String(s.town || ""),
      lat: num(s.lat), lng: num(s.lng), shared: !!s.shared, photos, data: strip(s), edited_by: s.editedBy || null };
  }
  function listingRow(l, photos) {
    return { client_id: String(l.id), title: String(l.title || "Sled for sale").slice(0, 140), maker: +l.maker || 0, brand: +l.maker === 2 ? (l.brand || "") : "",
      model: String(l.model || ""), sled_type: sledTypeOf(l), price: String(l.price || ""), country: cc(l.country), town: String(l.town || ""),
      contact_email: String(l.email || ""), photos, data: strip(l), edited_by: l.editedBy || null };
  }
  function photoRow(x, photos) {
    return { client_id: String(x.id), caption: String(x.caption || ""), photos, data: strip(x), edited_by: x.editedBy || null };
  }
  function commentRow(x, photos) {
    return { client_id: String(x.id), target_type: x.targetType === "sled" ? "sled" : "photo_post",
      target_id: String(x.targetId || ""), body: String(x.body || "").slice(0, 2000), photos, data: strip(x) };
  }
  function fromRow(kind, r, mine) {
    const o = Object.assign({}, r.data || {}, {
      id: mine ? r.client_id : "c" + r.id, cloudId: r.id, user: mine ? "you" : (r.owner_handle || "member"),
      mine, maker: r.maker, brand: r.brand, model: r.model, sledType: r.sled_type || (r.data && r.data.sledType) || "",
      country: r.country, town: r.town,
      imgs: r.photos || [], img: (r.photos || [])[0] || "", editedBy: r.edited_by || undefined, updatedAt: Date.parse(r.updated_at) || 0,
      created: Date.parse(r.created_at) || 0,
    });
    if (mine) o.cloudOwner = r.owner;
    if (kind === "sled") Object.assign(o, { userAdded: mine, likes: o.likes || 0, region: r.region, lat: r.lat, lng: r.lng, shared: r.shared });
    else if (kind === "listing") Object.assign(o, { title: r.title, price: r.price, email: r.contact_email });
    else if (kind === "photo") Object.assign(o, { caption: r.caption || "", userAdded: mine });
    else if (kind === "comment") Object.assign(o, { targetType: r.target_type, targetId: r.target_id, body: r.body || "", userAdded: mine });
    return o;
  }

  // ───────── push ─────────
  function toRow(kind, item, photos) {
    if (kind === "sled") return sledRow(item, photos);
    if (kind === "listing") return listingRow(item, photos);
    if (kind === "photo") return photoRow(item, photos);
    return commentRow(item, photos);
  }
  async function pushOne(item) {
    const table = KINDS[item.kind];
    if (!table) return;
    const db = Cloud.client;
    if (Cloud.isCloudId(item.id)) {               // admin correcting someone else's post
      const uuid = item.id.slice(1);
      if (item.op === "delete") { const { error } = await db.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", uuid); if (error) throw error; return; }
      const cur = get(cacheKey(item.kind), []).find(x => x.id === item.id);
      if (!cur) return;
      const photos = (cur.imgs || []).map(resolvePhoto).filter(u => !/^data:/.test(u));
      const row = toRow(item.kind, cur, photos);
      delete row.client_id;
      const { error } = await db.from(table).update(row).eq("id", uuid); if (error) throw error; return;
    }
    if (item.op === "delete") {
      const { error } = await db.from(table).update({ deleted_at: new Date().toISOString() }).eq("owner", Cloud.user.id).eq("client_id", item.id);
      if (error) throw error; return;
    }
    const local = findLocal(item.kind, item.id);
    if (!local) return;                            // deleted locally before it was ever pushed
    if (local.cloudOwner && local.cloudOwner !== Cloud.user.id) return; // belongs to another account on this phone
    const photos = await uploadPhotos(item.kind, item.id, local.imgs && local.imgs.length ? local.imgs : (local.img ? [local.img] : []));
    const row = toRow(item.kind, local, photos);
    row.owner = Cloud.user.id; row.deleted_at = null;
    const { error } = await db.from(table).upsert(row, { onConflict: "owner,client_id" });
    if (error) throw error;
    // Claim it locally so it isn't offered for migration again.
    const arr = get(localKey(item.kind), []); const x = arr.find(y => String(y.id) === item.id);
    if (x && !x.cloudOwner) { x.cloudOwner = Cloud.user.id; set(localKey(item.kind), arr); }
  }
  Cloud._pushOne = pushOne;   // exposed for tests
  let flushing = null;
  Cloud.flush = () => {
    if (!enabled || !Cloud.user || !navigator.onLine) return Promise.resolve();
    if (flushing) return flushing;
    flushing = (async () => {
      Cloud.syncing = true; emit();
      let q = outbox();
      for (const item of q.slice()) {
        try {
          await pushOne(item);
          q = outbox().filter(x => !(x.kind === item.kind && x.id === item.id && x.t === item.t));
          set("outbox", q); Cloud.lastError = "";
        } catch (e) {
          console.warn("cloud push failed", item, e);
          const msg = String(e && (e.message || e.error_description) || e);
          Cloud.lastError = /row-level security|permission denied|42501|403/i.test(msg)
            ? (Cloud.realRole() === "premium" || Cloud.realRole() === "admin" ? "The server refused a change: " + msg
              : Cloud.freeAccessPromo ? "The server refused to save this sled. Free access may not be switched on in the database yet."
              : "Saved on this phone. It uploads once your membership is active.")
            : msg;
          break;                                   // keep order; retry later
        }
      }
      Cloud.syncing = false;
    })().finally(() => { flushing = null; emit(); });   // cleared after assignment, even when nothing was queued
    return flushing;
  };

  // ───────── pull ─────────
  function mergeMine(kind, rows) {
    const key = localKey(kind), arr = get(key, []), pending = new Set(outbox().filter(x => x.kind === kind).map(x => x.id));
    for (const r of rows) {
      const i = arr.findIndex(x => String(x.id) === r.client_id && (!x.cloudOwner || x.cloudOwner === r.owner));
      if (pending.has(r.client_id)) continue;     // a newer local change is waiting to upload
      if (r.deleted_at) { if (i >= 0) arr.splice(i, 1); continue; }
      const incoming = fromRow(kind, r, true);
      if (i < 0) arr.unshift(incoming);
      else if ((arr[i].updatedAt || 0) <= incoming.updatedAt) {
        // keep this phone's own photo refs (work offline) when the photo count matches
        const keepPics = (arr[i].imgs || []).length === incoming.imgs.length && (arr[i].imgs || []).some(u => String(u).startsWith("idb:"));
        arr[i] = Object.assign(incoming, keepPics ? { imgs: arr[i].imgs, img: arr[i].imgs[0] } : {});
      }
    }
    set(key, arr);
  }
  const premNow = () => { const r = Cloud.realRole(); return r === "premium" || r === "admin" };
  Cloud.freeAccessPromo = !!(C && C.FREE_ACCESS_PROMO);
  async function loadPromoFlag() {
    Cloud.freeAccessPromo = !!(C && C.FREE_ACCESS_PROMO);
    if (!Cloud.client || typeof Cloud.client.rpc !== "function") return;
    try {
      const r = await Cloud.client.rpc("free_access_promo");
      if (!r.error && typeof r.data === "boolean") Cloud.freeAccessPromo = r.data;
    } catch (e) { /* keep the config.js value if the function is not installed yet */ }
  }
  async function pullTable(kind, mineOnly) {
    const table = KINDS[kind], uid = Cloud.user && Cloud.user.id, db = Cloud.client;
    if (mineOnly) {
      if (!uid) return;
      const res = await db.from(table).select("*").eq("owner", uid).order("updated_at", { ascending: false }).limit(2000);
      if (res.error) {
        if (/could not find the table|schema cache|does not exist/i.test(res.error.message || "")) return;
        throw res.error;
      }
      mergeMine(kind, res.data || []);
      return;
    }
    const canPullShared = kind === "sled" ? (premNow() || Cloud.freeAccessPromo) : premNow();
    if (!canPullShared || (kind !== "sled" && !uid)) { set(cacheKey(kind), []); return; }
    let q = db.from(table).select("*").is("deleted_at", null).order("updated_at", { ascending: false }).limit(1000);
    if (kind === "sled") { q = q.eq("shared", true); if (uid) q = q.neq("owner", uid); }
    else q = q.neq("owner", uid);
    const res = await q;
    if (res.error) {
      if (/could not find the table|schema cache|does not exist/i.test(res.error.message || "")) { set(cacheKey(kind), []); return; }
      throw res.error;
    }
    set(cacheKey(kind), (res.data || []).map(r => fromRow(kind, r, false)));
  }
  Cloud.pull = async () => {
    if (!enabled || !Cloud.client || !navigator.onLine) return;
    const db = Cloud.client, uid = Cloud.user && Cloud.user.id;
    try {
      if (uid) {
        await pullTable("sled", true);
        await pullTable("listing", true);
        await pullTable("photo", true);
        await pullTable("comment", true);
        await pullTable("sled", false);
        await pullTable("photo", false);
        await pullTable("comment", false);
      } else if (Cloud.freeAccessPromo) {
        await pullTable("sled", false);
        set("cloudPhotos", []); set("cloudComments", []);
      } else {
        set("cloudShared", []); set("cloudPhotos", []); set("cloudComments", []);
      }
      // Sale ads: any signed-in member (free, paid, or lapsed). RLS hides them from signed-out visitors.
      if (uid) {
        const pl = await db.from("listings").select("*").eq("status", "active").is("deleted_at", null).neq("owner", uid).order("created_at", { ascending: false }).limit(500);
        if (pl.error) throw pl.error;
        set("cloudListings", pl.data.map(r => fromRow("listing", r, false)));
      } else set("cloudListings", []);
      try {
        const teasers = await db.from("article_teasers").select("*").eq("published", true).order("sort_order", { ascending: true }).limit(100);
        if (teasers.error) throw teasers.error;
        const rows = teasers.data || [];
        let bodies = {};
        const full = await db.from("articles").select("id,body,data,access,source,title,dek,byline,example,sort_order,published").eq("published", true).limit(100);
        if (!full.error) (full.data || []).forEach(a => { bodies[a.id] = a; });
        const merged = rows.map(t => {
          const b = bodies[t.id];
          const d = (b && b.data) || {};
          const coming = !!(t.coming_soon || t.comingSoon || d.comingSoon || d.coming_soon);
          return Object.assign({}, t, b || {}, { coming_soon: coming, hasBody: !!(b && ((b.body && String(b.body).trim()) || (d.blocks || []).length)) });
        });
        set("cloudArticles", merged);
        set("cloudExclusives", merged.filter(a => a.access === "exclusive" || a.source === "online"));
      } catch (e) {
        /* table/view may not exist until the migration is run */
        set("cloudArticles", []);
        set("cloudExclusives", []);
      }
      await pullNotifications();
      Cloud.lastSync = Date.now(); set("lastSync", Cloud.lastSync);
      if (!outbox().length) Cloud.lastError = "";   // keep an upload problem visible until it's resolved
    } catch (e) { console.warn("cloud pull failed", e); Cloud.lastError = String(e.message || e); }
    emit();
  };
  Cloud.syncNow = async () => { await Cloud.flush(); await Cloud.pull(); };

  // ───────── admin edits of other members' posts ─────────
  Cloud.adminSave = (kind, item) => {
    const key = cacheKey(kind), arr = get(key, []), i = arr.findIndex(x => x.id === item.id);
    if (i >= 0) { arr[i] = Object.assign({}, arr[i], item); set(key, arr); }
    Cloud.queue(kind, item.id, "upsert");
  };
  Cloud.adminDelete = (kind, id) => {
    set(cacheKey(kind), get(cacheKey(kind), []).filter(x => x.id !== id));
    Cloud.queue(kind, id, "delete");
  };

  // ───────── migration of sleds saved on this phone before accounts existed ─────────
  const unclaimed = kind => get(localKey(kind), []).filter(x => !x.cloudOwner && (kind === "sled" ? String(x.id).startsWith("u") : kind === "listing" ? String(x.id).startsWith("ul") : /^(pp|p|cm|cmt)/.test(String(x.id))));
  Cloud.unclaimedCount = () => (Cloud.user ? unclaimed("sled").length + unclaimed("listing").length + unclaimed("photo").length + unclaimed("comment").length : 0);
  Cloud.claimLocal = () => {
    const q = outbox();
    ["sled", "listing", "photo", "comment"].forEach(kind => unclaimed(kind).forEach(x => { if (!q.some(y => y.kind === kind && y.id === String(x.id))) q.push({ kind, id: String(x.id), op: "upsert", t: Date.now() }) }));
    set("outbox", q); set("migrationAsked", true);
    return Cloud.flush().then(Cloud.pull);
  };
  Cloud.skipMigration = () => { set("migrationAsked", true); emit(); };
  Cloud.migrationAsked = () => !!get("migrationAsked", false);

  // When a different account signs in on this phone, drop the previous account's synced copies (they stay in
  // that account's cloud). Anything not yet uploaded is kept and left alone.
  function forgetOtherAccounts(uid) {
    const pend = new Set(outbox().map(x => x.kind + ":" + x.id));
    ["sled", "listing", "photo", "comment"].forEach(kind => {
      const arr = get(localKey(kind), []);
      const keep = arr.filter(x => !x.cloudOwner || x.cloudOwner === uid || pend.has(kind + ":" + x.id));
      if (keep.length !== arr.length) set(localKey(kind), keep);
    });
  }

  // ───────── auth ─────────
  const redirectTo = () => C.SITE_URL || (location.origin + location.pathname);
  Cloud.sendCode = async email => {
    const { error } = await Cloud.client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(), shouldCreateUser: true } });
    if (error) throw error;
    set("pendingEmail", email);
  };
  Cloud.pendingEmail = () => get("pendingEmail", "");
  Cloud.verifyCode = async (email, code) => {
    const { error } = await Cloud.client.auth.verifyOtp({ email, token: String(code).trim(), type: "email" });
    if (error) throw error;
    set("pendingEmail", "");
  };
  Cloud.signOut = async () => {
    await Cloud.flush();
    if (Cloud.pending()) throw new Error(Cloud.pending() + " change(s) haven't uploaded yet. Connect to the internet and try again.");
    const uid = Cloud.user && Cloud.user.id;
    await Cloud.client.auth.signOut();
    // Remove this account's synced copies from the phone; they come back on next sign-in.
    ["sleds", "listings", "photoPosts", "comments"].forEach(k => set(k, get(k, []).filter(x => !x.cloudOwner || x.cloudOwner !== uid)));
    set("cloudShared", []); set("cloudListings", []); set("cloudPhotos", []); set("cloudComments", []); set("cloudExclusives", null); set("cloudArticles", null); set("cloudNotifications", []); set("notifyReads", {}); set("notifySettings", null); set("pushEndpoint", ""); set("cloudProfile", null); set("adminViewAs", ""); set("migrationAsked", false);
  };
  // Permanently deletes the account, its sleds, ads and photos, and cancels any Stripe subscription
  // (supabase/functions/delete-account). Sleds still on this phone are kept as local-only copies.
  Cloud.deleteAccount = async () => {
    const { data, error } = await Cloud.client.functions.invoke("delete-account", { method: "POST" });
    if (error || !data || !data.deleted) throw new Error((error && error.message) || (data && data.error) || "Couldn't delete the account");
    const uid = Cloud.user.id;
    ["sleds", "listings", "photoPosts", "comments"].forEach(k => set(k, get(k, []).map(x => { if (x.cloudOwner === uid) { const y = Object.assign({}, x); delete y.cloudOwner; return y } return x })));
    set("outbox", []); set("cloudShared", []); set("cloudListings", []); set("cloudPhotos", []); set("cloudComments", []); set("cloudExclusives", null); set("cloudArticles", null); set("cloudNotifications", []); set("notifyReads", {}); set("notifySettings", null); set("pushEndpoint", ""); set("cloudProfile", null); set("migrationAsked", true);
    await Cloud.client.auth.signOut().catch(() => {});
  };
  Cloud.loadProfile = async () => {
    if (!Cloud.user) { Cloud.profile = null; set("cloudProfile", null); return; }
    const cols = "id,handle,display_name,is_admin,premium_until,stripe_subscription_id,stripe_subscription_status,created_at";
    let { data, error } = await Cloud.client.from("profiles").select(cols).eq("id", Cloud.user.id).maybeSingle();
    // Older databases may not have newer profile columns yet (run the migration in docs/migrations/).
    if (error && /stripe_subscription_status|display_name|created_at|column/i.test(error.message)) {
      ({ data, error } = await Cloud.client.from("profiles").select("id,handle,is_admin,premium_until,stripe_subscription_id").eq("id", Cloud.user.id).maybeSingle());
    }
    if (error) { Cloud.lastError = error.message; return; }     // offline: keep the cached profile
    Cloud.profile = data; set("cloudProfile", data);
  };
  Cloud.setHandle = async h => {
    h = String(h || "").trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(h)) throw new Error("Use 3–30 letters, numbers or _ (no spaces).");
    const { error } = await Cloud.client.from("profiles").update({ handle: h }).eq("id", Cloud.user.id);
    if (error) throw new Error(/duplicate|unique/i.test(error.message) ? "That name is taken. Try another." : error.message);
    await Cloud.loadProfile(); emit();
  };
  Cloud.setDisplayName = async n => {
    n = String(n || "").trim().replace(/\s+/g, " ").slice(0, 80);
    if (n && !/^[\p{L}\p{M} .,'-]{1,80}$/u.test(n)) throw new Error("Use a name with letters, spaces or simple punctuation only.");
    const { error } = await Cloud.client.from("profiles").update({ display_name: n }).eq("id", Cloud.user.id);
    if (error) throw new Error(error.message);
    await Cloud.loadProfile(); emit();
  };
  Cloud.displayName = () => (Cloud.profile && Cloud.profile.display_name) || "";
  Cloud.memberSince = () => (Cloud.profile && Cloud.profile.created_at) || "";
  Cloud.memberId = () => {
    const id = Cloud.user && Cloud.user.id;
    if (!id) return "";
    return "SF-" + String(id).replace(/-/g, "").slice(0, 8).toUpperCase();
  };
  // An active / past_due / trialing / unpaid subscription should go to the Customer Portal, not a new Checkout.
  Cloud.hasOpenSubscription = () => {
    const s = Cloud.profile && Cloud.profile.stripe_subscription_status;
    return s === "active" || s === "past_due" || s === "trialing" || s === "unpaid";
  };
  Cloud.returnOrigin = () => {
    try { return location.origin + location.pathname; } catch (e) { return ""; }
  };
  // Fallback Payment Link only (the payer could edit client_reference_id). Prefer startCheckout().
  Cloud.checkoutUrl = () => {
    if (!C.STRIPE_PAYMENT_LINK || !Cloud.user) return "";
    const u = new URL(C.STRIPE_PAYMENT_LINK);
    u.searchParams.set("client_reference_id", Cloud.user.id);
    if (Cloud.user.email) u.searchParams.set("prefilled_email", Cloud.user.email);
    return u.toString();
  };
  Cloud.portalUrl = () => {
    if (!C.STRIPE_PORTAL_LINK) return "";
    const u = new URL(C.STRIPE_PORTAL_LINK);
    if (Cloud.user && Cloud.user.email) u.searchParams.set("prefilled_email", Cloud.user.email);
    return u.toString();
  };
  Cloud.paymentsOn = () => !!(C.STRIPE_CHECKOUT || C.STRIPE_PAYMENT_LINK);
  async function invokeBilling(name) {
    const { data, error } = await Cloud.client.functions.invoke(name, {
      method: "POST",
      body: { return_origin: Cloud.returnOrigin() },
    });
    if (data && data.url) return data;
    let detail = data && data.error;
    // Non-2xx: supabase-js hides the body behind a generic message; read the function's own error text.
    if (!detail && error && error.context && typeof error.context.json === "function") {
      try { const j = await error.context.json(); detail = j && j.error; } catch (_) { /* not JSON */ }
    }
    const msg = detail || (error && error.message) || "Couldn't reach Stripe";
    throw new Error(msg);
  }
  // Returns a Stripe Checkout (or portal) URL for the signed-in member. Navigating is the caller's job.
  Cloud.startCheckout = async () => {
    if (window.SF_isAndroidTwa && window.SF_isAndroidTwa()) throw new Error("Memberships are sold on the Sled Finder website, not in this Android app.");
    if (!Cloud.user) throw new Error("Sign in first");
    if (Cloud.hasOpenSubscription()) return Cloud.startPortal();
    if (C.STRIPE_CHECKOUT) {
      try {
        const data = await invokeBilling("create-checkout");
        return data.url;
      } catch (e) {
        if (!C.STRIPE_PAYMENT_LINK) throw e;
        console.warn("create-checkout failed, using Payment Link fallback", e);
      }
    }
    const u = Cloud.checkoutUrl();
    if (!u) throw new Error("Memberships aren't open yet");
    return u;
  };
  Cloud.startPortal = async () => {
    if (window.SF_isAndroidTwa && window.SF_isAndroidTwa()) throw new Error("Memberships are sold on the Sled Finder website, not in this Android app.");
    if (C.STRIPE_CHECKOUT) {
      try {
        const data = await invokeBilling("create-portal-session");
        return data.url;
      } catch (e) {
        if (!C.STRIPE_PORTAL_LINK) throw e;
        console.warn("create-portal-session failed, using portal login link", e);
      }
    }
    const u = Cloud.portalUrl();
    if (!u) throw new Error("The billing portal isn't available yet.");
    return u;
  };


  // ───────── notifications + web push ─────────
  const SETTING_KEYS = { sleds: "notify_sleds", articles: "notify_articles", photos: "notify_photos", listings: "notify_listings" };
  Cloud.notifications = () => (enabled && Cloud.user ? get("cloudNotifications", []) : []);
  Cloud.notifyReads = () => get("notifyReads", {});
  Cloud.notifySettings = () => get("notifySettings", { sleds: true, articles: true, photos: true, listings: true });
  Cloud.pushEnabled = () => !!(get("pushEndpoint", "") || (Cloud.notifySettings() && get("notifySettings", {}).push));
  function rowToNotice(r) {
    return {
      id: r.id, kind: r.kind, title: r.title, body: r.body || "", href: r.href || "#/notifications",
      actor_id: r.actor_id || null, target_id: r.target_id, example: false,
      created: r.created_at ? Date.parse(r.created_at) : 0,
    };
  }
  async function pullNotifications() {
    if (!Cloud.user) { set("cloudNotifications", []); return; }
    const db = Cloud.client;
    try {
      const nq = await db.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      if (nq.error) {
        if (!/could not find|does not exist|schema cache|relation/i.test(nq.error.message || "")) console.warn("notifications pull", nq.error.message);
        return;
      }
      set("cloudNotifications", (nq.data || []).map(rowToNotice));
      const rq = await db.from("notification_reads").select("notification_id");
      if (!rq.error) {
        const reads = {};
        (rq.data || []).forEach(r => { reads[r.notification_id] = true });
        set("notifyReads", reads);
      }
      const sq = await db.from("notification_settings").select("*").eq("user_id", Cloud.user.id).maybeSingle();
      if (!sq.error && sq.data) {
        set("notifySettings", {
          sleds: sq.data.notify_sleds !== false,
          articles: sq.data.notify_articles !== false,
          photos: sq.data.notify_photos !== false,
          listings: sq.data.notify_listings !== false,
          push: !!sq.data.push_enabled,
        });
      } else if (!sq.error && !sq.data) {
        const ins = await db.from("notification_settings").upsert({ user_id: Cloud.user.id }).select("*").maybeSingle();
        if (ins && ins.data) set("notifySettings", { sleds: true, articles: true, photos: true, listings: true, push: !!ins.data.push_enabled });
      }
      const pq = await db.from("push_subscriptions").select("endpoint").eq("user_id", Cloud.user.id);
      if (!pq.error && pq.data && pq.data.length) set("pushEndpoint", pq.data[0].endpoint);
    } catch (e) { console.warn("notifications pull failed", e); }
  }
  Cloud.saveNotifySettings = async (partial) => {
    const cur = Object.assign({}, Cloud.notifySettings(), partial || {});
    set("notifySettings", cur);
    emit();
    if (!Cloud.user) return;
    const row = { user_id: Cloud.user.id };
    Object.keys(SETTING_KEYS).forEach(k => { if (k in cur) row[SETTING_KEYS[k]] = !!cur[k] });
    if ("push" in cur) row.push_enabled = !!cur.push;
    const { error } = await Cloud.client.from("notification_settings").upsert(row, { onConflict: "user_id" });
    if (error) { Cloud.lastError = error.message; console.warn("notification settings", error); }
  };
  Cloud.markNotificationRead = async (id) => {
    Cloud.markNotificationsRead([id]);
  };
  Cloud.markNotificationsRead = async (ids) => {
    const list = (ids || []).filter(Boolean).map(String);
    if (!list.length) return;
    const reads = Object.assign({}, get("notifyReads", {}));
    list.forEach(id => { reads[id] = true });
    set("notifyReads", reads);
    emit();
    if (!Cloud.user) return;
    const rows = list.map(id => ({ user_id: Cloud.user.id, notification_id: id }));
    const { error } = await Cloud.client.from("notification_reads").upsert(rows, { onConflict: "user_id,notification_id" });
    if (error && !/could not find|does not exist|schema cache/i.test(error.message || "")) console.warn("notification reads", error);
  };

  function urlBase64ToUint8Array(b64) {
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  async function ensureServiceWorker() {
    if (!("serviceWorker" in navigator)) throw new Error("This browser can't receive device alerts.");
    return navigator.serviceWorker.register("sw.js");
  }
  Cloud.registerPushWorker = async () => {
    if (!enabled || !C.VAPID_PUBLIC_KEY || !("serviceWorker" in navigator)) return null;
    try { return await ensureServiceWorker(); } catch (e) { console.warn("service worker", e); return null; }
  };
  Cloud.enablePush = async () => {
    if (!Cloud.user) throw new Error("Sign in first");
    if (!C.VAPID_PUBLIC_KEY) throw new Error("Device alerts aren't configured yet.");
    if (!window.isSecureContext) throw new Error("Device alerts need a secure (https) page.");
    const reg = await ensureServiceWorker();
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Alerts were not allowed. You can turn them on in the browser settings.");
    }
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(C.VAPID_PUBLIC_KEY) });
    const json = sub.toJSON();
    const { error } = await Cloud.client.from("push_subscriptions").upsert({
      user_id: Cloud.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys && json.keys.p256dh,
      auth: json.keys && json.keys.auth,
      user_agent: String(navigator.userAgent || "").slice(0, 200),
    }, { onConflict: "endpoint" });
    if (error) throw new Error(error.message);
    set("pushEndpoint", json.endpoint);
    await Cloud.saveNotifySettings({ push: true });
  };
  Cloud.disablePush = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg && await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe().catch(() => {});
          if (Cloud.user && endpoint) await Cloud.client.from("push_subscriptions").delete().eq("endpoint", endpoint);
        }
      }
    } finally {
      set("pushEndpoint", "");
      await Cloud.saveNotifySettings({ push: false });
    }
  };


    async function onSession(session) {
    const prev = Cloud.user && Cloud.user.id;
    Cloud.user = session ? session.user : null;
    if (Cloud.user && Cloud.user.id !== prev) forgetOtherAccounts(Cloud.user.id);
    await Cloud.loadProfile();
    emit();
    if (Cloud.user) { await Cloud.flush(); }
    await Cloud.pull();
  }

  // Register the service worker on every load so the app meets PWA / TWA
  // installability checks. The worker itself does not cache assets.
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  Cloud.init = async () => {
    if (!enabled) return;
    if (!window.supabase || !window.supabase.createClient) {
      // Vendored copy of @supabase/supabase-js (MIT), loaded only when live mode is on.
      await new Promise(res => { const sc = document.createElement("script"); sc.src = "vendor/supabase-2.119.2.js"; sc.onload = sc.onerror = res; document.head.appendChild(sc); });
    }
    if (!window.supabase || !window.supabase.createClient) { Cloud.lastError = "Couldn't load the account library."; emit(); return; }
    Cloud.client = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    });
    Cloud.client.auth.onAuthStateChange((evt, session) => {
      if (evt === "INITIAL_SESSION") return;       // handled below
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED") setTimeout(() => onSession(session), 0);
    });
    await loadPromoFlag();
    const { data } = await Cloud.client.auth.getSession();
    // Magic-link return (?code=…): strip it from the address bar once the session exists.
    if (/[?&]code=/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash);
    Cloud.ready = true;
    await onSession(data.session);
    window.addEventListener("online", () => Cloud.syncNow());
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { Cloud.loadProfile().then(() => Cloud.syncNow()) } });
    setInterval(() => { if (document.visibilityState === "visible") Cloud.syncNow() }, 5 * 60 * 1000);
    Cloud.registerPushWorker();
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", ev => {
      const d = ev.data || {};
      if (d.type === "sf-open" && d.href) location.hash = String(d.href).charAt(0) === "#" ? d.href : "#/" + String(d.href).replace(/^#\/?/, "");
    });
  };
})();
