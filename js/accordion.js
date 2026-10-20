(function () {
	"use strict";
	var items = Array.prototype.slice.call(document.querySelectorAll(".accordion__item"));
	if (!items.length || !Element.prototype.animate) return;
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	items.forEach(function (el) { el.removeAttribute("name"); });

	function run(el, from, to, done) {
		if (el._anim) el._anim.cancel();
		el.style.overflow = "hidden";
		var a = el.animate({ height: [from + "px", to + "px"] }, { duration: reduce ? 0 : 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
		el._anim = a;
		a.onfinish = function () {
			el._anim = null;
			el.style.overflow = "";
			if (done) done();
		};
		a.oncancel = function () { el.style.overflow = ""; };
	}

	function closedHeight(el) {
		return el.querySelector("summary").offsetHeight + parseFloat(getComputedStyle(el).borderBottomWidth);
	}

	function close(el) {
		if (!el.open) return;
		el.classList.add("is-closing");
		run(el, el.offsetHeight, closedHeight(el), function () {
			el.removeAttribute("open");
			el.classList.remove("is-closing");
		});
	}

	function open(el) {
		var start = el.offsetHeight;
		el.classList.remove("is-closing");
		el.setAttribute("open", "");
		run(el, start, el.scrollHeight + parseFloat(getComputedStyle(el).borderBottomWidth));
	}

	items.forEach(function (el) {
		el.querySelector("summary").addEventListener("click", function (e) {
			e.preventDefault();
			if (el.open && !el.classList.contains("is-closing")) {
				close(el);
			} else {
				items.forEach(function (other) { if (other !== el) close(other); });
				open(el);
			}
		});
	});
})();
