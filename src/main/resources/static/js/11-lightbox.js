// ── ROOM LIGHTBOX ─────────────────────────────────────────────────────────────

var lbState   = { images: [], index: 0, preloads: [] };
let lbAnimGen = 0;

window.openRoomLightbox = (name, tipo, price) => {
    const images = TIPO_IMAGES[tipo] || [];
    lbState.images   = images;
    lbState.index    = 0;
    lbState.preloads = images.map(src => { var img = new Image(); img.src = src; return img; });
    
    var lb = document.getElementById('room-lightbox');
    lb.classList.remove('active'); // Limpieza de estado previo

    lb.querySelector('.room-lightbox-name').textContent  = name;
    lb.querySelector('.room-lightbox-price').textContent = price + '€ / noche';
    
    lbRender(false);
    lb.style.display = 'flex';
    
    // Pequeño delay para asegurar que el display:flex se ha procesado antes de animar
    setTimeout(() => {
        lb.classList.add('active');
    }, 10);
};

function lbRender(animate = true) {
    var lb        = document.getElementById('room-lightbox');
    var { images, index } = lbState;
    var imgEl     = lb.querySelector('.room-lightbox-img');
    var nextImgEl = lb.querySelector('.room-lightbox-img-next');

    var updateUI = () => {
        document.getElementById('lb-current').textContent = index + 1;
        document.getElementById('lb-total').textContent   = images.length;
        lb.querySelector('.room-lb-prev').classList.toggle('lb-hidden', images.length <= 1);
        lb.querySelector('.room-lb-next').classList.toggle('lb-hidden', images.length <= 1);
        document.getElementById('lb-dots').innerHTML = images.map((_, i) =>
            `<div class="room-lb-dot ${i === index ? 'active' : ''}" onclick="lbGoTo(${i})"></div>`
        ).join('');
    };

    if (animate) {
        var newSrc = images[index] || '';
        var alt    = lb.querySelector('.room-lightbox-name').textContent;
        var myGen  = ++lbAnimGen;

        nextImgEl.style.transition = 'none';
        nextImgEl.style.opacity    = '0';
        nextImgEl.classList.remove('visible');

        var doTransition = () => {
            if (myGen !== lbAnimGen) return;
            requestAnimationFrame(() => {
                if (myGen !== lbAnimGen) return;
                requestAnimationFrame(() => {
                    if (myGen !== lbAnimGen) return;
                    nextImgEl.style.transition = '';
                    nextImgEl.style.opacity    = '';
                    nextImgEl.classList.add('visible');
                    setTimeout(() => {
                        if (myGen !== lbAnimGen) return;
                        imgEl.src = newSrc;
                        imgEl.alt = alt;
                        var hide = () => {
                            if (myGen !== lbAnimGen) return;
                            nextImgEl.style.transition = 'none';
                            nextImgEl.style.opacity    = '0';
                            nextImgEl.classList.remove('visible');
                            updateUI();
                        };
                        imgEl.decode().then(hide).catch(hide);
                    }, 420);
                });
            });
        };

        nextImgEl.src = newSrc;
        if (nextImgEl.complete && nextImgEl.naturalWidth > 0) {
            doTransition();
        } else {
            nextImgEl.onload  = doTransition;
            nextImgEl.onerror = () => { if (myGen === lbAnimGen) { imgEl.src = newSrc; updateUI(); } };
        }
        updateUI();
    } else {
        imgEl.src = images[index] || '';
        imgEl.alt = lb.querySelector('.room-lightbox-name').textContent;
        updateUI();
    }
}

window.lbNav = (dir) => {
    lbState.index = (lbState.index + dir + lbState.images.length) % lbState.images.length;
    lbRender(true);
};

window.lbGoTo = (i) => {
    if (i === lbState.index) return;
    lbState.index = i;
    lbRender(true);
};

window.closeRoomLightbox = () => {
    var lb = document.getElementById('room-lightbox');
    lb.classList.remove('active');
    setTimeout(() => { lb.style.display = 'none'; }, 350);
};

document.addEventListener('keydown', e => {
    if (e.key === 'Escape')     closeRoomLightbox();
    if (e.key === 'ArrowLeft')  lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
});

