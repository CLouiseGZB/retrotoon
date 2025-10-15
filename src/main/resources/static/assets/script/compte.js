document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await fetch('/logout', { method: 'POST' });
  window.location.href = '/index.html'; // page publique
});
