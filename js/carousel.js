(function () {
	"use strict";

	document.querySelectorAll(".who").forEach(function (section) {
		var scroller = section.querySelector(".who__scroller");
		var buttons = section.querySelectorAll(".who__btn");
		if (!scroller || !buttons.length) return;

		function step() {
			var card = scroller.querySelector(".biz");
			if (!card) return scroller.clientWidth;
			var gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
			return card.getBoundingClientRect().width + gap;
		}

		function update() {
			var max = scroller.scrollWidth - scroller.clientWidth - 2;
			buttons.forEach(function (b) {
				var dir = Number(b.getAttribute("data-dir"));
				b.disabled = dir < 0 ? scroller.scrollLeft <= 2 : scroller.scrollLeft >= max;
			});
		}

		buttons.forEach(function (b) {
			b.addEventListener("click", function () {
				var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				scroller.scrollBy({ left: Number(b.getAttribute("data-dir")) * step(), behavior: reduce ? "auto" : "smooth" });
			});
		});

		scroller.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		update();

		var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
		var delay = 3200;
		var timer = null;
		var held = false;

		function advance() {
			var max = scroller.scrollWidth - scroller.clientWidth - 2;
			if (scroller.scrollLeft >= max) scroller.scrollTo({ left: 0, behavior: "smooth" });
			else scroller.scrollBy({ left: step(), behavior: "smooth" });
		}

		function start() {
			if (timer || held || reduce.matches || document.hidden) return;
			timer = setInterval(advance, delay);
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
