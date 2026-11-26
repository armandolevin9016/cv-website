// Passwortschutz für die ganze Seite (Cloudflare Pages Function).
// Das Passwort steht nur als verschlüsseltes Secret SITE_PASSWORD bei Cloudflare,
// nie im Code. Fehlt das Secret, kommt niemand hinein (fail closed).

const COOKIE = "aw_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage
const enc = new TextEncoder();

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

// Vergleich ohne frühen Abbruch.
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function passwordMatches(input, secret) {
  // Beide Seiten werden gehasht, so haben sie gleiche Länge.
  const [x, y] = await Promise.all([hmac("cmp", input), hmac("cmp", secret)]);
  return safeEqual(x, y);
}

async function makeToken(secret) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const sig = toHex(await hmac(secret, "session.v1." + exp));
  return exp + "." + sig;
}

async function tokenValid(token, secret) {
  const [exp, sig] = (token || "").split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  const expected = enc.encode(toHex(await hmac(secret, "session.v1." + exp)));
  return safeEqual(expected, enc.encode(sig));
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

function cookieHeader(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function loginPage(message) {
  const note = message ? `<p class="err" role="alert">${message}</p>` : "";
  return `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>Armando Weder – Bewerbungsportfolio</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230e564f'/%3E%3Ctext x='32' y='43' font-size='30' text-anchor='middle' fill='%23f4fbf9' font-family='Georgia,serif' font-weight='700'%3EAW%3C/text%3E%3C/svg%3E">
<style>
:root{--bg:#f6f4ef;--surface:#fffcf8;--ink:#1c1915;--muted:#5c564c;--line:#ddd4c6;--line-strong:#8a8174;--accent:#0e564f;--accent-hover:#0a3f3a;--accent-ink:#f4fbf9;--err:#9b1c1c;--shadow:0 18px 40px rgba(28,25,21,.06);color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#111413;--surface:#1b201e;--ink:#f3f0e8;--muted:#c4bdb2;--line:#3a4440;--line-strong:#9a9288;--accent:#9ee0d6;--accent-hover:#c4f3ec;--accent-ink:#06211e;--err:#ffb4a8;--shadow:0 18px 40px rgba(0,0,0,.35);color-scheme:dark}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:1.25rem;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI","Noto Sans","Helvetica Neue",Arial,sans-serif;font-size:1.0625rem;line-height:1.6}
main{width:100%;max-width:26rem;background:var(--surface);border:1px solid var(--line);border-radius:1.05rem;box-shadow:var(--shadow);padding:2rem 1.5rem}
@media (min-width:480px){main{padding:2.5rem 2.25rem}}
.mark{display:grid;place-items:center;width:3.25rem;height:3.25rem;margin-bottom:1.25rem;border-radius:.9rem;background:var(--accent);color:var(--accent-ink);font:700 1.25rem "Iowan Old Style","Palatino Linotype",Palatino,"Noto Serif",Georgia,serif}
h1{margin:0 0 .35rem;font:700 1.75rem/1.2 "Iowan Old Style","Palatino Linotype",Palatino,"Noto Serif",Georgia,serif}
.lead{margin:0 0 1.5rem;color:var(--muted)}
label{display:block;margin-bottom:.4rem;font-weight:600}
input{width:100%;padding:.8rem .95rem;border:1px solid var(--line-strong);border-radius:.7rem;background:var(--bg);color:var(--ink);font:inherit}
input:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
button{width:100%;margin-top:1rem;padding:.85rem 1rem;border:0;border-radius:.7rem;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:700;cursor:pointer}
button:hover{background:var(--accent-hover)}
.err{margin:0 0 1rem;padding:.65rem .85rem;border:1px solid var(--err);border-radius:.7rem;color:var(--err);font-weight:600}
.hint{margin:1.25rem 0 0;font-size:.9rem;color:var(--muted)}
</style>
</head>
<body>
<main>
<div class="mark" aria-hidden="true">AW</div>
<h1>Armando Weder</h1>
<p class="lead">Bewerbungsportfolio. Bitte gib das Passwort ein, das du von mir erhalten hast.</p>
${note}
<form method="post" action="">
<label for="pw">Passwort</label>
<input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Anmelden</button>
</form>
<p class="hint">Geschützte Seite. Kein Passwort? Melde dich bei Armando.</p>
</main>
</body>
</html>`;
}

function secured(response) {
  const r = new Response(response.body, response);
  r.headers.set("X-Robots-Tag", "noindex, nofollow");
  return r;
}

function loginResponse(request, { message = "", status = 200, extra = {} } = {}) {
  const path = new URL(request.url).pathname;
  // Nicht-Seiten (z. B. .css, .js, .pdf) bekommen 401 statt einer HTML-Seite mit 200.
  const isAsset = /\.[a-z0-9]+$/i.test(path) && !/\.html?$/i.test(path);
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    ...extra,
  });
  return new Response(loginPage(message), {
    status: status === 200 && isAsset ? 401 : status,
    headers,
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const secret = typeof env.SITE_PASSWORD === "string" ? env.SITE_PASSWORD : "";

  // Abmelden: /?logout
  if (url.searchParams.has("logout")) {
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": cookieHeader("", 0),
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // Ohne gesetztes Secret kommt niemand hinein.
  if (!secret) {
    return loginResponse(request, {
      message: "Die Anmeldung ist noch nicht eingerichtet.",
      status: 503,
    });
  }

  // Gültiges Cookie: Seite ausliefern.
  if (await tokenValid(getCookie(request, COOKIE), secret)) {
    return secured(await next());
  }

  // Anmeldung per POST.
  if (request.method === "POST") {
    let input = "";
    try {
      const form = await request.formData();
      const value = form.get("password");
      input = typeof value === "string" ? value.slice(0, 256) : "";
    } catch (e) {
      input = "";
    }
    if (input && (await passwordMatches(input, secret))) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: url.pathname + url.search,
          "Set-Cookie": cookieHeader(await makeToken(secret), MAX_AGE),
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
    return loginResponse(request, { message: "Falsches Passwort", status: 401 });
  }

  return loginResponse(request);
}
