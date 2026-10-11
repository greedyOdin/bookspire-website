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
      failed: 'That did not work. Please try again in a moment.',
    }
  : {
      sending: 'Einen Moment …',
      invalid: 'Das sieht nicht nach einer E-Mail-Adresse aus.',
      done: 'Fast geschafft! Schau in dein Postfach und bestätige mit dem Link.',
      failed: 'Das hat nicht geklappt. Bitte versuch es gleich noch einmal.',
    };

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
      await callSupabase('join_waitlist', { address, lang: english ? 'en' : 'de' });
      status.textContent = TEXT.done;
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
