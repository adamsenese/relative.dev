/* Relative Industries — shared behaviour for landing pages. */
(function () {
    // Paste the Google Apps Script web-app URL here (see _ops/README.md).
    // While empty, forms fall back to a pre-filled email to hello@relative.dev.
    var LEADS_ENDPOINT = '';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var R = window.Relative = { endpoint: LEADS_ENDPOINT, reduce: reduce };

    // ---- sticky nav gains a surface once you scroll ----
    R.nav = function () {
        var nav = document.querySelector('.nav');
        if (!nav) return;
        var on = function () { nav.classList.toggle('solid', window.scrollY > 8); };
        window.addEventListener('scroll', on, { passive: true });
        on();
    };

    // ---- reveal on scroll ----
    R.reveal = function (root) {
        var els = (root || document).querySelectorAll('.rv:not(.in)');
        if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
        var io = new IntersectionObserver(function (entries) {
            var k = 0;
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.style.transitionDelay = Math.min(k++ * 80, 320) + 'ms';
                en.target.classList.add('in');
                io.unobserve(en.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach(function (e) { io.observe(e); });
    };

    // ---- the week: 5 days × 8 hours. Admin hours turn into hours returned. ----
    // opts: { admin: n, back: n, tips: [labels for returned hours], counter: element }
    R.week = function (el, opts) {
        var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hours = ['9', '10', '11', '12', '1', '2', '3', '4'];
        var total = days.length * hours.length;
        var admin = Math.max(1, Math.min(total - 6, opts.admin | 0));
        var back = Math.max(0, Math.min(admin, opts.back | 0));
        var tips = opts.tips && opts.tips.length ? opts.tips : ['Hour returned'];

        // deterministic spread so the pattern looks considered, not random
        var seed = 7, order = [];
        for (var i = 0; i < total; i++) order.push(i);
        order.sort(function (a, b) { seed = (seed * 9301 + 49297) % 233280; return ((a * 37 + seed) % 11) - ((b * 37 + seed) % 11); });
        var adminSet = {};
        order.slice(0, admin).forEach(function (i) { adminSet[i] = true; });

        var g = document.createElement('div');
        g.className = 'week-grid';
        g.setAttribute('aria-hidden', 'true');
        g.appendChild(document.createElement('span'));
        days.forEach(function (d) { var s = document.createElement('span'); s.className = 'dh'; s.textContent = d; g.appendChild(s); });
        var cells = [];
        hours.forEach(function (h, r) {
            var t = document.createElement('span'); t.className = 'th'; t.textContent = h; g.appendChild(t);
            days.forEach(function (d, c) {
                var idx = r * days.length + c, cell = document.createElement('span');
                cell.className = 'week-cell' + (adminSet[idx] ? ' admin' : '');
                g.appendChild(cell);
                if (adminSet[idx]) cells.push(cell);
            });
        });
        el.innerHTML = '';
        el.appendChild(g);

        // return hours in reading order (Mon 9am first) for a calm sweep
        var queue = cells.slice(0, back);
        var counter = opts.counter, played = false;

        function finish(cell, k) {
            cell.classList.remove('admin');
            cell.classList.add('back');
            cell.setAttribute('data-tip', tips[k % tips.length]);
            if (counter) counter.textContent = k + 1;
        }
        function play() {
            if (played) return;
            played = true;
            if (reduce) { queue.forEach(finish); return; }
            queue.forEach(function (cell, k) { setTimeout(function () { finish(cell, k); }, 300 + k * 140); });
        }
        if (!('IntersectionObserver' in window)) { play(); return; }
        var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.35 });
        io.observe(el);
    };

    // ---- send an event or lead to the sheet ----
    // resolves true when the sheet accepted it, false otherwise (never throws)
    R.send = function (payload) {
        if (!R.endpoint) return Promise.resolve(false);
        payload.page = location.origin + location.pathname;
        payload.referrer = document.referrer || '';
        var q = new URLSearchParams(location.search), t = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'ref'].forEach(function (k) { if (q.get(k)) t[k] = q.get(k); });
        payload.tracking = t;
        // text/plain keeps this a "simple" request: no CORS preflight for Apps Script
        return fetch(R.endpoint, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
            .then(function (r) { return r.ok ? r.json() : { ok: false }; })
            .then(function (res) { return !!res.ok; })
            .catch(function () { return false; });
    };

    R.mailto = function (subject, body) {
        window.location.href = 'mailto:hello@relative.dev?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    };

    // ---- plans travel inside the link: #p=<base64url(deflate-raw(JSON))> ----
    R.decodePlan = function (hash) {
        var m = /[#&]p=([A-Za-z0-9_-]+)/.exec(hash || '');
        if (!m || !('DecompressionStream' in window)) return Promise.resolve(null);
        try {
            var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            var bin = atob(b64), bytes = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            return new Response(stream).text().then(JSON.parse).catch(function () { return null; });
        } catch (e) { return Promise.resolve(null); }
    };

    document.addEventListener('DOMContentLoaded', function () { R.nav(); R.reveal(); });
})();
