// ── START ─────────────────────────────────────────────────────────────────────

// Aplicar idioma guardado antes de que la página sea visible
document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('lang-btn--active', btn.dataset.lang === LANG);
});
applyTranslations();

init();
