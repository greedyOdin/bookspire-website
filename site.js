// Bookspire's website: clips that play only while seen, the waitlist form, and where
// visitors came from (also loaded by the guild page, which leads to the waitlist).
// The key below is Supabase's public key, the same the app ships with: what it may do is
// limited by the database's row-level security. The pages only call the waitlist functions
// and the one that redeems a code.
const SUPABASE_URL = 'https://aqmfowqczfvkqowdbbmb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbWZvd3FjemZ2a3Fvd2RiYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODE4ODQsImV4cCI6MjEwNzA1Nzg4NH0.iUAGFcDels4AVrVPmpbeJEMPVSX8uaXWysF3u27rIz4';

// Clips load when they come near and pause when they leave, so a long page stays light.
// Who asked for less motion sees the still pictures only.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const videos = document.querySelectorAll('video[data-src]');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const watcher = new IntersectionObserver(
    (entries) => {
      for (const { target: video, isIntersecting } of entries) {
        if (isIntersecting) {
          if (!video.src) {
            video.src = video.dataset.src;
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: '200px 0px' }
  );
  videos.forEach((video) => watcher.observe(video));
}

async function callSupabase(name, args) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.status === 204 ? null : response.json();
}

const english = document.documentElement.lang === 'en';
const TEXT = english
  ? {
      sending: 'One moment …',
      invalid: 'That does not look like an email address.',
      done: 'Almost there! Check your inbox and confirm with the link.',
      later: 'Almost there! Many people are signing up today, so your confirmation email may take until tomorrow.',
      failed: 'That did not work. Please try again in a moment.',
    }
  : {
      sending: 'Einen Moment …',
      invalid: 'Das sieht nicht nach einer E-Mail-Adresse aus.',
      done: 'Fast geschafft! Schau in dein Postfach und bestätige mit dem Link.',
      later: 'Fast geschafft! Heute tragen sich besonders viele ein, deshalb kann deine Bestätigungsmail bis morgen dauern.',
      failed: 'Das hat nicht geklappt. Bitte versuch es gleich noch einmal.',
    };

// Which profile link led here (bookspire.de/?via=instagram), to see which ones reach people.
// It rides along in the links to our other pages, so switching the language or looking at
// the guild page first does not lose it; nothing is stored.
const via = new URLSearchParams(location.search).get('via');
if (via) {
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && !url.searchParams.has('via')) {
      url.searchParams.set('via', via);
      link.href = url.href;
    }
  }
}

// A quiet hint when the browser prefers the other language. Shown only to visitors who arrive
// from elsewhere, so nothing needs to be stored to keep it from coming back on every page.
const switchLink = document.querySelector('.lang');
const preferred = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
const arrivedFromElsewhere = !document.referrer.startsWith(location.origin);
if (switchLink && preferred && preferred.startsWith('de') === english && arrivedFromElsewhere) {
  const hint = document.createElement('aside');
  hint.className = 'lang-hint';
  hint.lang = english ? 'de' : 'en';
  const text = document.createElement('span');
  text.textContent = english ? 'Diese Seite gibt es auch auf Deutsch.' : 'This page is also available in English.';
  const link = document.createElement('a');
  link.href = switchLink.href;
  link.hreflang = hint.lang;
  link.textContent = english ? 'Auf Deutsch lesen' : 'Read in English';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'lang-hint-close';
  close.setAttribute('aria-label', english ? 'Schließen' : 'Close');
  close.textContent = '×';
  close.addEventListener('click', () => hint.remove());
  hint.append(text, link, close);
  document.body.append(hint);
}

