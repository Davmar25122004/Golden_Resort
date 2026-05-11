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

    var btn = document.createElement('span');
    btn.className = 'fp-month-btn';
    // Use the longhand month name from l10n to ensure correctness
    btn.textContent = instance.l10n.months.longhand[instance.currentMonth] + ' ▾';

    var list = document.createElement('div');
    list.className = 'fp-month-list';
    list.style.cssText = 'display:none;position:fixed;z-index:999999;';
    list.innerHTML = monthsData.map(m =>
        `<div class="fp-month-item${m.value === instance.currentMonth ? ' active' : ''}" data-month="${m.value}">${m.text}</div>`
    ).join('');
    document.body.appendChild(list);

    var wrap = document.createElement('div');
    wrap.className = 'fp-month-wrap';
    wrap.appendChild(btn);

    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        var isOpen = list.style.display === 'block';
        if (isOpen) { list.style.display = 'none'; return; }
        var rect = btn.getBoundingClientRect();
        list.style.top  = (rect.bottom + 4) + 'px';
        list.style.left = rect.left + 'px';
        list.style.display = 'block';
    });

    list.addEventListener('mousedown', (e) => e.stopPropagation());
    list.addEventListener('click', (e) => {
        e.stopPropagation();
        var item = e.target.closest('.fp-month-item');
        if (!item) return;
        var targetMonth = parseInt(item.dataset.month);
        instance.changeMonth(targetMonth - instance.currentMonth);
        list.style.display = 'none';
    });

    document.addEventListener('click', () => { list.style.display = 'none'; });
    select.parentNode.insertBefore(wrap, select);
}

function syncFancyMonth(instance) {
    var wrap = instance.calendarContainer.querySelector('.fp-month-wrap');
    if (!wrap) return;
    
    // Always use the fixed localization array to get the month name by absolute index
    var monthName = instance.l10n.months.longhand[instance.currentMonth];
    wrap.querySelector('.fp-month-btn').textContent = monthName + ' ▾';
    
    wrap.querySelectorAll('.fp-month-item').forEach(el =>
        el.classList.toggle('active', parseInt(el.dataset.month) === instance.currentMonth)
    );
}

var FP_CONFIG = {
    disableMobile: true,
    locale: 'es',
    onReady:       (_d, _s, instance) => initFancyMonthDropdown(instance),
    onMonthChange: (_d, _s, instance) => syncFancyMonth(instance),
};

