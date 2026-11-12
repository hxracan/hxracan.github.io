try {
  document.documentElement.dataset.theme =
    JSON.parse(localStorage.getItem('unblockedgames.theme')) === 'light' ? 'light' : 'dark';
} catch {}
