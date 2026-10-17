(function () {
	"use strict";
	var cfg = window.TCS_CONFIG || {};

	// TODO: send events to analytics once chosen. Never send personal details.
	function track(name) {
		try {
			if (typeof window.plausible === "function") window.plausible(name);
			document.dispatchEvent(new CustomEvent("tcs:track", { detail: { name: name } }));
		} catch (e) {}
	}
	window.tcsTrack = track;

	document.addEventListener("click", function (e) {
		var el = e.target.closest ? e.target.closest("[data-track]") : null;
		if (el) track(el.getAttribute("data-track"));
	});

	var digits = String(cfg.whatsappNumber || "").replace(/\D/g, "");
	var waLinks = document.querySelectorAll("[data-whatsapp]");
	if (digits.length >= 8) {
		var href = "https://wa.me/" + digits + (cfg.whatsappMessage ? "?text=" + encodeURIComponent(cfg.whatsappMessage) : "");
		waLinks.forEach(function (a) {
			a.setAttribute("href", href);
			a.setAttribute("rel", "noopener");
			a.setAttribute("target", "_blank");
			a.hidden = false;
		});
	}
	document.documentElement.classList.toggle("has-whatsapp", digits.length >= 8);

	document.querySelectorAll("[data-book]").forEach(function (a) {
		a.setAttribute("href", cfg.bookingUrl || cfg.contactUrl || "contact.html");
	});

	var header = document.querySelector(".site-header");
	function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
	window.addEventListener("scroll", onScroll, { passive: true });
	onScroll();

	var logos = document.querySelector(".logos");
	if (logos) {
		var track = logos.querySelector(".logos__track");
		var group = logos.querySelector(".logos__group");
		var viewport = logos.querySelector(".logos__viewport");
		var originals = Array.prototype.slice.call(group.children);
		var built = false;
		function buildLogos() {
			if (built) return;
			built = true;
			var guard = 0;
			while (group.scrollWidth < viewport.clientWidth + 50 && guard++ < 10) {
				originals.forEach(function (li) { var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); group.appendChild(c); });
			}
			var twin = group.cloneNode(true);
			twin.setAttribute("aria-hidden", "true");
			track.appendChild(twin);
			logos.style.setProperty("--logos-dur", Math.round(group.scrollWidth / 45) + "s");
			logos.classList.add("logos--live");
		}
		var imgs = Array.prototype.slice.call(group.querySelectorAll("img"));
		var pending = imgs.filter(function (i) { return !i.complete; }).length;
		if (!pending) buildLogos();
		else imgs.forEach(function (i) { if (!i.complete) i.addEventListener("load", function () { if (--pending === 0) buildLogos(); }); i.addEventListener("error", function () { if (--pending === 0) buildLogos(); }); });
		window.addEventListener("load", buildLogos);
	}

	var toggle = document.querySelector(".nav-toggle");
	var nav = document.getElementById("site-nav");
	if (toggle && nav) {
		function setOpen(open) {
			nav.classList.toggle("is-open", open);
			toggle.closest(".site-header").classList.toggle("menu-open", open);
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
			toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
		}
		toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
		});
	}
})();
