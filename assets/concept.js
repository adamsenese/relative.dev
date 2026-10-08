/* Relative Industries: the homepage concept shown on each /for/ plan page.
   Renders a full, scrollable homepage in the prospect's own brand from the plan's `w` data.
   Older links (without the richer fields) still render, just with fewer sections. */
(function () {
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var hex = function (v) { return /^#[0-9a-f]{6}$/i.test(v || '') ? v : null; };

    // Line-art motifs drawn from each business's own branding (viewBox 0 0 400 300).
    var MOTIF = {
        skyline: '<path d="M10 260h380M30 260V170h34v90M64 260V120h40v140M104 260V190h26v70M130 260V90h46v170M176 260V150h30v110M206 260V60h20v-30h8v30h20v200M254 260V140h38v120M292 260V180h30v80M322 260V110h44v150"/><path d="M140 110h26M140 130h26M140 150h26M74 140h20M74 160h20M332 130h24M332 150h24M216 90h28M216 110h28M216 130h28" opacity=".6"/>',
        mountains: '<path d="M0 250l90-120 50 60 70-110 80 120 40-40 70 90"/><path d="M188 80l22 32 18-14 18 24" opacity=".7"/><path d="M0 270h400" opacity=".5"/><circle cx="320" cy="70" r="22" opacity=".8"/>',
        lighthouse: '<path d="M176 250l12-150h24l12 150z"/><path d="M182 100h36v-22h-36zM192 78v-12h16v12M200 66v-10"/><path d="M180 160h40M178 200h44" opacity=".7"/><path d="M218 86l150-40M218 92l150 30M182 86L40 50M182 92L40 120" opacity=".45"/><path d="M0 268c40-14 80 14 120 0s80-14 120 0 80 14 120 0 40 0 40 0" />',
        compass: '<circle cx="200" cy="150" r="110"/><circle cx="200" cy="150" r="86" opacity=".5"/><path d="M200 40v20M200 240v20M90 150h20M290 150h20" /><path d="M200 70l22 80-22 80-22-80z"/><path d="M120 150l80-18 80 18-80 18z" opacity=".6"/><circle cx="200" cy="150" r="6"/>',
        tree: '<path d="M200 270V170M200 200l-34-30M200 186l30-26M200 230l-24-18"/><circle cx="200" cy="110" r="70"/><circle cx="148" cy="140" r="44" opacity=".7"/><circle cx="254" cy="138" r="46" opacity=".7"/><path d="M120 270h160" opacity=".5"/>',
        columns: '<path d="M70 110l130-60 130 60zM60 110h280M80 250h240M70 266h260"/><path d="M100 124v118M136 124v118M172 124v118M228 124v118M264 124v118M300 124v118" /><path d="M92 124h16M128 124h16M164 124h16M220 124h16M256 124h16M292 124h16" opacity=".6"/>',
        chart: '<path d="M40 260h330M40 260V40"/><path d="M80 230v-50M130 230v-90M180 230v-70M230 230v-130M280 230v-110M330 230v-170" stroke-width="16" opacity=".35"/><path d="M80 170l50-40 50 20 50-70 50 10 50-60"/><circle cx="330" cy="30" r="7"/>',
        tooth: '<path d="M140 70c30-20 50 0 60 0s30-20 60 0 20 70 10 100-20 90-34 90-14-60-36-60-22 60-36 60-24-60-34-90-20-80 10-100z"/><path d="M168 100c10-8 22-6 32 0" opacity=".6"/><path d="M60 60l12 12M72 60L60 72M330 220l10 10M340 220l-10 10" opacity=".7"/>',
        paw: '<ellipse cx="200" cy="190" rx="60" ry="48"/><ellipse cx="128" cy="130" rx="22" ry="30"/><ellipse cx="170" cy="96" rx="22" ry="30"/><ellipse cx="230" cy="96" rx="22" ry="30"/><ellipse cx="272" cy="130" rx="22" ry="30"/>',
        leaf: '<path d="M90 230C110 110 210 60 330 60c0 120-60 200-180 200-20 0-40-10-60-30z"/><path d="M90 230C160 170 220 130 300 90" /><path d="M150 190l-6-40M190 164l-4-46M230 138l2-40M170 176l40 6M210 150l40 4" opacity=".6"/>',
        breath: '<circle cx="200" cy="150" r="40"/><circle cx="200" cy="150" r="80" opacity=".6"/><circle cx="200" cy="150" r="120" opacity=".3"/><path d="M20 250c40-20 80 20 120 0s80-20 120 0 80 20 120 0" opacity=".6"/>',
        eye: '<path d="M40 150c50-70 110-100 160-100s110 30 160 100c-50 70-110 100-160 100S90 220 40 150z"/><circle cx="200" cy="150" r="56"/><circle cx="200" cy="150" r="22"/><circle cx="214" cy="136" r="6" opacity=".7"/>',
        stride: '<ellipse cx="150" cy="110" rx="34" ry="56" transform="rotate(-14 150 110)"/><ellipse cx="250" cy="200" rx="34" ry="56" transform="rotate(14 250 200)"/><circle cx="120" cy="40" r="8" opacity=".7"/><circle cx="146" cy="34" r="8" opacity=".7"/><circle cx="172" cy="38" r="8" opacity=".7"/><circle cx="280" cy="132" r="8" opacity=".7"/><circle cx="254" cy="126" r="8" opacity=".7"/><circle cx="228" cy="130" r="8" opacity=".7"/>',
        lotus: '<path d="M200 230c-30-40-30-100 0-150 30 50 30 110 0 150z"/><path d="M200 230c-60-10-100-60-100-120 50 10 90 60 100 120zM200 230c60-10 100-60 100-120-50 10-90 60-100 120z"/><path d="M60 250h280" opacity=".5"/><path d="M200 230c-80 10-130-20-150-60M200 230c80 10 130-20 150-60" opacity=".5"/>',
        bowl: '<path d="M70 170h260c0 60-60 100-130 100S70 230 70 170z"/><path d="M110 170c10-40 40-60 70-60M200 170c0-50 30-90 70-100M250 170c10-30 30-40 50-40" /><path d="M150 110c-10-20 0-40 20-50 6 20-2 40-20 50z" opacity=".7"/>',
        home: '<path d="M80 150l120-90 120 90M110 128v122h180V128"/><path d="M200 222c-30-22-46-38-46-56 0-12 10-22 22-22 10 0 18 6 24 14 6-8 14-14 24-14 12 0 22 10 22 22 0 18-16 34-46 56z"/>',
        spine: '<path d="M200 30c-20 40 20 80 0 120s20 80 0 120" /><path d="M176 60h48M172 100h56M176 140h48M172 180h56M176 220h48M180 260h40" opacity=".7"/><circle cx="120" cy="150" r="60" opacity=".35"/><circle cx="280" cy="150" r="60" opacity=".35"/>'
    };

    var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
    var ICON = {
        cal: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M12 14h2M16 14h0"/>'),
        lock: ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
        up: ic('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
        card: ic('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
        doc: ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
        list: ic('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
        chat: ic('<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/>'),
        phone: ic('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
        pin: ic('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
        star: ic('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
        mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
        user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
        heart: ic('<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>'),
        calc: ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h0M16 12h0M8 16h2M12 16h0M16 16h0"/>'),
        arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>')
    };
    function pick(t) {
        t = String(t).toLowerCase();
        var rules = [[/book|schedul|appoint|visit|meeting|times|consult/, 'cal'], [/portal|login|log in|record/, 'lock'], [/upload|file|send|secure/, 'up'],
            [/pay|invoice|fee|bill|financ|carecredit|payment/, 'card'], [/checklist|form|forms/, 'list'], [/letter|tax center|resource|guide|101|newsletter|tips|calculator/, 'doc'],
            [/question|ask|text|help|contact|chat/, 'chat'], [/call|phone/, 'phone'], [/location|direction|hours/, 'pin'], [/review|offer|promo/, 'star'],
            [/therapist|team|doctor|career|client|patient|new/, 'user'], [/insurance|plan|wellness|refill|care/, 'heart']];
        for (var i = 0; i < rules.length; i++) if (rules[i][0].test(t)) return ICON[rules[i][1]];
        return ICON.arrow;
    }

    // their own images, via an https image proxy (old http-only sites still load), with a clean fallback
    function img(u, o) {
        if (!u) return '';
        var q = 'https://images.weserv.nl/?url=' + encodeURIComponent(u.replace(/^https?:\/\//, '')) + (o || '');
        return q;
    }
    function pic(u, opts, cls, kind, extra) {
        if (!u) return '';
        var raw = /^https:/.test(u) ? u : '';
        return '<img class="' + cls + '" src="' + esc(img(u, opts)) + '" data-raw="' + esc(raw) + '" data-k="' + kind + '" onerror="Concept.err(this)" ' + (extra || 'alt=""') + '>';
    }
    function err(el) {
        if (el.dataset.raw && !el.dataset.tried) { el.dataset.tried = '1'; el.src = el.dataset.raw; return; }
        var k = el.dataset.k, p = el.parentNode;
        if (k === 'logo' && p && p.dataset.fb) { p.innerHTML = p.dataset.fb; return; }
        if (k === 'photo' && p) p.classList.remove('has-photo');
        el.remove();
    }
    function lighten(c, pct) { return 'color-mix(in srgb, ' + c + ' ' + pct + '%, #fff)'; }

    function render(site, p, w) {
        w = w || {};
        var c1 = hex(w.c1), c2 = hex(w.c2) || c1;
        site.style.setProperty('--h', w.h != null ? w.h : 220);
        if (c1) {
            site.style.setProperty('--c', c1);
            site.style.setProperty('--c2', c2);
            site.style.setProperty('--c-ink', hex(w.ink) || 'color-mix(in srgb, ' + c1 + ' 30%, #111)');
            site.style.setProperty('--c-wash', lighten(c1, 6));
            site.style.setProperty('--c-soft', lighten(c1, 18));
        }
        var serif = w.st !== 'sans';
        var lay = w.lay || (serif ? 'banner' : 'split');
        site.className = 'site ' + (serif ? 'serif' : 'sans') + ' lay-' + lay + (w.fd ? ' fd-' + w.fd : '');

        var name = p.b;
        var mark = w.lg || (name.match(/[A-Za-z]/) || ['R'])[0].toUpperCase();
        var place = [p.c, p.s].filter(Boolean).join(', ');
        var ctaText = w.ct || 'Get in touch';
        var phone = w.ph || '';
        var nav = (w.nv || []).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
        var facts = (w.fx || []).filter(Boolean);
        var people = (w.pp || []).filter(function (x) { return x && x[0]; });
        var wd = w.wd || {};
        var motif = MOTIF[w.mo] || MOTIF.skyline;

        var widget = '<div class="cw-card">' +
            '<h4>' + esc(wd.t || 'Get in touch') + '</h4>' +
            (wd.f || []).map(function (f) { return '<div class="f">' + esc(f) + '</div>'; }).join('') +
            ((wd.sl || []).length ? '<div class="sl"><small>' + esc(wd.slh || 'Next available') + '</small>' + wd.sl.map(function (x, i) { return '<span' + (i === 0 ? ' class="on"' : '') + '>' + esc(x) + '</span>'; }).join('') + '</div>' : '') +
            '<div class="b">' + esc(wd.b || 'Send') + '</div>' +
            '<div class="note">' + esc(wd.n || 'We reply quickly') + '</div></div>';

        var photo = w.im ? pic(w.im, '&w=1600&q=80&output=webp', 'ph', 'photo') : '';
        var art = '<div class="cw-art' + (photo ? ' has-photo' : '') + '" aria-hidden="true">' +
            photo + '<span class="cw-dots"></span>' +
            '<svg viewBox="0 0 400 300" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + motif + '</svg>' +
            (facts[0] ? '<span class="cw-chip">' + esc(facts[0]) + '</span>' : '') + '</div>';

        var util = (w.ad || phone || w.hr) ?
            '<div class="cw-util"><span>' + esc([w.ad, w.hr].filter(Boolean).join(' · ')) + '</span><span>' + (w.pt ? '<a>' + ICON.lock + esc(w.pt) + '</a>' : '') + (phone ? '<b>' + esc(phone) + '</b>' : '') + '</span></div>' : '';

        var textLogo = '<i class="mk' + (mark.length > 2 ? ' wide' : '') + '">' + esc(mark) + '</i><span><b>' + esc(name) + '</b>' + (w.ds ? '<small>' + esc(w.ds) + '</small>' : '') + '</span>';
        var logoHtml = textLogo;
        if (w.lo && w.lw === 'mark') {
            logoHtml = pic(w.lo, '&w=120&h=120&fit=inside', 'lg-mark', 'mark') + '<span><b>' + esc(name) + '</b>' + (w.ds ? '<small>' + esc(w.ds) + '</small>' : '') + '</span>';
        } else if (w.lo) {
            logoHtml = pic(w.lo, '&h=140&fit=inside', 'lg-full', 'logo', 'alt="' + esc(name) + '"');
        }
        var head = '<header class="cw-head' + (w.lo && w.lw === 'white' ? ' dark' : '') + '"><span class="cw-logo" data-fb="' + esc(textLogo) + '">' + logoHtml + '</span>' +
            '<nav class="cw-nav">' + nav + '</nav><span class="cw-pill">' + esc(ctaText) + '</span></header>';

        var heroText = '<span class="cw-eyebrow">' + esc(w.ey || place || 'Welcome') + '</span>' +
            '<h2>' + esc(w.tg || '') + '</h2>' +
            (w.sb ? '<p>' + esc(w.sb) + '</p>' : '') +
            '<div class="cw-ctas"><span class="cw-btn p">' + esc(ctaText) + '</span>' + (phone ? '<span class="cw-btn g">Call ' + esc(phone) + '</span>' : '<span class="cw-btn g">Call us</span>') + '</div>' +
            (w.tr ? '<div class="cw-trust">' + esc(w.tr) + '</div>' : '');

        var hero = lay === 'banner'
            ? '<section class="cw-hero banner' + (photo ? ' has-photo' : '') + '">' + photo + '<div class="cw-bannerart" aria-hidden="true"><svg viewBox="0 0 400 300" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + motif + '</svg></div><div class="cw-hero-in">' + heroText + '</div></section>'
            : '<section class="cw-hero split"><div class="cw-hero-in">' + heroText + '</div><div class="cw-hero-side">' + art + widget + '</div></section>';

        var qa = (w.qa || []).length ? '<section class="cw-qa">' + w.qa.map(function (x) { return '<span><i>' + pick(x) + '</i>' + esc(x) + '<em>→</em></span>'; }).join('') + '</section>' : '';

        var factBand = facts.length ? '<section class="cw-facts">' + facts.map(function (f) { return '<div>' + esc(f) + '</div>'; }).join('') + '</section>' : '';

        var services = (w.sv || []).length ? '<section class="cw-sec"><div class="cw-sec-h"><span class="cw-k">' + esc(w.svk || 'What we do') + '</span><h3>' + esc(w.svh || 'How we can help') + '</h3></div><div class="cw-svcs">' +
            w.sv.map(function (s, i) { return '<article class="cw-svc"><span class="n">0' + (i + 1) + '</span><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p><span class="more">Learn more →</span></article>'; }).join('') + '</div></section>' : '';

        var visit = (w.ad || phone) ? '<div class="cw-visit"><span class="cw-k">Visit us</span>' +
            (w.ad ? '<p>' + ICON.pin + '<span>' + esc(w.ad) + '</span></p>' : '') + (phone ? '<p>' + ICON.phone + '<span>' + esc(phone) + '</span></p>' : '') + (w.hr ? '<p>' + ICON.cal + '<span>' + esc(w.hr) + '</span></p>' : '') +
            '<div class="b">' + esc(ctaText) + '</div></div>' : '';
        var about = (w.ab || people.length) ? '<section class="cw-sec cw-about"><div><span class="cw-k">About</span><h3>' + esc(w.abh || ('Meet ' + name)) + '</h3>' + (w.ab ? '<p>' + esc(w.ab) + '</p>' : '') + '</div>' +
            (people.length ? '<div class="cw-people">' + people.map(function (x) {
                var ini = x[0].replace(/^(Dr\.|Drs\.)\s*/, '').split(/\s+/).map(function (s) { return s[0]; }).join('').slice(0, 2);
                return '<div class="cw-person"><i>' + pic(x[2], '&w=120&h=120&fit=cover&a=attention', '', 'avatar') + esc(ini) + '</i><span><b>' + esc(x[0]) + '</b>' + (x[1] ? '<small>' + esc(x[1]) + '</small>' : '') + '</span></div>';
            }).join('') + '</div>' : visit) + '</section>' : '';

        var quote = w.q && w.q[0] ? '<section class="cw-quote"><blockquote>“' + esc(w.q[0].replace(/^[“"]|[”"]$/g, '')) + '”</blockquote>' + (w.q[1] ? '<cite>' + esc(w.q[1]) + '</cite>' : '') + '</section>' : '';

        var ctaBand = '<section class="cw-cta"><div><span class="cw-k">' + esc(w.ck || 'Get started') + '</span><h3>' + esc(w.ch || 'We’d love to hear from you.') + '</h3>' +
            (phone ? '<p>Prefer to talk? Call <b>' + esc(phone) + '</b>' + (w.hr ? ' · ' + esc(w.hr) : '') + '</p>' : '') + '</div>' + (lay === 'banner' ? widget : (visit || widget)) + '</section>';

        var foot = '<footer class="cw-foot"><div><b>' + esc(name) + '</b>' + (w.ds ? '<span>' + esc(w.ds) + '</span>' : '') + '</div>' +
            '<div>' + (w.ad ? '<span>' + esc(w.ad) + '</span>' : '<span>' + esc(place) + '</span>') + (phone ? '<span>' + esc(phone) + '</span>' : '') + '</div>' +
            '<div class="cw-fnav">' + nav + '</div></footer>';

        site.innerHTML = util + head + hero + qa + factBand + services + about + quote + ctaBand + foot;
    }

    window.Concept = { render: render, err: err };
})();
