/* Relative Industries — shared behaviour for landing pages. */
(function () {
    // Where form submissions are emailed (via FormSubmit, see _ops/README.md).
    // The first submission sends an "Activate" email to this inbox; click it once.
    var LEADS_EMAIL = 'hello@relative.dev';

    // Optional: the Google Apps Script web-app URL, for the lead sheet and
    // plan-open tracking (see _ops/README.md). Leave empty to skip.
    var LEADS_ENDPOINT = '';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var R = window.Relative = { email: LEADS_EMAIL, endpoint: LEADS_ENDPOINT, reduce: reduce };

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

    // ---- send an event or lead ----
    // Leads go to your inbox (FormSubmit) and, if configured, the lead sheet.
    // Plan-open events go to the sheet only. Resolves true if anything accepted
    // it, false otherwise (never throws).
    R.send = function (payload) {
        payload.page = location.origin + location.pathname;
        payload.referrer = document.referrer || '';
        var q = new URLSearchParams(location.search), t = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'ref'].forEach(function (k) { if (q.get(k)) t[k] = q.get(k); });
        payload.tracking = t;

        var jobs = [];
        if (R.endpoint) {
            // text/plain keeps this a "simple" request: no CORS preflight for Apps Script
            jobs.push(fetch(R.endpoint, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
                .then(function (r) { return r.ok ? r.json() : { ok: false }; })
                .then(function (res) { return !!res.ok; })
                .catch(function () { return false; }));
        }
        if (R.email && payload.type !== 'view') {
            jobs.push(fetch('https://formsubmit.co/ajax/' + R.email, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(R.emailFields(payload))
            })
                .then(function (r) { return r.ok ? r.json() : {}; })
                .then(function (res) { return String(res.success) === 'true'; })
                .catch(function () { return false; }));
        }
        if (!jobs.length) return Promise.resolve(false);
        return Promise.all(jobs).then(function (rs) { return rs.some(Boolean); });
    };

    // Flatten a lead into readable rows for the notification email.
    R.emailFields = function (p) {
        var title = p.type === 'plan_request' ? 'Plan request: ' + p.business + ' wants to talk' : 'New free-plan request: ' + p.business;
        var f = { _subject: title, _template: 'table', _captcha: 'false', _replyto: p.email };
        var add = function (k, v) { if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)) f[k] = Array.isArray(v) ? v.join(', ') : String(v); };
        add('Name', p.name); add('Email', p.email); add('Business', p.business); add('Website', p.website);
        add('Team size', p.team_size); add('Time goes to', p.pains); add('Package', p.package);
        if (p.type === 'plan_request') { add('Care Plan', p.care_plan ? 'Yes' : 'No'); add('Ideas they picked', p.picked); add('Best time for a call', p.when); }
        if (p.estimate) add('Estimate', p.estimate.weekly + ' hrs/week back (~$' + p.estimate.yearly + '/yr)');
        add('Message', p.message);
        add('Campaign', [p.tracking.utm_source, p.tracking.utm_campaign].filter(Boolean).join(' / '));
        add('Page', p.page);
        return f;
    };

    // When sending fails: keep the form, re-enable the button, and offer a
    // pre-filled email link the visitor can click (never auto-open a mail app).
    R.failed = function (btn, subject, body) {
        btn.disabled = false;
        var note = btn.parentNode.querySelector('.form-error');
        if (!note) {
            note = document.createElement('p');
            note.className = 'form-error';
            note.setAttribute('role', 'alert');
            btn.insertAdjacentElement('afterend', note);
        }
        var href = 'mailto:' + R.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        note.innerHTML = 'Sorry, that didn\'t go through. Please try again, or <a href="' + href + '">email us at ' + R.email + '</a> and we\'ll take it from there.';
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
