(function () {
	"use strict";
	var canvas = document.getElementById("checkup-chart");
	if (!canvas || typeof Chart === "undefined") return;

	var tiers = {
		crucial: { text: "Crucial fix needed", color: "198, 40, 40", chipText: "#fff" },
		work: { text: "Needs work", color: "227, 155, 28", chipText: "#2B1B00" },
		good: { text: "Looking good", color: "36, 79, 82", chipText: "#fff" }
	};
	var areas = [
		{ name: "Money and records", value: 35, tier: tiers.crucial },
		{ name: "Business basics", value: 55, tier: tiers.work },
		{ name: "Orders and customers", value: 62, tier: tiers.work },
		{ name: "Time and workflow", value: 80, tier: tiers.good },
		{ name: "Supplies and delivery", value: 90, tier: tiers.good }
	];
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	canvas.setAttribute("aria-label", "Example check-up result. " + areas.map(function (a) { return a.name + ": " + a.tier.text; }).join(". ") + ".");

	function build() {
		var small = window.innerWidth < 640;
		var display = '"Oswald", "Arial Narrow", Arial, sans-serif';

		var rowPlugin = {
			id: "rows",
			afterDatasetsDraw: function (chart) {
				var ctx = chart.ctx;
				var meta = chart.getDatasetMeta(1);
				var track = chart.getDatasetMeta(0);
				var left = chart.chartArea.left;
				var right = chart.chartArea.right;
				ctx.save();
				meta.data.forEach(function (bar, i) {
					var a = areas[i];
					var t = track.data[i];
					var tx = t.base, ty = t.y - t.height / 2, tw = t.x - t.base, th = t.height;
					ctx.save();
					ctx.beginPath();
					ctx.roundRect(tx, ty, tw, th, th / 2);
					ctx.clip();
					ctx.beginPath();
					ctx.rect(tx - 40, ty - 40, tw + 80, th + 80);
					ctx.roundRect(tx, ty, tw, th, th / 2);
					ctx.shadowColor = "rgba(96, 108, 102, 0.05)";
					ctx.shadowBlur = 3;
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 1.5;
					ctx.fillStyle = "#000";
					ctx.fill("evenodd");
					ctx.restore();

					var w = bar.x - bar.base;
					if (w > 0) {
						var g = ctx.createLinearGradient(bar.base, 0, bar.x, 0);
						g.addColorStop(0, "rgba(" + a.tier.color + ", 1)");
						g.addColorStop(1, "rgba(" + a.tier.color + ", 0.3)");
						ctx.beginPath();
						ctx.roundRect(bar.base, bar.y - bar.height / 2, w, bar.height, bar.height / 2);
						ctx.fillStyle = g;
						ctx.fill();
					}

					var textY = bar.y - bar.height / 2 - (small ? 15 : 17);

					ctx.textBaseline = "middle";
					ctx.textAlign = "left";
					ctx.font = "500 " + (small ? 13 : 15) + "px " + display;
					ctx.letterSpacing = "1px";
					ctx.fillStyle = "#244F52";
					ctx.fillText(a.name.toUpperCase(), left, textY);

					ctx.font = "500 " + (small ? 11 : 12) + "px " + display;
					ctx.letterSpacing = "1.2px";
					var label = a.tier.text.toUpperCase();
					var tw = ctx.measureText(label).width;
					var padX = small ? 10 : 12;
					var h = small ? 22 : 26;
					var cw = tw + padX * 2;
					ctx.beginPath();
					ctx.roundRect(right - cw, textY - h / 2, cw, h, h / 2);
					ctx.fillStyle = "rgb(" + a.tier.color + ")";
					ctx.fill();
					ctx.fillStyle = a.tier.chipText;
					ctx.textAlign = "left";
					ctx.fillText(label, right - cw + padX, textY + 0.5);
				});
				ctx.restore();
			}
		};

		new Chart(canvas, {
			type: "bar",
			data: {
				labels: areas.map(function (a) { return a.name; }),
				datasets: [
					{ data: areas.map(function () { return 100; }), backgroundColor: "rgba(36, 79, 82, 0.1)", borderRadius: 8, borderSkipped: false, barPercentage: 0.2, categoryPercentage: 0.9, grouped: false, clip: false, order: 2 },
					{ data: areas.map(function (a) { return a.value; }), backgroundColor: "rgba(0, 0, 0, 0)", borderRadius: 8, borderSkipped: false, barPercentage: 0.2, categoryPercentage: 0.9, grouped: false, clip: false, order: 1 }
				]
			},
			options: {
				indexAxis: "y",
				responsive: true,
				maintainAspectRatio: false,
				animation: reduce ? false : { duration: 1000, easing: "easeOutQuart" },
				layout: { padding: { top: small ? 33 : 37, bottom: small ? 8 : 10, left: 0, right: small ? 8 : 10 } },
				plugins: { legend: { display: false }, tooltip: { enabled: false } },
				scales: {
					x: { min: 0, max: 100, display: false },
					y: { display: false, offset: false, grid: { display: false } }
				}
			},
			plugins: [rowPlugin]
		});
	}

	if (document.fonts && document.fonts.ready) document.fonts.ready.then(build); else build();
})();
