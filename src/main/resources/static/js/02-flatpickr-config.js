// ── FLATPICKR ─────────────────────────────────────────────────────────────────

function initFancyMonthDropdown(instance) {
    var select = instance.calendarContainer.querySelector('.flatpickr-monthDropdown-months');
    if (!select || select.dataset.replaced) return;
    select.dataset.replaced = '1';
    select.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0;';

    var monthsData = Array.from(select.options).map(o => ({
        text: o.text,
        value: parseInt(o.value)
    }));

    var listId = 'fp-month-list-' + Math.random().toString(36).slice(2);

    var btn = document.createElement('span');
    btn.className = 'fp-month-btn';
    btn.dataset.listId = listId;
    btn.textContent = instance.l10n.months.longhand[instance.currentMonth] + ' ▾';

    var list = document.createElement('div');
    list.id = listId;
    list.className = 'fp-month-list';
    list.style.cssText = 'display:none;position:fixed;z-index:999999;overflow-y:auto;max-height:220px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;';
    list.innerHTML = monthsData.map(m =>
        `<div class="fp-month-item${m.value === instance.currentMonth ? ' active' : ''}" data-month="${m.value}">${m.text}</div>`
    ).join('');
    document.body.appendChild(list);

    var wrap = document.createElement('div');
    wrap.className = 'fp-month-wrap';
    wrap.appendChild(btn);

    function closeList() { list.style.display = 'none'; }

    btn.addEventListener('mousedown', e => e.stopPropagation());
    btn.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    btn.addEventListener('click', e => {
        e.stopPropagation();
        if (list.style.display === 'block') { closeList(); return; }
        var rect = btn.getBoundingClientRect();
        list.style.top  = (rect.bottom + 4) + 'px';
        list.style.left = rect.left + 'px';
        list.style.display = 'block';
        var active = list.querySelector('.fp-month-item.active');
        if (active) active.scrollIntoView({ block: 'nearest' });
    });

    // Evitar que scroll/touch dentro de la lista la cierre
    list.addEventListener('mousedown', e => e.stopPropagation());
    list.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    list.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
    list.addEventListener('click', e => {
        e.stopPropagation();
        var item = e.target.closest('.fp-month-item');
        if (!item) return;
        var targetMonth = parseInt(item.dataset.month);
        instance.changeMonth(targetMonth - instance.currentMonth);
        closeList();
    });

    document.addEventListener('click', closeList);
    select.parentNode.insertBefore(wrap, select);
}

function syncFancyMonth(instance) {
    var wrap = instance.calendarContainer.querySelector('.fp-month-wrap');
    if (!wrap) return;
    var btn = wrap.querySelector('.fp-month-btn');
    if (!btn) return;
    btn.textContent = instance.l10n.months.longhand[instance.currentMonth] + ' ▾';
    var list = document.getElementById(btn.dataset.listId);
    if (!list) return;
    list.querySelectorAll('.fp-month-item').forEach(el =>
        el.classList.toggle('active', parseInt(el.dataset.month) === instance.currentMonth)
    );
}

var FP_CONFIG = {
    disableMobile: true,
    locale: 'es',
    onReady:       (_d, _s, instance) => initFancyMonthDropdown(instance),
    onMonthChange: (_d, _s, instance) => syncFancyMonth(instance),
};

