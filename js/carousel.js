(function () {
	"use strict";

	document.querySelectorAll(".who").forEach(function (section) {
		var scroller = section.querySelector(".who__scroller");
		var buttons = section.querySelectorAll(".who__btn");
		if (!scroller || !buttons.length) return;

		var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
		var originals = [].slice.call(scroller.querySelectorAll(".biz"));
		var origin = 0;
		var setWidth = 0;
		var settleTimer = null;

		function copy(card) {
			var c = card.cloneNode(true);
			c.setAttribute("aria-hidden", "true");
			return c;
		}

		var after = originals.map(copy);
		originals.map(copy).forEach(function (c) { scroller.insertBefore(c, originals[0]); });
		after.forEach(function (c) { scroller.appendChild(c); });

		function left(card) {
			return card.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
		}

		function measure() {
			var pad = parseFloat(getComputedStyle(scroller).paddingLeft) || 0;
			origin = left(originals[0]) - pad;
			setWidth = left(after[0]) - left(originals[0]);
		}

		function jump(to) {
			scroller.style.scrollSnapType = "none";
			scroller.scrollLeft = to;
			void scroller.offsetWidth;
			requestAnimationFrame(function () { scroller.style.scrollSnapType = ""; });
		}

		function normalize() {
			var s = scroller.scrollLeft;
			if (s >= origin + setWidth - 1) jump(s - setWidth);
			else if (s < origin - 1) jump(s + setWidth);
		}

		function step() {
			var gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
			return originals[0].getBoundingClientRect().width + gap;
		}

		function move(dir) {
			scroller.scrollBy({ left: dir * step(), behavior: reduce.matches ? "auto" : "smooth" });
		}

		buttons.forEach(function (b) {
			b.addEventListener("click", function () { move(Number(b.getAttribute("data-dir"))); });
		});

		if ("onscrollend" in window) {
			scroller.addEventListener("scrollend", normalize);
		} else {
			scroller.addEventListener("scroll", function () {
				clearTimeout(settleTimer);
				settleTimer = setTimeout(normalize, 120);
			}, { passive: true });
		}

		window.addEventListener("resize", function () {
			measure();
			jump(origin);
		});

		measure();
		jump(origin);

		var delay = 3200;
		var timer = null;
		var held = false;

		function start() {
			if (timer || held || reduce.matches || document.hidden) return;
			timer = setInterval(function () { move(1); }, delay);
		}

		function stop() {
			clearInterval(timer);
			timer = null;
		}

		function hold() { held = true; stop(); }
		function release() { held = false; start(); }

		[scroller, section.querySelector(".who__nav")].forEach(function (el) {
			if (!el) return;
			el.addEventListener("mouseenter", hold);
			el.addEventListener("mouseleave", release);
			el.addEventListener("focusin", hold);
			el.addEventListener("focusout", release);
		});

		var touchTimer = null;
		scroller.addEventListener("touchstart", function () {
			hold();
			clearTimeout(touchTimer);
		}, { passive: true });
		scroller.addEventListener("touchend", function () {
			clearTimeout(touchTimer);
			touchTimer = setTimeout(release, delay);
		}, { passive: true });

		document.addEventListener("visibilitychange", function () {
			if (document.hidden) stop();
			else start();
		});
		reduce.addEventListener("change", function () {
			if (reduce.matches) stop();
			else start();
		});

		start();
	});
})();