const form = document.querySelector('.waitlist-form');
if (form) {
  const status = document.querySelector('.form-status');
  const button = form.querySelector('button');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = form.email.value.trim();
    // Filled in only by bots: they get the same answer and nothing happens.
    if (form.website.value) {
      status.textContent = TEXT.done;
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      status.textContent = TEXT.invalid;
      form.email.focus();
      return;
    }
    button.disabled = true;
    status.textContent = TEXT.sending;
    try {
      const answer = await callSupabase('join_waitlist', { address, lang: english ? 'en' : 'de', via });
      status.textContent = answer === 'later' ? TEXT.later : TEXT.done;
      form.reset();
    } catch {
      status.textContent = TEXT.failed;
    } finally {
      button.disabled = false;
    }
  });
}

// The pages the links in the email lead to: confirm, or leave the list.
const action = document.body.dataset.waitlist;
if (action) {
  const token = new URLSearchParams(location.search).get('t');
  const show = (state) => {
    document.querySelectorAll('[data-state]').forEach((element) => {
      element.hidden = element.dataset.state !== state;
    });
  };
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    show('invalid');
  } else {
    callSupabase(action === 'confirm' ? 'confirm_waitlist' : 'leave_waitlist', { t: token })
      .then((ok) => show(ok ? 'done' : 'invalid'))
      .catch(() => show('failed'));
  }
}

// Redeeming a code from a creator: the gift goes to the account with this address and
// shows up in the app the next time it starts.
const REDEEM = english
  ? {
      sending: 'One moment …',
      invalid: 'That does not look like an email address.',
      empty: 'Please enter the code too.',
      redeemed: 'Redeemed! Open Bookspire (or close and reopen it) and your gift will be waiting in your reading room.',
      known: 'You have already redeemed this gift with this address. It is waiting for you in the app.',
      unknown: 'We do not know this code. Please check how it is spelled.',
      notYet: 'This code is not valid yet. Please try again once the campaign has started.',
      ended: 'Sorry, this code has expired.',
      busy: 'A great many people are redeeming codes right now. Please try again tomorrow.',
      failed: 'That did not work. Please try again in a moment.',
    }
  : {
      sending: 'Einen Moment …',
      invalid: 'Das sieht nicht nach einer E-Mail-Adresse aus.',
      empty: 'Bitte gib auch den Code ein.',
      redeemed: 'Eingelöst! Öffne Bookspire (oder schließ die App einmal und öffne sie neu), dann wartet dein Geschenk in deinem Lesezimmer.',
      known: 'Dieses Geschenk hast du mit dieser Adresse schon eingelöst. Es wartet in der App auf dich.',
      unknown: 'Diesen Code kennen wir nicht. Prüf bitte die Schreibweise.',
      notYet: 'Dieser Code gilt noch nicht. Probier es bitte noch einmal, sobald die Aktion begonnen hat.',
      ended: 'Dieser Code ist leider abgelaufen.',
      busy: 'Gerade lösen sehr viele einen Code ein. Bitte versuch es morgen noch einmal.',
      failed: 'Das hat nicht geklappt. Bitte versuch es gleich noch einmal.',
    };

const redeemForm = document.querySelector('.redeem-form');
if (redeemForm) {
  const status = document.querySelector('.form-status');
  const button = redeemForm.querySelector('button');
  redeemForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = redeemForm.email.value.trim();
    const code = redeemForm.code.value.trim();
    // Filled in only by bots: they get a plain answer and nothing happens.
    if (redeemForm.website.value) {
      status.textContent = REDEEM.unknown;
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      status.textContent = REDEEM.invalid;
      redeemForm.email.focus();
      return;
    }
    if (!code) {
      status.textContent = REDEEM.empty;
      redeemForm.code.focus();
      return;
    }
    button.disabled = true;
    status.textContent = REDEEM.sending;
    try {
      const answer = await callSupabase('redeem_set_code', { address, code });
      status.textContent = REDEEM[answer] ?? REDEEM.failed;
      if (answer === 'redeemed' || answer === 'known') {
        redeemForm.reset();
      }
    } catch {
      status.textContent = REDEEM.failed;
    } finally {
      button.disabled = false;
    }
  });
}
