(function () {
	"use strict";

	var form = document.getElementById("quiz");
	if (!form) return;

	var steps = [].slice.call(form.querySelectorAll(".quiz__step"));
	var total = steps.length;
	var topbar = form.querySelector(".quiz__top");
	var bar = form.querySelector(".quiz__bar");
	var segs = [].slice.call(bar.children);
	var current = form.querySelector("[data-current]");
	var percent = form.querySelector(".quiz__percent");
	var pctNow = percent.querySelector("[data-pct-now]");
	var pctNext = percent.querySelector("[data-pct-next]");
	var stage = form.querySelector(".quiz__stage");
	var nav = form.querySelector(".quiz__nav");
	var back = form.querySelector(".quiz__back");
	var next = form.querySelector(".quiz__next");
	var nextLabel = next.querySelector("span");
	var loading = form.querySelector(".quiz__loading");
	var meter = loading.querySelector(".quiz__meter span");
	var results = form.querySelector(".quiz__results");
	var ring = results.querySelector(".quiz__ring-fill");
	var scoreNum = results.querySelector("[data-score]");
	var scoreOf = results.querySelector("[data-of]");
	var headline = results.querySelector(".quiz__headline");
	var lead = results.querySelector(".quiz__lead");
	var groups = results.querySelector(".quiz__groups");
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

	var CIRC = 2 * Math.PI * 52;
	var tiers = {
		yes: { key: "good", text: "Looking good", rank: 2, points: 2, value: 90 },
		na: { key: "good", text: "Looking good", rank: 2, points: 0, value: 90 },
		sometimes: { key: "work", text: "Needs work", rank: 1, points: 1, value: 58 },
		no: { key: "crucial", text: "Crucial fix needed", rank: 0, points: 0, value: 33 }
	};

	var answers = new Array(total);
	var committed = new Array(total);
	var index = 0;
	var busy = false;

	function play(el, frames, ms, options) {
		if (reduce.matches || !el.animate) return Promise.resolve();
		var opts = { duration: ms, easing: "cubic-bezier(0.22, 0.8, 0.3, 1)", fill: "both" };
		for (var k in options) opts[k] = options[k];
		var a = el.animate(frames, opts);
		return a.finished.then(function () { a.cancel(); }, function () {});
	}

	function committedCount() {
		return committed.filter(Boolean).length;
	}

	function render() {
		current.textContent = index + 1;
		var done = committedCount();
		var previewing = !!answers[index] && !committed[index];
		bar.setAttribute("aria-valuenow", done);
		segs.forEach(function (s, i) {
			s.classList.toggle("is-done", !!committed[i]);
			if (!committed[i]) s.classList.remove("is-pop");
			s.classList.toggle("is-preview", i === index && previewing);
		});
		percent.hidden = done === 0 && !previewing;
		percent.classList.toggle("is-first", done === 0);
		percent.classList.toggle("is-preview", previewing);
		pctNow.textContent = Math.round(done / total * 100);
		pctNext.textContent = Math.round((done + 1) / total * 100);
		back.hidden = index === 0;
		next.disabled = !answers[index];
		nextLabel.textContent = index === total - 1 ? "See my results" : "Next";
	}

	function commit(i) {
		if (committed[i]) return;
		committed[i] = true;
		pop(i);
		render();
		play(percent, [{ transform: "scale(1)" }, { transform: "scale(1.25)", offset: 0.4 }, { transform: "scale(1)" }], 360, { easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
	}

	function pop(i) {
		var seg = segs[i];
		seg.classList.add("is-done");
		seg.classList.remove("is-pop");
		void seg.offsetWidth;
		seg.classList.add("is-pop");
	}

	function go(to) {
		if (busy || to < 0 || to >= total) return;
		busy = true;
		var dir = to > index ? 1 : -1;
		if (dir < 0) for (var i = to; i < total; i++) committed[i] = false;
		var out = steps[index];
		var fromH = stage.offsetHeight;
		play(out, [
			{ opacity: 1, transform: "translateX(0)" },
			{ opacity: 0, transform: "translateX(" + (-24 * dir) + "px)" }
		], 180).then(function () {
			out.hidden = true;
			index = to;
			var inc = steps[index];
			inc.hidden = false;
			render();
			if (dir < 0) play(percent, [{ transform: "scale(1)" }, { transform: "scale(0.85)", offset: 0.4 }, { transform: "scale(1)" }], 320);
			var toH = stage.offsetHeight;
			if (Math.abs(toH - fromH) > 1) {
				stage.style.overflow = "hidden";
				play(stage, [{ height: fromH + "px" }, { height: toH + "px" }], 260).then(function () { stage.style.overflow = ""; });
			}
			return play(inc, [
				{ opacity: 0, transform: "translateX(" + (24 * dir) + "px)" },
				{ opacity: 1, transform: "translateX(0)" }
			], 260).then(function () {
				var legend = inc.querySelector("legend");
				if (legend) legend.focus({ preventScroll: true });
				busy = false;
			});
		});
	}

	form.addEventListener("change", function (e) {
		var input = e.target;
		if (input.type !== "radio") return;
		var i = steps.indexOf(input.closest(".quiz__step"));
		if (i < 0) return;
		answers[i] = input.value;
		var label = form.querySelector('label[for="' + input.id + '"]');
		if (label && label.animate && !reduce.matches) {
			label.animate([
				{ transform: "scale(1)" },
				{ transform: "scale(1.035)", offset: 0.4 },
				{ transform: "scale(1)" }
			], { duration: 340, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
		}
		render();
	});

	back.addEventListener("click", function () { go(index - 1); });

	form.addEventListener("submit", function (e) {
		e.preventDefault();
		if (busy || !answers[index]) return;
		commit(index);
		if (index < total - 1) go(index + 1);
		else finish();
	});

	function finish() {
		busy = true;
		next.classList.add("is-loading");
		form.setAttribute("aria-busy", "true");
		if (window.tcsTrack) window.tcsTrack("checkup_complete");

		Promise.all([
			play(stage, [{ opacity: 1 }, { opacity: 0 }], 200),
			play(nav, [{ opacity: 1 }, { opacity: 0 }], 200)
		]).then(function () {
			stage.hidden = true;
			nav.hidden = true;
			form.classList.add("is-done");
			loading.hidden = false;
			return play(loading, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], 240);
		}).then(function () {
			return play(meter, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], 1100, { easing: "cubic-bezier(0.5, 0, 0.2, 1)" });
		}).then(function () {
			return play(loading, [{ opacity: 1 }, { opacity: 0 }], 180);
		}).then(function () {
			loading.hidden = true;
			next.classList.remove("is-loading");
			form.removeAttribute("aria-busy");
			showResults();
			busy = false;
		});
	}

	function summary() {
		var counted = 0, good = 0, points = 0, list = [];
		steps.forEach(function (step, i) {
			var t = tiers[answers[i]];
			var isNa = answers[i] === "na";
			if (!isNa) {
				counted++;
				points += t.points;
				if (t.key === "good") good++;
			}
			list.push({ label: step.getAttribute("data-label"), tier: t, order: i });
		});
		list.sort(function (a, b) { return a.tier.rank - b.tier.rank || a.order - b.order; });
		return { counted: counted, good: good, pct: counted ? points / (counted * 2) : 1, list: list };
	}

	function showResults() {
		var s = summary();
		var crucial = s.list.some(function (r) { return r.tier.key === "crucial"; });
		var work = s.list.some(function (r) { return r.tier.key === "work"; });

		scoreOf.textContent = "of " + s.counted;
		headline.textContent = s.good + " of " + s.counted + " areas are looking good";
		lead.textContent = crucial
			? "Areas marked Crucial fix needed are a good place to begin."
			: work
				? "Areas marked Needs work are worth a closer look."
				: "Everything you answered is looking good. A regular review keeps it that way.";

		groups.innerHTML = "";
		s.list.forEach(function (r) {
			var li = document.createElement("li");
			var row = document.createElement("div");
			row.className = "quiz__row";
			var name = document.createElement("span");
			name.className = "quiz__group-name";
			name.textContent = r.label;
			var chip = document.createElement("span");
			chip.className = "quiz__chip quiz__chip--" + r.tier.key;
			chip.textContent = r.tier.text;
			row.appendChild(name);
			row.appendChild(chip);
			var track = document.createElement("div");
			track.className = "quiz__track";
			var fill = document.createElement("span");
			fill.className = "quiz__fill quiz__fill--" + r.tier.key;
			fill.style.width = r.tier.value + "%";
			track.appendChild(fill);
			li.appendChild(row);
			li.appendChild(track);
			groups.appendChild(li);
		});

		results.hidden = false;
		results.scrollIntoView({ block: "start" });
		results.focus({ preventScroll: true });

		var items = [].slice.call(groups.children);
		play(results, [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }], 320);
		play(headline, [
			{ opacity: 0, transform: "scale(0.85)" },
			{ opacity: 1, transform: "scale(1.06)", offset: 0.6 },
			{ opacity: 1, transform: "scale(1)" }
		], 520, { delay: 250, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
		items.forEach(function (li, i) {
			play(li, [{ opacity: 0, transform: "translateX(-14px)" }, { opacity: 1, transform: "translateX(0)" }], 320, { delay: 500 + i * 70 });
			play(li.querySelector(".quiz__fill"), [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], 900, { delay: 560 + i * 90, easing: "cubic-bezier(0.22, 0.8, 0.3, 1)" });
			play(li.querySelector(".quiz__chip"), [
				{ transform: "scale(0.4)", opacity: 0 },
				{ transform: "scale(1.2)", opacity: 1, offset: 0.65 },
				{ transform: "scale(1)", opacity: 1 }
			], 380, { delay: 640 + i * 70, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
		});

		countUp(s.good, Math.max(s.pct, 0.04));
		confetti();
	}

	function countUp(n, pct) {
		if (reduce.matches) {
			scoreNum.textContent = n;
			ring.style.strokeDashoffset = CIRC * (1 - pct);
			return;
		}
		var start = null;
		var dur = 1300;
		function tick(t) {
			if (start === null) start = t;
			var p = Math.min((t - start) / dur, 1);
			var e = 1 - Math.pow(1 - p, 3);
			scoreNum.textContent = Math.round(n * e);
			ring.style.strokeDashoffset = CIRC * (1 - pct * e);
			if (p < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	function confetti() {
		if (reduce.matches) return;
		var box = results.querySelector(".quiz__score").getBoundingClientRect();
		var canvas = document.createElement("canvas");
		canvas.className = "quiz__confetti";
		canvas.setAttribute("aria-hidden", "true");
		document.body.appendChild(canvas);
		var ctx = canvas.getContext("2d");
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var w = window.innerWidth;
		var h = window.innerHeight;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		var colors = ["#244F52", "#3F777A", "#6FB3B0", "#A9CBC5", "#E39B1C", "#D98A6A", "#B5C46A"];
		var ox = box.left + box.width / 2;
		var oy = Math.min(Math.max(box.top + box.height / 2, 120), h - 120);
		var parts = [];
		for (var i = 0; i < 150; i++) {
			var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
			var sp = 7 + Math.random() * 10;
			parts.push({
				x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
				w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
				rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
				color: colors[i % colors.length], life: 1
			});
		}

		var last = null;
		function frame(t) {
			if (last === null) last = t;
			var dt = Math.min((t - last) / 16.67, 2);
			last = t;
			ctx.clearRect(0, 0, w, h);
			var alive = 0;
			parts.forEach(function (p) {
				p.vy += 0.3 * dt;
				p.vx *= 0.992;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.rot += p.vr * dt;
				p.life -= 0.0055 * dt;
				if (p.life <= 0 || p.y > h + 20) return;
				alive++;
				ctx.save();
				ctx.globalAlpha = Math.min(1, p.life * 1.8);
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rot);
				ctx.fillStyle = p.color;
				ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
				ctx.restore();
			});
			if (alive) requestAnimationFrame(frame);
			else canvas.remove();
		}
		requestAnimationFrame(frame);
	}

	function restart() {
		if (busy) return;
		busy = true;
		play(results, [{ opacity: 1 }, { opacity: 0 }], 200).then(function () {
			results.hidden = true;
			form.classList.remove("is-done");
			answers = new Array(total);
			committed = new Array(total);
			form.reset();
			segs.forEach(function (s) { s.classList.remove("is-done", "is-pop", "is-preview"); });
			steps.forEach(function (s, i) { s.hidden = i !== 0; });
			index = 0;
			ring.style.strokeDashoffset = "";
			stage.hidden = false;
			nav.hidden = false;
			render();
			return Promise.all([
				play(stage, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], 260),
				play(nav, [{ opacity: 0 }, { opacity: 1 }], 260)
			]);
		}).then(function () {
			topbar.scrollIntoView({ block: "center", behavior: reduce.matches ? "auto" : "smooth" });
			busy = false;
		});
	}

	results.querySelector("[data-restart]").addEventListener("click", restart);

	var glow = { x: -999, y: -999, tx: -999, ty: -999, raf: 0 };

	function glowTick() {
		glow.x += (glow.tx - glow.x) * 0.22;
		glow.y += (glow.ty - glow.y) * 0.22;
		form.style.setProperty("--mx", glow.x + "px");
		form.style.setProperty("--my", glow.y + "px");
		if (Math.abs(glow.tx - glow.x) > 0.5 || Math.abs(glow.ty - glow.y) > 0.5) glow.raf = requestAnimationFrame(glowTick);
		else glow.raf = 0;
	}

	function glowTo(x, y, snap) {
		glow.tx = x;
		glow.ty = y;
		if (snap || reduce.matches) {
			glow.x = x;
			glow.y = y;
		}
		if (!glow.raf) glow.raf = requestAnimationFrame(glowTick);
	}

	form.addEventListener("pointermove", function (e) {
		var box = form.getBoundingClientRect();
		var first = glow.tx === -999;
		glowTo(e.clientX - box.left, e.clientY - box.top, first);
	});
	form.addEventListener("pointerleave", function () { glowTo(-999, -999, true); });

	if (window.tcsTrack) window.tcsTrack("checkup_start");
	render();
})();
