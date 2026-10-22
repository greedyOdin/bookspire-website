// Bookspire's website: clips that play only while seen, and the waitlist form.
// The key below is Supabase's public key, the same the app ships with: what it may do is
// limited by the database's row-level security. This page only calls the waitlist functions.
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
      // Which profile link led here (bookspire.de/?via=instagram), to see which ones reach people.
      const via = new URLSearchParams(location.search).get('via');
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
