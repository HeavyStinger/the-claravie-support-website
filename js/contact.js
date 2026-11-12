(function () {
	"use strict";

	var form = document.getElementById("contact-form");
	if (!form) return;

	var cfg = window.TCS_CONFIG || {};
	var wrap = form.parentNode;
	var fieldset = form.querySelector(".cform__fields");
	var send = form.querySelector(".cform__send");
	var loadingPanel = wrap.querySelector(".cform__loading");
	var errorPanel = wrap.querySelector(".cform__error");
	var errorText = errorPanel.querySelector("[data-error-text]");
	var done = wrap.querySelector(".cform__done");
	var panels = { form: form, loading: loadingPanel, error: errorPanel, done: done };
	var country = document.getElementById("cf-country");
	var honeypot = document.getElementById("cf-company");
	var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
	var loading = false;
	var lockedHeight = 0;

	var fields = {
		name: { input: document.getElementById("cf-name"), validate: checkName },
		phone: { input: document.getElementById("cf-phone"), validate: checkPhone },
		email: { input: document.getElementById("cf-email"), validate: checkEmail },
		message: { input: document.getElementById("cf-message"), validate: checkMessage }
	};
	var order = ["name", "phone", "email", "message"];

	function checkName(value) {
		var v = value.trim();
		if (!v) return "Enter your name.";
		if (v.length < 2) return "Enter at least 2 characters.";
		return "";
	}

	function checkEmail(value) {
		var v = value.trim();
		if (!v) return "Enter your email address.";
		if (!emailRe.test(v)) return "Enter a valid email address, like name@example.com.";
		return "";
	}

	function checkMessage(value) {
		var v = value.trim();
		if (!v) return "Write a short message.";
		if (v.length < 10) return "Add a little more detail, at least 10 characters.";
		return "";
	}

	function checkPhone(value) {
		var v = value.trim();
		if (!v) return "";
		if (/[^\d\s().+-]/.test(v)) return "Use numbers only.";
		var opt = country.options[country.selectedIndex];
		var min = Number(opt.getAttribute("data-min"));
		var max = Number(opt.getAttribute("data-max"));
		var name = opt.textContent.replace(/\s*\(\+\d+\)$/, "");
		var digits = v.replace(/\D/g, "");
		if (digits.length < min || digits.length > max) {
			return min === max
				? "Enter a " + min + "-digit number for " + name + "."
				: "Enter a " + min + " to " + max + " digit number for " + name + ".";
		}
		return "";
	}

	function setError(key, message) {
		var f = fields[key];
		var field = f.input.closest(".cv-field");
		var hint = document.getElementById(f.input.id + "-err");
		field.classList.toggle("is-error", !!message);
		if (message) {
			hint.textContent = message;
			hint.hidden = false;
			f.input.setAttribute("aria-invalid", "true");
			f.input.setAttribute("aria-describedby", hint.id);
		} else {
			hint.textContent = "";
			hint.hidden = true;
			f.input.removeAttribute("aria-invalid");
			f.input.removeAttribute("aria-describedby");
		}
		return message;
	}

	function validate(key) {
		return setError(key, fields[key].validate(fields[key].input.value));
	}

	order.forEach(function (key) {
		var input = fields[key].input;
		input.addEventListener("blur", function () {
			if (!loading) validate(key);
		});
		input.addEventListener("input", function () {
			if (input.getAttribute("aria-invalid")) validate(key);
		});
	});

	country.addEventListener("change", function () {
		if (fields.phone.input.value.trim() || fields.phone.input.getAttribute("aria-invalid")) validate("phone");
	});

	function show(name, height) {
		Object.keys(panels).forEach(function (key) {
			panels[key].hidden = key !== name;
			if (key !== "form") panels[key].style.minHeight = name === key && height ? height + "px" : "";
		});
	}

	function enter(el) {
		if (el.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 320, easing: "cubic-bezier(0.22, 0.8, 0.3, 1)" });
		}
		el.focus({ preventScroll: true });
	}

	function setLoading(on) {
		loading = on;
		fieldset.disabled = on;
		send.classList.toggle("is-loading", on);
		if (on) {
			send.setAttribute("aria-busy", "true");
			form.setAttribute("aria-busy", "true");
		} else {
			send.removeAttribute("aria-busy");
			form.removeAttribute("aria-busy");
		}
	}

	function payload() {
		var opt = country.options[country.selectedIndex];
		var digits = fields.phone.input.value.replace(/\D/g, "");
		return {
			name: fields.name.input.value.trim(),
			email: fields.email.input.value.trim(),
			phone: digits ? "+" + opt.getAttribute("data-dial") + digits : "",
			country: opt.value,
			message: fields.message.input.value.trim(),
			page: window.location.pathname
		};
	}

	function deliver(data) {
		if (!cfg.formEndpoint || !cfg.formAccessKey) return Promise.reject(new Error("not-configured"));
		return fetch(cfg.formEndpoint, {
			signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(20000) : undefined,
			method: "POST",
			headers: { "Content-Type": "application/json", "Accept": "application/json" },
			body: JSON.stringify({
				access_key: cfg.formAccessKey,
				subject: "New message from the website",
				from_name: "The Claravie Support website",
				name: data.name,
				email: data.email,
				phone: data.phone,
				message: data.message
			})
		}).then(function (res) {
			return res.json().catch(function () { return {}; }).then(function (body) {
				if (!res.ok || !body.success) throw new Error("rejected");
			});
		});
	}

	function showDone() {
		show("done", lockedHeight);
		done.classList.add("is-shown");
		enter(done);
		if (window.tcsTrack) window.tcsTrack("contact_form_sent");
	}

	function showFailure(err) {
		errorText.textContent = err && err.message === "not-configured"
			? "This form is not connected yet. Please email hello@claraviesupport.com or call +501-602-5268."
			: "Your message could not be sent. Please try again, or email hello@claraviesupport.com.";
		show("error", lockedHeight);
		enter(errorPanel);
	}

	form.addEventListener("submit", function (e) {
		e.preventDefault();
		if (loading) return;

		var firstBad = null;
		order.forEach(function (key) {
			if (validate(key) && !firstBad) firstBad = fields[key].input;
		});
		if (firstBad) {
			firstBad.focus();
			return;
		}
		lockedHeight = form.offsetHeight;
		if (honeypot.value) return showDone();

		setLoading(true);
		show("loading", lockedHeight);
		enter(loadingPanel);
		deliver(payload()).then(function () {
			setLoading(false);
			showDone();
		}, function (err) {
			setLoading(false);
			showFailure(err);
		});
	});

	if (window.tcsGlow) {
		window.tcsGlow(form);
		Object.keys(panels).forEach(function (key) { if (key !== "form") window.tcsGlow(panels[key]); });
	}

	errorPanel.querySelector("[data-retry]").addEventListener("click", function () {
		show("form");
		send.focus();
	});

	done.querySelector("[data-again]").addEventListener("click", function () {
		form.reset();
		order.forEach(function (key) { setError(key, ""); });
		done.classList.remove("is-shown");
		show("form");
		fields.name.input.focus();
	});
})();
