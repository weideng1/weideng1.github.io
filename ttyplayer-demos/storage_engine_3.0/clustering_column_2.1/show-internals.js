var EVENTS = [
	// HTMLMediaElement
	"loadstart",
	"progress",
	"suspend",
	"abort",
	"error",
	"emptied",
	"stalled",
	"loadedmetadata",
	"loadeddata",
	"canplay",
	"canplaythrough",
	"playing",
	"waiting",
	"seeking",
	"seeked",
	"ended",
	"durationchange",
	"timeupdate",
	"play",
	"pause",
	"ratechange",
	"resize",
	"volumechange",

	// HTMLTTYPlayerElement
	"titlechange"
];

var PROPERTIES = [
	// HTMLMediaElement
	["error", null],
	["src", "string"],
	["currentSrc", null],
	["crossOrigin", "string", 10],
	["networkState", null],
	["preload", "string", 8],
	["buffered", null],
	["readyState", null],
	["seeking", null],
	["currentTime", "number", "15ex"],
	["duration", null],
	["paused", null],
	["defaultPlaybackRate", "number", "15ex"],
	["playbackRate", "number", "15ex"],
	["played", null],
	["seekable", null],
	["ended", null],
	["autoplay", "boolean"],
	["loop", "boolean"],
	["mediaGroup", "string", 10],
	["controller", "unsupported"],
	["controls", "boolean"],
	["volume", "number", "15ex"],
	["muted", "boolean"],
	["defaultMuted", "boolean"],
	["audioTracks", null],
	["videoTracks", null],
	["textTracks", null],

	// HTMLTTYPlayerElement
	["defaultTitle", "string"],
	["title", "string"],
	["cols", null],
	["rows", null],
	["poster", "string"]
];

function makePropertyWidget(player, name, widgetType, extra) {
	switch (widgetType) {
		case "unsupported":
		case null:
			var span = document.createElement("span");
			return [span, function() { span.textContent = player[name]; }];
		case "string":
			var input = document.createElement("input");
			input.type = "text";
			if (extra) {
				input.size = extra;
			}
			input.onchange = function() {
				player[name] = input.value;
			};
			return [input, function() { if (document.activeElement !== input) input.value = player[name]; }];
		case "number":
			var input = document.createElement("input");
			input.type = "number";
			input.step = "any";
			if (extra) {
				input.style.width = extra;
			}
			input.onchange = function() {
				player[name] = +input.value;
			};
			return [input, function() { if (document.activeElement !== input) input.value = player[name]; }];
		case "boolean":
			var input = document.createElement("input");
			input.type = "checkbox";
			input.onclick = function() {
				player[name] = input.checked;
			};
			return [input, function() { if (document.activeElement !== input) input.checked = player[name]; }];
	}
}

function makePropertiesTable(player) {
	var updaters = [];
	var table = document.createElement("table");
	table.className = "internals media-properties";
	var caption = document.createElement("caption");
	caption.textContent = "Media properties";
	table.appendChild(caption);
	var tbody = document.createElement("tbody");
	table.appendChild(tbody);
	var tr;
	for (var i = 0; i < PROPERTIES.length; i++) {
		if (i % 3 == 0) {
			tr = document.createElement("tr");
			tbody.appendChild(tr);
		}
		var name = PROPERTIES[i][0];
		var th = document.createElement("th");
		th.textContent = name;
		var td = document.createElement("td");
		if (name in player) {
			td.className = "true";
			var widget = makePropertyWidget(player, name, PROPERTIES[i][1], PROPERTIES[i][2]);
			td.appendChild(widget[0]);
			updaters.push(widget[1]);
		} else {
			td.className = "false";
		}
		tr.appendChild(th);
		tr.appendChild(td);
	}

	setInterval(function() {
		for (var i = 0; i < updaters.length; i++) {
			updaters[i]();
		}
	}, 250);

	return table;
}

function makeEventsTable(player) {
	var table = document.createElement("table");
	table.className = "internals media-events";
	var caption = document.createElement("caption");
	caption.textContent = "Media events";
	table.appendChild(caption);
	var tbody = document.createElement("tbody");
	table.appendChild(tbody);
	var tr;
	for (var i = 0; i < EVENTS.length; i++) {
		if (i % 5 == 0) {
			tr = document.createElement("tr");
			tbody.appendChild(tr);
		}
		var name = EVENTS[i];
		var th = document.createElement("th");
		th.textContent = name;
		var td = makeEventCounter(player, name);
		tr.appendChild(th);
		tr.appendChild(td);
	}
	return table;
}

function makeEventCounter(element, name) {
	var td = document.createElement("td");
	var count = 0;
	td.textContent = "0";
	td.className = "false";
	element.addEventListener(name, function() {
		count++;
		td.textContent = count;
		td.className = "true";
	});
	return td;
}

addEventListener("DOMContentLoaded", function() {
	var label = document.createElement("label");
	label.id = "show-internals";
	label.title = "Add with each <tty-player> element tables showing the event counts and property values.";
	var toggle = document.createElement("input");
	toggle.type = "checkbox";
	toggle.onclick = function() {
		document.body.classList[toggle.checked ? "add" : "remove"]("show-internals");
	};
	label.appendChild(toggle);
	label.appendChild(document.createTextNode(" Show internals"));
	document.querySelector("header h1").appendChild(label);

	Array.prototype.forEach.call(document.querySelectorAll("tty-player"), function(player) {
		var eventsTable = makeEventsTable(player);
		var propertiesTable = makePropertiesTable(player);
		player.parentNode.insertBefore(propertiesTable, player.nextSibling);
		player.parentNode.insertBefore(eventsTable, player.nextSibling);
	});
});
