var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// node_modules/ms/index.js
var require_ms = __commonJS((exports, module) => {
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  module.exports = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return;
    }
  }
  function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return Math.round(ms / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms / s) + "s";
    }
    return ms + "ms";
  }
  function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return plural(ms, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms, msAbs, s, "second");
    }
    return ms + " ms";
  }
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS((exports, module) => {
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable2;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = require_ms();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0;i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug(...args) {
        if (!debug.enabled) {
          return;
        }
        const self = debug;
        const curr = Number(new Date);
        const ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self, args);
        const logFn = self.log || createDebug.log;
        logFn.apply(self, args);
      }
      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy;
      Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug);
      }
      return debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable2() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  module.exports = setup;
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS((exports, module) => {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    let m;
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%") {
        return;
      }
      index++;
      if (match === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {});
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {}
  }
  function load() {
    let r;
    try {
      r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
    } catch (error) {}
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = process.env.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {}
  }
  module.exports = require_common()(exports);
  var { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});

// src/renderer.vert
var renderer_default = `#version 300 es

#define GLYPH_WIDTH		96U
#define GLYPH_HEIGHT		211U
#define GLYPH_PADDING		8U
#define GLYPH_ATLAS_WIDTH	4096U
#define GLYPH_ATLAS_HEIGHT	4096U
#define GLYPH_ATLAS_COLS	(GLYPH_ATLAS_WIDTH / (GLYPH_WIDTH + GLYPH_PADDING))

#define ASCII_START		33U
#define ASCII_END		126U
#define ASCII_GLYPHS		(ASCII_END - ASCII_START + 1U)
#define ASCII_STYLES		4U
#define BOX_START		0x2500U
#define BOX_END			0x259FU

#define VERTICES_PER_GLYPH	6
#define PALETTE_SIZE		18

in uint a_bgColour; // 0..255
in uint a_fgColour; // 0..255
in uint a_charCode; // 0..65535

uniform int u_rows;
uniform int u_cols;
uniform vec3 u_palette[PALETTE_SIZE];
uniform sampler2D u_program;
uniform int u_program_row, u_program_col, u_program_rows, u_program_cols;

out vec3 v_bgColour;
out vec3 v_fgColour;
out vec2 v_uvCoord;
out vec2 v_cellCoord;
flat out uint v_charCode;

vec2 glyphTopLeft(uint charCode) {
	uint i = 0U;

	if (charCode >= ASCII_START && charCode <= ASCII_START + ASCII_GLYPHS * ASCII_STYLES) {
		i = (charCode - ASCII_START) + 1U;
	} else if (charCode >= BOX_START && charCode <= BOX_END) {
		i = (charCode - BOX_START) + ASCII_GLYPHS * ASCII_STYLES + 1U;
	} else {
		return vec2(0.0, 0.0); // empty glyph
	}

	uint x = (i % GLYPH_ATLAS_COLS) * (GLYPH_WIDTH + GLYPH_PADDING);
	uint y = (i / GLYPH_ATLAS_COLS) * (GLYPH_HEIGHT + GLYPH_PADDING);

	return vec2(float(x), float(y));
}

void main() {
	int cell = gl_VertexID / VERTICES_PER_GLYPH;
	int cellVertex = gl_VertexID % VERTICES_PER_GLYPH;

	// top left row/col for this cell
	int row = cell / u_cols;
	int col = cell % u_cols;

	// top left / bottom right uv coordinates
	vec2 tl = glyphTopLeft(a_charCode);

	if (tl == vec2(0.0, 0.0) &&
		a_bgColour == 0U &&
		a_fgColour == 0U &&
		row >= u_program_row &&
		col >= u_program_col &&
		row < u_program_row + u_program_rows &&
		col < u_program_col + u_program_cols) {
		int vrow = row - u_program_row;
		int vcol = col - u_program_col;

		vec2 texCell = vec2(float(vcol) / float(u_program_cols), float(vrow) / float(u_program_rows));
		vec4 texSample = texture(u_program, texCell);

		v_charCode = (uint(round(texSample.r * 256.0)) << 8) + uint(round(texSample.g * 256.0));
		v_bgColour = u_palette[int(round(texSample.b * 256.0))];
		v_fgColour = u_palette[int(round(texSample.a * 256.0))];

		tl = glyphTopLeft(v_charCode);
	} else {
		v_charCode = a_charCode;
		v_bgColour = u_palette[a_bgColour];
		v_fgColour = u_palette[a_fgColour];
	}

	vec2 br = vec2(tl.x + float(GLYPH_WIDTH), tl.y + float(GLYPH_HEIGHT));
	vec2 uvCoord = tl;
	v_cellCoord = vec2(0.0, 0.0);


	// switch properties according to which vertex this is for
	switch (cellVertex) {
	case 1: // bottom-left
	case 3:
		row++;
		uvCoord = vec2(tl.x, br.y);
		v_cellCoord = vec2(0.0, 1.0);
		break;

	case 2: // top-right
	case 5:
		col++;
		uvCoord = vec2(br.x, tl.y);
		v_cellCoord = vec2(1.0, 0.0);
		break;

	case 4: // bottom-right
		row++;
		col++;
		uvCoord = vec2(br.x, br.y);
		v_cellCoord = vec2(1.0, 1.0);
		break;

	default:
		break;
	}

	// uv coordinates needs to be in [0.0, 1.0]
	uvCoord = vec2(uvCoord.x / float(GLYPH_ATLAS_WIDTH), uvCoord.y / float(GLYPH_ATLAS_HEIGHT));
	v_uvCoord = uvCoord;

	// position needs to be in [-1.0, 1.0]
	float ndcX = 2.0 * float(col) / float(u_cols) - 1.0;
	float ndcY = -2.0 * float(row) / float(u_rows) + 1.0;

	gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
}
`;

// src/renderer.frag
var renderer_default2 = `#version 300 es

#define PALETTE_SIZE 18

#define GLYPH_FULL_BLOCK	0x2588U // █
#define GLYPH_75P_FILL		0x2593U // ▓
#define GLYPH_50P_FILL		0x2592U // ▒
#define GLYPH_25P_FILL		0x2591U // ░

#define GLYPH_TOP_HALF		0x2580U // ▀
#define GLYPH_BOTTOM_HALF	0x2584U // ▄
#define GLYPH_LEFT_HALF		0x258CU // ▌
#define GLYPH_RIGHT_HALF	0x2590U // ▐
#define GLYPH_JUST_TR_QUART	0x259DU // ▝
#define GLYPH_JUST_BR_QUART	0x2597U // ▗
#define GLYPH_JUST_BL_QUART	0x2596U // ▖
#define GLYPH_JUST_TL_QUART	0x2598U // ▘
#define GLYPH_EMPTY_TR_QUART	0x2599U // ▙
#define GLYPH_EMPTY_BR_QUART	0x259BU // ▛
#define GLYPH_EMPTY_BL_QUART	0x259CU // ▜
#define GLYPH_EMPTY_TL_QUART	0x259FU // ▟
#define GLYPH_TR_AND_BL_QUART	0x259EU // ▞
#define GLYPH_TL_AND_BR_QUART	0x259AU // ▚

#define GLYPH_LINE_TR		0x2514U // └
#define GLYPH_LINE_TRB		0x251CU // ├
#define GLYPH_LINE_TRBL		0x253CU // ┼
#define GLYPH_LINE_TRL		0x2534U // ┴
#define GLYPH_LINE_TBL		0x2524U // ┤
#define GLYPH_LINE_TB		0x2502U // │
#define GLYPH_LINE_TL		0x2518U // ┘
#define GLYPH_LINE_RB		0x250CU // ┌
#define GLYPH_LINE_RBL		0x252CU // ┬
#define GLYPH_LINE_RL		0x2500U // ─
#define GLYPH_LINE_BL		0x2510U // ┐

precision mediump float;

in vec3 v_bgColour;
in vec3 v_fgColour;
in vec2 v_uvCoord;
in vec2 v_cellCoord;
flat in uint v_charCode;

uniform highp int u_rows;
uniform highp int u_cols;
uniform highp vec3 u_palette[PALETTE_SIZE];
uniform sampler2D u_glyphAtlas;

out vec4 fragColour;

void main() {
	int cellX = int(gl_FragCoord.x);
	int cellY = int(gl_FragCoord.y);

	int sectionX = min(int(v_cellCoord.x * 5.0), 4); // --2--
	int sectionY = min(int(v_cellCoord.y * 9.0), 8); // ----4----

	bool centerX = sectionX == 2;
	bool centerY = sectionY == 4;

	bool specialBlock = true;
	bool foreground = false;

	vec3 fgColour = v_fgColour;

	// check for special (fragment rendered) block characters
	switch (v_charCode) {

	// fill characters

	case 0U:
		if (v_bgColour == u_palette[0] || v_bgColour == u_palette[16]) {
			discard;
		}
		// foreground = false
		break;

	case GLYPH_FULL_BLOCK:
		foreground = true;
		break;

	case GLYPH_75P_FILL:
		/*
		if (cellX % 2 == 0 || cellY % 2 == 0) {
			foreground = true;
		}
		*/
		fgColour = 0.75 * v_fgColour + 0.25 * v_bgColour;
		foreground = true;
		break;

	case GLYPH_50P_FILL:
		/*
		if ((cellY % 2 == 0 && cellX % 2 == 1) || (cellY % 2 == 1 && cellX % 2 == 0)) {
			foreground = true;
		}
		*/
		fgColour = 0.50 * v_fgColour + 0.50 * v_bgColour;
		foreground = true;
		break;
	
	case GLYPH_25P_FILL:
		/*
		if (cellX % 2 == 1 && cellY % 2 == 1) {
			foreground = true;
		}
		*/
		fgColour = 0.25 * v_fgColour + 0.75 * v_bgColour;
		foreground = true;
		break;

	// block characters

	case GLYPH_TOP_HALF:
		if (v_cellCoord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_BOTTOM_HALF:
		if (v_cellCoord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_LEFT_HALF:
		if (v_cellCoord.x < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_RIGHT_HALF:
		if (v_cellCoord.x > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_TR_QUART:
		if (v_cellCoord.x > 0.5 && v_cellCoord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_BR_QUART:
		if (v_cellCoord.x > 0.5 && v_cellCoord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_BL_QUART:
		if (v_cellCoord.x < 0.5 && v_cellCoord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_JUST_TL_QUART:
		if (v_cellCoord.x < 0.5 && v_cellCoord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_TR_QUART:
		if (v_cellCoord.x < 0.5 || v_cellCoord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_BR_QUART:
		if (v_cellCoord.x < 0.5 || v_cellCoord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_BL_QUART:
		if (v_cellCoord.x > 0.5 || v_cellCoord.y < 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_EMPTY_TL_QUART:
		if (v_cellCoord.x > 0.5 || v_cellCoord.y > 0.5) {
			foreground = true;
		}
		break;

	case GLYPH_TR_AND_BL_QUART:
		if ((v_cellCoord.x > 0.5 && v_cellCoord.y < 0.5) || (v_cellCoord.x < 0.5 && v_cellCoord.y > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_TL_AND_BR_QUART:
		if ((v_cellCoord.x < 0.5 && v_cellCoord.y < 0.5) || (v_cellCoord.x > 0.5 && v_cellCoord.y > 0.5)) {
			foreground = true;
		}
		break;

	// line characters

	case GLYPH_LINE_TR:
		if ((centerX && v_cellCoord.y < 0.5) || (centerY && v_cellCoord.x > 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRB:
		if (centerX || (centerY && v_cellCoord.x > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRBL:
		if (centerX || centerY) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TRL:
		if (centerY || (centerX && v_cellCoord.y < 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TBL:
		if (centerX || (centerY && v_cellCoord.x < 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TB:
		if (centerX) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_TL:
		if ((centerX && v_cellCoord.y < 0.5) || (centerY && v_cellCoord.x < 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RB:
		if ((centerX && v_cellCoord.y > 0.5) || (centerY && v_cellCoord.x > 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RBL:
		if (centerY || (centerX && v_cellCoord.y > 0.5)) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_RL:
		if (centerY) {
			foreground = true;
		}
		break;

	case GLYPH_LINE_BL:
		if ((centerX && v_cellCoord.y > 0.5) || (centerY && v_cellCoord.x < 0.5) || (centerX && centerY)) {
			foreground = true;
		}
		break;

	default:
		// not a special block character; render with glyph atlas
		specialBlock = false;

		break;
	}

	if (specialBlock) {
		if (foreground) {
			fragColour = vec4(fgColour, 1.0);
		} else {
			fragColour = vec4(v_bgColour, 1.0);
		}

		return;
	}

	// render glyph using glyph atlas
	vec4 glyphSample = texture(u_glyphAtlas, v_uvCoord);
	float fgMask = clamp(glyphSample.a, 0.0, 1.0);
	float bgMask = 1.0 - fgMask;
	fragColour = vec4(v_bgColour * bgMask, bgMask) + vec4(fgColour * fgMask, fgMask);
}
`;

// src/textures.ts
var TEXTURES = {};
var GLYPH_ATLAS_TEXTURE_INDEX = 0;
var GLYPH_ATLAS_TEXTURE = "/glyphatlas.png";
var PROGRAM_TEXTURE_INDEX = 1;
var WHITE_TEXTURE = "/white.png";
var SMOOTH_NORMAL = "/smooth.png";
var CUBE_TEXTURE_INDEX = 2;
var CUBE_NORMAL_INDEX = 3;
var CUBE_TEXTURE = "/cube/texture.jpg";
var CUBE_NORMAL = "/cube/normal.jpg";
var SKYBOX_TEXTURE_INDEX = 2;
var EARTH_SKYBOX_FACES = [
  "/earth/right.png",
  "/earth/left.png",
  "/earth/top.png",
  "/earth/bottom.png",
  "/earth/front.png",
  "/earth/back.png"
];
var EARTH_CUBEMAP = "earth_cubemap";
var SPHERE_TEXTURE_INDEX = 2;
var SPHERE_NORMAL_INDEX = 3;
var EARTH_TEXTURE = "/earth/texture.jpg";
var EARTH_NORMAL = "/earth/normal.jpg";
var MOON_TEXTURE = "/earth/moon_texture.jpg";
var MOON_NORMAL = "/earth/moon_normal.jpg";
async function loadTextures(gl, logMessage) {
  const textures = [
    WHITE_TEXTURE,
    SMOOTH_NORMAL,
    CUBE_TEXTURE,
    CUBE_NORMAL,
    EARTH_TEXTURE,
    EARTH_NORMAL,
    MOON_TEXTURE,
    MOON_NORMAL
  ];
  const promises = [];
  promises.push((async () => {
    TEXTURES[GLYPH_ATLAS_TEXTURE] = await loadGlyphAtlas(gl);
    logMessage("font_loader", `loaded ${GLYPH_ATLAS_TEXTURE}`);
  })());
  for (let i = 0;i < textures.length; i++) {
    promises.push((async () => {
      const texture = await loadTexture(gl, textures[i]);
      TEXTURES[textures[i]] = texture;
      logMessage("texture_loader", `loaded ${textures[i]}`);
    })());
  }
  promises.push((async () => {
    const texture = await loadCubeMap(gl, EARTH_SKYBOX_FACES);
    TEXTURES[EARTH_CUBEMAP] = texture;
    logMessage("cubemap_loader", `loaded ${EARTH_CUBEMAP}`);
  })());
  await Promise.all(promises);
}
function loadGlyphAtlas(gl) {
  return new Promise((resolve, reject) => {
    const image = new Image;
    image.src = GLYPH_ATLAS_TEXTURE;
    image.onload = () => {
      const texture = gl.createTexture();
      if (!texture) {
        reject(new Error("When creating GL texture"));
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve(texture);
    };
  });
}
function loadTexture(gl, path) {
  return new Promise((resolve, reject) => {
    const image = new Image;
    image.src = path;
    image.onload = () => {
      const tex = gl.createTexture();
      if (!tex) {
        reject(new Error("When creating GL texture"));
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve(tex);
    };
  });
}
async function loadCubeMap(gl, faces) {
  if (faces.length !== 6) {
    throw new Error("Cube map requires exactly 6 faces");
  }
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("When creating cube map texture");
  }
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  const targets = [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];
  const promises = faces.map(async (path, index) => {
    const image = new Promise((resolve, reject) => {
      const img2 = new Image;
      img2.src = path;
      img2.onload = () => resolve(img2);
      img2.onerror = (err) => reject(new Error(`When loading image at ${path}`, { cause: err }));
    });
    const img = await image;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(targets[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  });
  await Promise.all(promises);
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

// src/programs/math.ts
class Mat4 {
  static create() {
    const o = new Float32Array(16);
    o[0] = 1;
    o[5] = 1;
    o[10] = 1;
    o[15] = 1;
    return o;
  }
  static set(o, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    o[0] = m00;
    o[1] = m01;
    o[2] = m02;
    o[3] = m03;
    o[4] = m10;
    o[5] = m11;
    o[6] = m12;
    o[7] = m13;
    o[8] = m20;
    o[9] = m21;
    o[10] = m22;
    o[11] = m23;
    o[12] = m30;
    o[13] = m31;
    o[14] = m32;
    o[15] = m33;
    return o;
  }
  static multiply(o, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    o[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    o[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    o[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    o[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    o[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    o[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    o[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    o[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    o[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    o[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    o[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    o[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    o[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    o[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    o[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    o[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return o;
  }
  static transpose(o, a) {
    if (o === a) {
      const a01 = a[1], a02 = a[2], a03 = a[3];
      const a12 = a[6], a13 = a[7];
      const a23 = a[11];
      o[1] = a[4];
      o[2] = a[8];
      o[3] = a[12];
      o[4] = a01;
      o[6] = a[9];
      o[7] = a[13];
      o[8] = a02;
      o[9] = a12;
      o[11] = a[14];
      o[12] = a03;
      o[13] = a13;
      o[14] = a23;
    } else {
      o[0] = a[0];
      o[1] = a[4];
      o[2] = a[8];
      o[3] = a[12];
      o[4] = a[1];
      o[5] = a[5];
      o[6] = a[9];
      o[7] = a[13];
      o[8] = a[2];
      o[9] = a[6];
      o[10] = a[10];
      o[11] = a[14];
      o[12] = a[3];
      o[13] = a[7];
      o[14] = a[11];
      o[15] = a[15];
    }
    return o;
  }
  static inverse(o, a) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return o;
  }
  static inverseTranspose3x3(o, a) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    o[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    o[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    o[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    o[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    o[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    o[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    o[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    o[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return o;
  }
  static perspective(o, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    o[0] = f / aspect;
    o[1] = 0;
    o[2] = 0;
    o[3] = 0;
    o[4] = 0;
    o[5] = f;
    o[6] = 0;
    o[7] = 0;
    o[8] = 0;
    o[9] = 0;
    o[11] = -1;
    o[12] = 0;
    o[13] = 0;
    o[15] = 0;
    const nf = 1 / (near - far);
    o[10] = (far + near) * nf;
    o[14] = 2 * far * near * nf;
    return o;
  }
  static orthographic(o, left, right, bottom, top, near, far) {
    o[0] = 2 / (right - left);
    o[1] = 0;
    o[2] = 0;
    o[3] = 0;
    o[4] = 0;
    o[5] = 2 / (top - bottom);
    o[6] = 0;
    o[7] = 0;
    o[8] = 0;
    o[9] = 0;
    o[10] = -2 / (far - near);
    o[11] = 0;
    o[12] = -(right + left) / (right - left);
    o[13] = -(top + bottom) / (top - bottom);
    o[14] = -(far + near) / (far - near);
    o[15] = 1;
    return o;
  }
  static lookAt(o, e, c, up) {
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, l;
    z0 = e[0] - c[0];
    z1 = e[1] - c[1];
    z2 = e[2] - c[2];
    l = 1 / Math.hypot(z0, z1, z2);
    z0 *= l;
    z1 *= l;
    z2 *= l;
    x0 = up[1] * z2 - up[2] * z1;
    x1 = up[2] * z0 - up[0] * z2;
    x2 = up[0] * z1 - up[1] * z0;
    l = 1 / Math.hypot(x0, x1, x2);
    x0 *= l;
    x1 *= l;
    x2 *= l;
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    l = 1 / Math.hypot(y0, y1, y2);
    y0 *= l;
    y1 *= l;
    y2 *= l;
    o[0] = x0;
    o[1] = y0;
    o[2] = z0;
    o[3] = 0;
    o[4] = x1;
    o[5] = y1;
    o[6] = z1;
    o[7] = 0;
    o[8] = x2;
    o[9] = y2;
    o[10] = z2;
    o[11] = 0;
    o[12] = -(x0 * e[0] + x1 * e[1] + x2 * e[2]);
    o[13] = -(y0 * e[0] + y1 * e[1] + y2 * e[2]);
    o[14] = -(z0 * e[0] + z1 * e[1] + z2 * e[2]);
    o[15] = 1;
    return o;
  }
  static translation(tx, ty, tz) {
    const T = Mat4.create();
    Mat4.set(T, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1);
    return T;
  }
  static scale(sx, sy, sz) {
    const T = Mat4.create();
    Mat4.set(T, sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
    return T;
  }
  static rotation(axis, radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    const T = Mat4.create();
    switch (axis) {
      case "x":
        Mat4.set(T, 1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1);
        break;
      case "y":
        Mat4.set(T, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1);
        break;
      case "z":
        Mat4.set(T, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        break;
    }
    return T;
  }
}

// src/programs/cube/cube.vert
var cube_default = `#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_uvCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;
uniform mat3 u_normalMatrix;

out mat3 v_TBN;
out vec3 v_position;
out vec2 v_uvCoord;

void main() {
	mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix;

	vec3 N = u_normalMatrix * a_normal;
	vec3 T = mat3(modelViewMatrix) * a_tangent;
	vec3 B = cross(N, T);

	v_TBN = mat3(T, B, N);
	v_position = vec3(modelViewMatrix * vec4(a_position, 1.0));
	v_uvCoord = a_uvCoord;

	gl_Position = u_projectionMatrix * modelViewMatrix * vec4(a_position, 1.0);
}
`;

// src/programs/cube/cube.frag
var cube_default2 = `#version 300 es

#define NUM_DIMENSIONS	7U

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uvCoord;

uniform sampler2D u_cubeTexture;
uniform sampler2D u_cubeNormal;

out vec4 fragColour;

const vec3 dimensions[NUM_DIMENSIONS] = vec3[NUM_DIMENSIONS](
	normalize(vec3(1.0, 1.0, 1.0)),	// white
	vec3(1.0, 0.0, 0.0),		// red
	vec3(0.0, 1.0, 0.0),		// green
	normalize(vec3(1.0, 1.0, 0.0)),	// yellow
	vec3(0.0, 0.0, 1.0),		// blue
	normalize(vec3(1.0, 0.0, 1.0)),	// purple
	normalize(vec3(0.0, 1.0, 1.0))	// cyan
);

uint getDimension(vec3 colour) {
	colour = normalize(colour);
	float minDist = 1000.0;
	uint dim = 0U;

	for (uint i = 0U; i < NUM_DIMENSIONS; i++) {
		float dist = distance(colour, dimensions[i]);

		if (dist < minDist) {
			minDist = dist;
			dim = i;
		}
	}

	return dim;
}

float getLuminance(vec3 colour, uint dim) {
	// colour is NOT normalized
	return dot(colour, dimensions[dim]);
}

void main() {
	vec3 normalColour = texture(u_cubeNormal, v_uvCoord).rgb;
	vec3 normal = normalColour * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	vec3 light = vec3(1.0, -1.0, 1.0); // fixed position
	light = normalize(light - v_position);

	vec3 colour = texture(u_cubeTexture, v_uvCoord).rgb;
	uint dim = getDimension(colour);
	float lam = max(dot(normal, light), 0.0);
	float lum = lam * getLuminance(colour, dim) * 0.8;

	uint colours[3] = uint[3](16U, dim, dim + 8U);

	// white needs a special selection
	if (dim == 0U) {
		colours = uint[3](16U, 8U, 17U);
	}

	int bgColourIdx = min(int(lum * 3.0), 3);
	int fgColourIdx = min(int(lum * 3.0) + 1, 3);
	uint bgColour = colours[bgColourIdx];
	uint fgColour = colours[fgColourIdx];

	// " -=#░@▒▓"
	uint glyphs[8] = uint[8](0U, 45U, 61U, 35U, 9617U, 64U, 9618U, 9619U);
	int glyphIdx = int(lum * 3.0 * 8.0) % 8;
	uint glyph = glyphs[glyphIdx];

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		float(bgColour) / 256.0,
		float(fgColour) / 256.0
	);
}
`;

// src/program.ts
class Program {
  gl;
  glProgram;
  constructor(gl) {
    this.gl = gl;
  }
  loadProgram(vertex_shader, fragment_shader) {
    const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!vertShader) {
      throw new Error("When creating vertex shader");
    }
    this.gl.shaderSource(vertShader, vertex_shader);
    this.gl.compileShader(vertShader);
    if (!this.gl.getShaderParameter(vertShader, this.gl.COMPILE_STATUS)) {
      throw new Error("When compiling vertex shader: " + this.gl.getShaderInfoLog(vertShader));
    }
    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!fragShader) {
      throw new Error("When creating fragment shader");
    }
    this.gl.shaderSource(fragShader, fragment_shader);
    this.gl.compileShader(fragShader);
    if (!this.gl.getShaderParameter(fragShader, this.gl.COMPILE_STATUS)) {
      throw new Error("When compiling fragment shader: " + this.gl.getShaderInfoLog(fragShader));
    }
    const prog = this.gl.createProgram();
    if (!prog) {
      throw new Error("When creating GPU program");
    }
    this.gl.attachShader(prog, vertShader);
    this.gl.attachShader(prog, fragShader);
    this.gl.linkProgram(prog);
    if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
      throw new Error("When linking shader program: " + this.gl.getProgramInfoLog(prog));
    }
    this.glProgram = prog;
    this.gl.useProgram(this.glProgram);
  }
  resize() {}
}

// src/programs/mesh.ts
class TriangleMesh {
  static STRIDE = 44;
  positions;
  normals;
  tangents;
  uvCoords;
  constructor() {
    this.positions = [];
    this.normals = [];
    this.tangents = [];
    this.uvCoords = [];
  }
  data() {
    const buffer = [];
    for (let i = 0;i < this.positions.length / 3; i++) {
      const baseVec3 = i * 3;
      const baseVec2 = i * 2;
      buffer.push(this.positions[baseVec3], this.positions[baseVec3 + 1], this.positions[baseVec3 + 2], this.normals[baseVec3], this.normals[baseVec3 + 1], this.normals[baseVec3 + 2], this.tangents[baseVec3], this.tangents[baseVec3 + 1], this.tangents[baseVec3 + 2], this.uvCoords[baseVec2], this.uvCoords[baseVec2 + 1]);
    }
    return new Float32Array(buffer);
  }
  enableAttributes(gl, vbo, attributes) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, TriangleMesh.STRIDE, 0);
    gl.enableVertexAttribArray(attributes.position);
    gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, TriangleMesh.STRIDE, 12);
    gl.enableVertexAttribArray(attributes.normal);
    gl.vertexAttribPointer(attributes.tangent, 3, gl.FLOAT, false, TriangleMesh.STRIDE, 24);
    gl.enableVertexAttribArray(attributes.tangent);
    gl.vertexAttribPointer(attributes.uvCoord, 2, gl.FLOAT, false, TriangleMesh.STRIDE, 36);
    gl.enableVertexAttribArray(attributes.uvCoord);
  }
}

// src/programs/meshes/cube.ts
function _repeat(arr, n) {
  const ret = [];
  for (let i = 0;i < n; i++) {
    ret.push(...arr);
  }
  return ret;
}

class CubeMesh extends TriangleMesh {
  static NUM_VERTICES = 36;
  constructor() {
    super();
    const blf = [-1, -1, 1];
    const blb = [-1, -1, -1];
    const brf = [1, -1, 1];
    const brb = [1, -1, -1];
    const tlf = [-1, 1, 1];
    const tlb = [-1, 1, -1];
    const trf = [1, 1, 1];
    const trb = [1, 1, -1];
    this.positions = [
      ...tlf,
      ...blf,
      ...brf,
      ...tlf,
      ...brf,
      ...trf,
      ...trb,
      ...brb,
      ...blb,
      ...trb,
      ...blb,
      ...tlb,
      ...trf,
      ...brf,
      ...brb,
      ...trf,
      ...brb,
      ...trb,
      ...tlb,
      ...blb,
      ...blf,
      ...tlb,
      ...blf,
      ...tlf,
      ...tlb,
      ...tlf,
      ...trf,
      ...tlb,
      ...trf,
      ...trb,
      ...blf,
      ...blb,
      ...brb,
      ...blf,
      ...brb,
      ...brf
    ];
    this.normals = [
      ..._repeat([0, 0, 1], 6),
      ..._repeat([0, 0, -1], 6),
      ..._repeat([1, 0, 0], 6),
      ..._repeat([-1, 0, 0], 6),
      ..._repeat([0, 1, 0], 6),
      ..._repeat([0, -1, 0], 6)
    ];
    this.tangents = [
      ..._repeat([1, 0, 0], 6),
      ..._repeat([-1, 0, 0], 6),
      ..._repeat([0, 0, -1], 6),
      ..._repeat([0, 0, 1], 6),
      ..._repeat([1, 0, 0], 6),
      ..._repeat([1, 0, 0], 6)
    ];
    this.uvCoords = [
      0,
      1,
      0,
      2 / 3,
      1 / 2,
      2 / 3,
      0,
      1,
      1 / 2,
      2 / 3,
      1 / 2,
      1,
      1 / 2,
      1 / 3,
      1 / 2,
      0,
      1,
      0,
      1 / 2,
      1 / 3,
      1,
      0,
      1,
      1 / 3,
      0,
      2 / 3,
      0,
      1 / 3,
      1 / 2,
      1 / 3,
      0,
      2 / 3,
      1 / 2,
      1 / 3,
      1 / 2,
      2 / 3,
      1 / 2,
      2 / 3,
      1 / 2,
      1 / 3,
      1,
      1 / 3,
      1 / 2,
      2 / 3,
      1,
      1 / 3,
      1,
      2 / 3,
      0,
      1 / 3,
      0,
      0,
      1 / 2,
      0,
      0,
      1 / 3,
      1 / 2,
      0,
      1 / 2,
      1 / 3,
      1 / 2,
      1,
      1 / 2,
      2 / 3,
      1,
      2 / 3,
      1 / 2,
      1,
      1,
      2 / 3,
      1,
      1
    ];
  }
}

// src/programs/cube/index.ts
class CubeProgram extends Program {
  attributes;
  uniforms;
  vbo;
  cube;
  init() {
    this.loadProgram(cube_default, cube_default2);
    this.initializeLocations();
    this.vbo = this.gl.createBuffer();
    if (!this.vbo) {
      throw new Error("When creating vertex buffer");
    }
    this.gl.useProgram(this.glProgram);
    this.gl.uniform1i(this.uniforms.cubeTexture, CUBE_TEXTURE_INDEX);
    this.gl.uniform1i(this.uniforms.cubeNormal, CUBE_NORMAL_INDEX);
    this.cube = new CubeMesh;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cube.data(), this.gl.DYNAMIC_DRAW);
  }
  initializeLocations() {
    this.attributes = {
      position: this.gl.getAttribLocation(this.glProgram, "a_position"),
      normal: this.gl.getAttribLocation(this.glProgram, "a_normal"),
      tangent: this.gl.getAttribLocation(this.glProgram, "a_tangent"),
      uvCoord: this.gl.getAttribLocation(this.glProgram, "a_uvCoord")
    };
    if (this.attributes.position < 0 || this.attributes.normal < 0 || this.attributes.tangent < 0 || this.attributes.uvCoord < 0) {
      throw new Error("When getting attribute locations");
    }
    const projectionMatrix = this.gl.getUniformLocation(this.glProgram, "u_projectionMatrix");
    const viewMatrix = this.gl.getUniformLocation(this.glProgram, "u_viewMatrix");
    const modelMatrix = this.gl.getUniformLocation(this.glProgram, "u_modelMatrix");
    const normalMatrix = this.gl.getUniformLocation(this.glProgram, "u_normalMatrix");
    const cubeTexture = this.gl.getUniformLocation(this.glProgram, "u_cubeTexture");
    const cubeNormal = this.gl.getUniformLocation(this.glProgram, "u_cubeNormal");
    if (!projectionMatrix || !viewMatrix || !modelMatrix || !normalMatrix || !cubeTexture || !cubeNormal) {
      throw new Error("When getting uniform locations");
    }
    this.uniforms = {
      projectionMatrix,
      modelMatrix,
      viewMatrix,
      normalMatrix,
      cubeTexture,
      cubeNormal
    };
  }
  draw(projectionMatrix) {
    this.gl.useProgram(this.glProgram);
    this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);
    const viewMatrix = Mat4.create();
    Mat4.lookAt(viewMatrix, [0, 3, 4], [0, 0, 0], [0, -1, 0]);
    this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);
    const xRotate = Mat4.rotation("z", 2 * Math.PI * (Date.now() % 5000) / 5000);
    const yRotate = Mat4.rotation("x", 2 * Math.PI * (Date.now() % 6000) / 6000);
    const zRotate = Mat4.rotation("y", 2 * Math.PI * (Date.now() % 7000) / 7000);
    const modelMatrix = Mat4.create();
    Mat4.multiply(modelMatrix, xRotate, yRotate);
    Mat4.multiply(modelMatrix, modelMatrix, zRotate);
    this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);
    const normalMatrix = new Float32Array(9);
    const modelViewMatrix = Mat4.create();
    Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
    this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);
    this.cube.enableAttributes(this.gl, this.vbo, this.attributes);
    this.gl.activeTexture(this.gl.TEXTURE0 + CUBE_TEXTURE_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[CUBE_TEXTURE]);
    this.gl.activeTexture(this.gl.TEXTURE0 + CUBE_NORMAL_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[CUBE_NORMAL]);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);
  }
}

// src/programs/earth/sphere.vert
var sphere_default = `#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_uvCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;
uniform mat3 u_normalMatrix;
uniform vec3 u_lightPosition;

out mat3 v_TBN;
out vec3 v_position;
out vec2 v_uvCoord;
out vec3 v_light;

void main() {
	mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix;

	vec3 N = u_normalMatrix * a_normal;
	vec3 T = mat3(modelViewMatrix) * a_tangent;
	vec3 B = cross(N, T);

	v_TBN = mat3(T, B, N);
	v_position = vec3(modelViewMatrix * vec4(a_position, 1.0));
	v_uvCoord = a_uvCoord;

	v_light = vec3(u_viewMatrix * vec4(u_lightPosition, 0.0));

	gl_Position = u_projectionMatrix * modelViewMatrix * vec4(a_position, 1.0);
}
`;

// src/programs/earth/sphere.frag
var sphere_default2 = `#version 300 es

#define NUM_DIMENSIONS	8U

precision mediump float;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uvCoord;
in vec3 v_light;

uniform sampler2D u_sphereTexture;
uniform sampler2D u_sphereNormal;

out vec4 fragColour;

// NOTE: these are in order of the colours in src/index.ts
const vec3 dimensions[NUM_DIMENSIONS] = vec3[NUM_DIMENSIONS](
	vec3(0.0, 0.0, 0.0),	// black (unused)
	vec3(1.0, 0.8, 0.8),	// red
	vec3(1.0, 1.0, 0.8),	// yellow
	vec3(0.8, 1.0, 0.8),	// green
	vec3(0.8, 1.0, 1.0),	// cyan
	vec3(0.8, 0.8, 1.0),	// blue
	vec3(1.0, 0.8, 1.0),	// purple
	vec3(1.0, 1.0, 1.0)	// white
);

uint getDim(vec3 col) {
	col = normalize(col);
	float dist = 1000.0;
	uint dim = 0U;

	for (uint i = 1U; i < NUM_DIMENSIONS; i++) {
		float d = distance(col, normalize(dimensions[i]));

		if (d < dist) {
			dist = d;
			dim = i;
		}
	}

	return dim;
}

float getLum(vec3 col, uint dim) {
	vec3 dcol = dimensions[dim];
	return dot(col, dcol) / dot(dcol, dcol);
}

void main() {
	vec3 normal = texture(u_sphereNormal, v_uvCoord).rgb;
	normal = normal * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	vec3 light = normalize(v_light);
	float lam = 1.5 * dot(normal, light);

	vec3 col = texture(u_sphereTexture, v_uvCoord).rgb;

	uint dim = getDim(col);
	float lum = lam * getLum(col, dim);

	// dithering
	float bayer[16] = float[](
		0.0, 0.5, 0.125, 0.625,
		0.75, 0.25, 0.875, 0.375,
		0.1875, 0.6875, 0.0625, 0.5625,
		0.9375, 0.4375, 0.8125, 0.3125
	);
	float dither = (bayer[int(gl_FragCoord.y) % 4 * 4 + int(gl_FragCoord.x) % 4] - 0.5) / 12.0;
	lum = clamp(lum + dither, 4.0 / (3.0 * 12.0), 1.0);
	int layer = clamp(int(lum * 3.0), 0, 2);

	//                           '.'  '-'  ','  ':'  ';'  '='  '!'  '*'  '#'  '$'  '@'
	uint glyphs[12] = uint[](0U, 46U, 45U, 44U, 58U, 59U, 61U, 33U, 42U, 35U, 36U, 64U);
	uint bgs[3] = uint[](16U, dim, dim + 8U);
	uint fgs[3] = uint[](dim, dim + 8U, 17U);

	if (dim == 7U) {
		if (layer > 0) {
			// reverse the order of the glyphs
			glyphs = uint[](64U, 36U, 35U, 42U, 33U, 61U, 59U, 58U, 44U, 45U, 46U, 0U);
		}

		bgs = uint[](16U, 7U, 17U);
		fgs = uint[](7U, 16U, 8U);
	}

	int glyphi = clamp(int(12.0 * (3.0 * lum - float(layer))), 0, 11);
	uint glyph = glyphs[glyphi];
	uint bg = bgs[layer];
	uint fg = fgs[layer];

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		float(bg) / 256.0,
		float(fg) / 256.0
	);
}
`;

// src/programs/meshes/sphere.ts
class SphereMesh extends TriangleMesh {
  indices;
  constructor(numStacks, numSectors) {
    super();
    this.indices = [];
    const stackStep = Math.PI / numStacks;
    const sectorStep = 2 * Math.PI / numSectors;
    for (let i = 0;i <= numStacks; i++) {
      const stackAngle = Math.PI / 2 - i * stackStep;
      const xy = Math.cos(stackAngle);
      const z = Math.sin(stackAngle);
      for (let j = 0;j <= numSectors; j++) {
        const sectorAngle = -j * sectorStep;
        const x = xy * Math.cos(sectorAngle);
        const y = xy * Math.sin(sectorAngle);
        this.positions.push(x, y, z);
        this.normals.push(x, y, z);
        const tx = -Math.sin(sectorAngle);
        const ty = Math.cos(sectorAngle);
        this.tangents.push(tx, ty, 0);
        const s = j / numSectors;
        const t = i / numStacks;
        this.uvCoords.push(s, t);
      }
    }
    for (let i = 0;i < numStacks; i++) {
      let k1 = i * (numSectors + 1);
      let k2 = k1 + numSectors + 1;
      for (let j = 0;j < numSectors; j++, k1++, k2++) {
        if (i !== 0) {
          this.indices.push(k1, k2, k1 + 1);
        }
        if (i !== numStacks - 1) {
          this.indices.push(k1 + 1, k2, k2 + 1);
        }
      }
    }
  }
}

// src/programs/earth/index.ts
class EarthProgram extends Program {
  attributes;
  uniforms;
  vbo;
  ibo;
  sphere;
  init() {
    this.loadProgram(sphere_default, sphere_default2);
    this.initializeLocations();
    this.vbo = this.gl.createBuffer();
    if (!this.vbo) {
      throw new Error("When creating vertex buffer");
    }
    this.ibo = this.gl.createBuffer();
    if (!this.ibo) {
      throw new Error("When creating index buffer");
    }
    this.gl.useProgram(this.glProgram);
    this.gl.uniform1i(this.uniforms.sphereTexture, SPHERE_TEXTURE_INDEX);
    this.gl.uniform1i(this.uniforms.sphereNormal, SPHERE_NORMAL_INDEX);
    this.sphere = new SphereMesh(7, 15);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.sphere.data(), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.sphere.indices), this.gl.STATIC_DRAW);
  }
  initializeLocations() {
    this.gl.useProgram(this.glProgram);
    this.attributes = {
      position: this.gl.getAttribLocation(this.glProgram, "a_position"),
      normal: this.gl.getAttribLocation(this.glProgram, "a_normal"),
      tangent: this.gl.getAttribLocation(this.glProgram, "a_tangent"),
      uvCoord: this.gl.getAttribLocation(this.glProgram, "a_uvCoord")
    };
    if (this.attributes.position < 0 || this.attributes.normal < 0 || this.attributes.tangent < 0 || this.attributes.uvCoord < 0) {
      throw new Error("When getting attribute locations");
    }
    const projectionMatrix = this.gl.getUniformLocation(this.glProgram, "u_projectionMatrix");
    const viewMatrix = this.gl.getUniformLocation(this.glProgram, "u_viewMatrix");
    const modelMatrix = this.gl.getUniformLocation(this.glProgram, "u_modelMatrix");
    const normalMatrix = this.gl.getUniformLocation(this.glProgram, "u_normalMatrix");
    const sphereTexture = this.gl.getUniformLocation(this.glProgram, "u_sphereTexture");
    const sphereNormal = this.gl.getUniformLocation(this.glProgram, "u_sphereNormal");
    const lightPosition = this.gl.getUniformLocation(this.glProgram, "u_lightPosition");
    if (!projectionMatrix || !viewMatrix || !modelMatrix || !normalMatrix || !sphereTexture || !sphereNormal || !lightPosition) {
      throw new Error("When getting uniform locations");
    }
    this.uniforms = {
      projectionMatrix,
      modelMatrix,
      viewMatrix,
      normalMatrix,
      sphereTexture,
      sphereNormal,
      lightPosition
    };
  }
  draw(projectionMatrix, viewMatrix) {
    this.gl.useProgram(this.glProgram);
    this.sphere.enableAttributes(this.gl, this.vbo, this.attributes);
    this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);
    this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);
    this.gl.uniform3fv(this.uniforms.lightPosition, [1, 0.1, 0]);
    this.gl.uniform1i(this.uniforms.sphereTexture, SPHERE_TEXTURE_INDEX);
    this.gl.uniform1i(this.uniforms.sphereNormal, SPHERE_NORMAL_INDEX);
    const modelMatrix = Mat4.create();
    const modelViewMatrix = Mat4.create();
    const normalMatrix = new Float32Array(9);
    const upright = Mat4.rotation("x", Math.PI / 2);
    const upright2 = Mat4.rotation("z", Math.PI);
    Mat4.multiply(upright, upright2, upright);
    const spin = Mat4.rotation("y", 2 * Math.PI * (Date.now() % 30000) / 30000);
    Mat4.multiply(modelMatrix, spin, upright);
    this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);
    Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
    this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);
    this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_TEXTURE_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[EARTH_TEXTURE]);
    this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[EARTH_NORMAL]);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    this.gl.drawElements(this.gl.TRIANGLES, this.sphere.indices.length, this.gl.UNSIGNED_SHORT, 0);
    const moonAngle = 2 * Math.PI * (Date.now() % 25000) / 25000;
    const moonX = 3 * Math.cos(moonAngle);
    const moonZ = 3 * Math.sin(moonAngle);
    Mat4.multiply(modelMatrix, Mat4.translation(moonX, 0, moonZ), Mat4.rotation("y", -moonAngle));
    Mat4.multiply(modelMatrix, modelMatrix, Mat4.scale(0.27, 0.27, 0.27));
    this.gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix);
    Mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    Mat4.inverseTranspose3x3(normalMatrix, modelViewMatrix);
    this.gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);
    this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_TEXTURE_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[MOON_TEXTURE]);
    this.gl.activeTexture(this.gl.TEXTURE0 + SPHERE_NORMAL_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[MOON_NORMAL]);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    this.gl.drawElements(this.gl.TRIANGLES, this.sphere.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }
}

// src/programs/skybox/skybox.vert
var skybox_default = `#version 300 es

in vec3 a_position;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;

out vec3 v_position;

void main() {
	v_position = a_position;
	mat4 staticViewMatrix = mat4(mat3(u_viewMatrix)); // remove translation
	
	// when dividing z (w) by w, each vertex will have z value of 1; i.e., inf far away
	gl_Position = (u_projectionMatrix * staticViewMatrix * vec4(a_position, 1.0)).xyww;
}
`;

// src/programs/skybox/skybox.frag
var skybox_default2 = `#version 300 es

#define NUM_DIMENSIONS	8U

precision mediump float;

in vec3 v_position;

uniform samplerCube u_skyboxTexture;

out vec4 fragColour;

// NOTE: these are in order of the colours in src/index.ts
const vec3 dimensions[NUM_DIMENSIONS] = vec3[NUM_DIMENSIONS](
	vec3(0.0, 0.0, 0.0),	// black (unused)
	vec3(1.0, 0.8, 0.8),	// red
	vec3(1.0, 1.0, 0.8),	// yellow
	vec3(0.8, 1.0, 0.8),	// green
	vec3(0.8, 1.0, 1.0),	// cyan
	vec3(0.8, 0.8, 1.0),	// blue
	vec3(1.0, 0.8, 1.0),	// purple
	vec3(1.0, 1.0, 1.0)	// white
);

struct Dims {
	uint dim1;
	uint dim2;
	float ratio;
};

Dims getDims(vec3 col) {
	vec3 ncol = normalize(col);
	float d1 = 1000.0;
	float d2 = 1000.0;
	uint dim1 = 0U;
	uint dim2 = 0U;

	for (uint i = 1U; i < NUM_DIMENSIONS; i++) {
		float d = distance(ncol, normalize(dimensions[i]));

		if (d < d1) {
			d2 = d1;
			dim2 = dim1;
			d1 = d;
			dim1 = i;
		} else if (d < d2) {
			d2 = d;
			dim2 = i;
		}
	}

	return Dims(dim1, dim2, d1 / (d1 + d2));
}

float getLum(vec3 col, uint dim) {
	vec3 dcol = dimensions[dim];
	return dot(col, dcol) / dot(dcol, dcol);
}

void main() {
	vec3 col = texture(u_skyboxTexture, v_position).rgb;

	// dithering
	float bayer[16] = float[](
		0.0, 0.5, 0.125, 0.625,
		0.75, 0.25, 0.875, 0.375,
		0.1875, 0.6875, 0.0625, 0.5625,
		0.9375, 0.4375, 0.8125, 0.3125
	);
	float bayerVal = bayer[int(gl_FragCoord.y) % 4 * 4 + int(gl_FragCoord.x) % 4];

	Dims dims = getDims(col);
	uint dim = (bayerVal < dims.ratio) ? dims.dim2 : dims.dim1;
	float lum = getLum(col, dim);

	float dither = (bayerVal - 0.5) / 12.0;
	lum = clamp(lum + dither, 0.0, 1.0);
	int layer = clamp(int(lum * 3.0), 0, 2);

	//                           '.'  '-'  ','  ':'  ';'  '='  '!'  '*'  '#'  '$'  '@'
	uint glyphs[12] = uint[](0U, 46U, 45U, 44U, 58U, 59U, 61U, 33U, 42U, 35U, 36U, 64U);
	uint bgs[3] = uint[](16U, dim, dim + 8U);
	uint fgs[3] = uint[](dim, dim + 8U, 17U);

	if (dim == 7U) {
		if (layer > 0) {
			// reverse the order of the glyphs
			glyphs = uint[](64U, 36U, 35U, 42U, 33U, 61U, 59U, 58U, 44U, 45U, 46U, 0U);
		}

		bgs = uint[](16U, 7U, 17U);
		fgs = uint[](7U, 16U, 8U);
	}

	int glyphi = clamp(int(12.0 * (3.0 * lum - float(layer))), 0, 11);
	uint glyph = glyphs[glyphi];
	uint bg = bgs[layer];
	uint fg = fgs[layer];

	fragColour = vec4(
		float(glyph >> 8) / 256.0,
		float(glyph & 255U) / 256.0,
		float(bg) / 256.0,
		float(fg) / 256.0
	);
}
`;

// src/programs/skybox/index.ts
class SkyboxProgram extends Program {
  attributes;
  uniforms;
  vbo;
  cube;
  init() {
    this.loadProgram(skybox_default, skybox_default2);
    this.initializeLocations();
    this.vbo = this.gl.createBuffer();
    if (!this.vbo) {
      throw new Error("When creating vertex buffer");
    }
    this.gl.useProgram(this.glProgram);
    this.gl.uniform1i(this.uniforms.skyboxTexture, SKYBOX_TEXTURE_INDEX);
    this.cube = new CubeMesh;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cube.data(), this.gl.STATIC_DRAW);
  }
  initializeLocations() {
    this.gl.useProgram(this.glProgram);
    this.attributes = {
      position: this.gl.getAttribLocation(this.glProgram, "a_position")
    };
    if (this.attributes.position < 0) {
      throw new Error("When getting attribute locations");
    }
    const projectionMatrix = this.gl.getUniformLocation(this.glProgram, "u_projectionMatrix");
    const viewMatrix = this.gl.getUniformLocation(this.glProgram, "u_viewMatrix");
    const skyboxTexture = this.gl.getUniformLocation(this.glProgram, "u_skyboxTexture");
    if (!projectionMatrix || !viewMatrix || !skyboxTexture) {
      throw new Error("When getting uniform locations");
    }
    this.uniforms = {
      projectionMatrix,
      viewMatrix,
      skyboxTexture
    };
  }
  enablePositionAttribute(gl, vbo, attribute) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 44, 0);
    gl.enableVertexAttribArray(attribute);
  }
  draw(projectionMatrix, viewMatrix) {
    this.gl.useProgram(this.glProgram);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);
    this.gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix);
    this.gl.activeTexture(this.gl.TEXTURE0 + SKYBOX_TEXTURE_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, TEXTURES[EARTH_CUBEMAP]);
    this.gl.uniform1i(this.uniforms.skyboxTexture, SKYBOX_TEXTURE_INDEX);
    this.enablePositionAttribute(this.gl, this.vbo, this.attributes.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, CubeMesh.NUM_VERTICES);
    this.gl.depthFunc(this.gl.LESS);
  }
}

// src/program_manager.ts
class ProgramManager {
  gl;
  targetWidth;
  targetHeight;
  dbo;
  fbo;
  projectionMatrix;
  cube;
  earth;
  skybox;
  programs;
  which;
  texture;
  constructor(gl) {
    this.gl = gl;
    this.initializeTexture();
    this.initializeDBO();
    this.initializeFBO();
    this.projectionMatrix = Mat4.create();
    this.cube = new CubeProgram(gl);
    this.earth = new EarthProgram(gl);
    this.skybox = new SkyboxProgram(gl);
    this.programs = [this.cube, this.earth, this.skybox];
    this.which = "";
  }
  init() {
    for (const program of this.programs) {
      program.init();
    }
  }
  initializeTexture() {
    this.targetWidth = 32;
    this.targetHeight = 32;
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 32, 32, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }
  initializeDBO() {
    this.dbo = this.gl.createRenderbuffer();
    if (!this.dbo) {
      throw new Error("When creating depth render buffer");
    }
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.dbo);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.targetWidth, this.targetHeight);
  }
  initializeFBO() {
    this.fbo = this.gl.createFramebuffer();
    if (!this.fbo) {
      throw new Error("When creating frame buffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.dbo);
  }
  resize(width, height) {
    width = isFinite(width) ? Math.max(1, width) : 1;
    height = isFinite(height) ? Math.max(1, height) : 1;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.dbo);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
    const fovy = Math.PI / 4;
    const aspect = 0.5 * width / height;
    const near = 0.1;
    const far = 100;
    Mat4.perspective(this.projectionMatrix, fovy, aspect, near, far);
    for (const program of this.programs) {
      program.resize(width, height);
    }
    this.targetWidth = width;
    this.targetHeight = height;
  }
  draw() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    switch (this.which) {
      case "cube":
        this.cube.draw(this.projectionMatrix);
        break;
      case "earth":
        const viewX = 5 * Math.cos(2 * Math.PI * (Date.now() % 77777) / 77777);
        const viewZ = 5 * Math.sin(2 * Math.PI * (Date.now() % 77777) / 77777);
        const viewMatrix = Mat4.create();
        Mat4.lookAt(viewMatrix, [viewX, 0.5, viewZ], [0, 0, 0], [0, -1, 0]);
        this.skybox.draw(this.projectionMatrix, viewMatrix);
        this.earth.draw(this.projectionMatrix, viewMatrix);
        break;
      default:
        break;
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}

// src/renderer.ts
class Renderer {
  static STRIDE = 4;
  gl;
  glProgram;
  attributes;
  uniforms;
  logMessage;
  program;
  vbo;
  count;
  palette;
  canvasWidth;
  canvasHeight;
  rows;
  cols;
  programRow;
  programCol;
  programRows;
  programCols;
  canvas;
  constructor(canvas, logMessage) {
    this.canvas = canvas;
    const gl = this.canvas.getContext("webgl2");
    if (!gl) {
      window.location.href = "./about.html";
      return;
    }
    this.gl = gl;
    this.rows = 1;
    this.cols = 1;
    this.programRow = 0;
    this.programCol = 0;
    this.programRows = 1;
    this.programCols = 1;
    this.logMessage = logMessage;
  }
  async init() {
    this.initializeProgram();
    this.initializeLocations();
    this.initializeVBO();
    await loadTextures(this.gl, this.logMessage);
    this.gl.uniform1i(this.uniforms.glyphAtlas, GLYPH_ATLAS_TEXTURE_INDEX);
    this.gl.uniform1i(this.uniforms.rows, this.rows);
    this.gl.uniform1i(this.uniforms.cols, this.cols);
    this.gl.uniform1i(this.uniforms.programRow, this.programRow);
    this.gl.uniform1i(this.uniforms.programCol, this.programCol);
    this.gl.uniform1i(this.uniforms.programRows, this.programRows);
    this.gl.uniform1i(this.uniforms.programCols, this.programCols);
    this.program = new ProgramManager(this.gl, this.logMessage);
    this.program.init();
    this.program.which = "earth";
  }
  initializeProgram() {
    const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!vertShader) {
      throw new Error("When creating vertex shader");
    }
    this.gl.shaderSource(vertShader, renderer_default);
    this.gl.compileShader(vertShader);
    if (!this.gl.getShaderParameter(vertShader, this.gl.COMPILE_STATUS)) {
      throw new Error("When compiling vertex shader: " + this.gl.getShaderInfoLog(vertShader));
    }
    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!fragShader) {
      throw new Error("When creating fragment shader");
    }
    this.gl.shaderSource(fragShader, renderer_default2);
    this.gl.compileShader(fragShader);
    if (!this.gl.getShaderParameter(fragShader, this.gl.COMPILE_STATUS)) {
      throw new Error("When compiling fragment shader: " + this.gl.getShaderInfoLog(fragShader));
    }
    const glProgram = this.gl.createProgram();
    if (!glProgram) {
      throw new Error("When creating GPU glProgram");
    }
    this.glProgram = glProgram;
    this.gl.attachShader(this.glProgram, vertShader);
    this.gl.attachShader(this.glProgram, fragShader);
    this.gl.linkProgram(this.glProgram);
    if (!this.gl.getProgramParameter(this.glProgram, this.gl.LINK_STATUS)) {
      throw new Error("When linking shader program: " + this.gl.getProgramInfoLog(this.glProgram));
    }
    this.gl.useProgram(this.glProgram);
  }
  initializeLocations() {
    this.attributes = {
      bgColour: this.gl.getAttribLocation(this.glProgram, "a_bgColour"),
      fgColour: this.gl.getAttribLocation(this.glProgram, "a_fgColour"),
      charCode: this.gl.getAttribLocation(this.glProgram, "a_charCode")
    };
    if (this.attributes.bgColour < 0 || this.attributes.fgColour < 0 || this.attributes.charCode < 0) {
      throw new Error("When getting attribute locations");
    }
    const rows = this.gl.getUniformLocation(this.glProgram, "u_rows");
    const cols = this.gl.getUniformLocation(this.glProgram, "u_cols");
    const programRow = this.gl.getUniformLocation(this.glProgram, "u_program_row");
    const programCol = this.gl.getUniformLocation(this.glProgram, "u_program_col");
    const programRows = this.gl.getUniformLocation(this.glProgram, "u_program_rows");
    const programCols = this.gl.getUniformLocation(this.glProgram, "u_program_cols");
    const glyphAtlas = this.gl.getUniformLocation(this.glProgram, "u_glyphAtlas");
    const program = this.gl.getUniformLocation(this.glProgram, "u_program");
    const palette = this.gl.getUniformLocation(this.glProgram, "u_palette");
    if (!rows || !cols || !programRow || !programCol || !programRows || !programCols || !glyphAtlas || !program || !palette) {
      throw new Error("When getting uniform locations");
    }
    this.gl.uniform1i(program, PROGRAM_TEXTURE_INDEX);
    this.uniforms = {
      rows,
      cols,
      programRow,
      programCol,
      programRows,
      programCols,
      glyphAtlas,
      program,
      palette
    };
  }
  initializeVBO() {
    this.vbo = this.gl.createBuffer();
    if (!this.vbo) {
      throw new Error("When creating vertex buffer");
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
  }
  async initializeTextures() {}
  enableAttributes() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.vertexAttribIPointer(this.attributes.bgColour, 1, this.gl.UNSIGNED_BYTE, Renderer.STRIDE, 0);
    this.gl.enableVertexAttribArray(this.attributes.bgColour);
    this.gl.vertexAttribIPointer(this.attributes.fgColour, 1, this.gl.UNSIGNED_BYTE, Renderer.STRIDE, 1);
    this.gl.enableVertexAttribArray(this.attributes.fgColour);
    this.gl.vertexAttribIPointer(this.attributes.charCode, 1, this.gl.UNSIGNED_SHORT, Renderer.STRIDE, 2);
    this.gl.enableVertexAttribArray(this.attributes.charCode);
  }
  resize(canvasWidth, canvasHeight, rows, cols, vrow, vcol, vrows, vcols) {
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.gl.useProgram(this.glProgram);
    if (rows !== this.rows || cols !== this.cols) {
      this.rows = rows;
      this.cols = cols;
      this.gl.uniform1i(this.uniforms.rows, rows);
      this.gl.uniform1i(this.uniforms.cols, cols);
      this.count = rows * cols * 6;
    }
    if (vrow !== this.programRow || vcol !== this.programCol || vrows !== this.programRows || vcols !== this.programCols) {
      this.programRow = vrow;
      this.programCol = vcol;
      this.programRows = vrows;
      this.programCols = vcols;
      this.gl.uniform1i(this.uniforms.programRow, vrow);
      this.gl.uniform1i(this.uniforms.programCol, vcol);
      this.gl.uniform1i(this.uniforms.programRows, vrows);
      this.gl.uniform1i(this.uniforms.programCols, vcols);
      this.program.resize(vcols, vrows);
    }
  }
  setData(data) {
    this.gl.useProgram(this.glProgram);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
  }
  setPalette(palette) {
    this.gl.useProgram(this.glProgram);
    this.gl.uniform3fv(this.uniforms.palette, palette);
    this.palette = palette;
  }
  draw() {
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      return;
    }
    if (this.programRows > 0 && this.programCols > 0) {
      this.program.draw();
    }
    this.gl.useProgram(this.glProgram);
    this.enableAttributes();
    const bg = 16 * 3;
    this.gl.clearColor(this.palette[bg], this.palette[bg + 1], this.palette[bg + 2], 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.activeTexture(this.gl.TEXTURE0 + GLYPH_ATLAS_TEXTURE_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, TEXTURES[GLYPH_ATLAS_TEXTURE]);
    this.gl.activeTexture(this.gl.TEXTURE0 + PROGRAM_TEXTURE_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.program.texture);
    this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
    this.gl.activeTexture(this.gl.TEXTURE0 + PROGRAM_TEXTURE_INDEX);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}

// src/terminal.ts
class Glyph {
  bgColour;
  fgColour;
  charCode;
  static WIDTH = 96;
  static HEIGHT = 211;
  static WTOH_RATIO = Glyph.HEIGHT / Glyph.WIDTH;
  static VERTICES = 6;
  static ASCII_START = 33;
  static ASCII_END = 126;
  static ASCII_COUNT = Glyph.ASCII_END - Glyph.ASCII_START + 1;
  static NORMAL_FONT = 0;
  static BOLD_FONT = 1 * Glyph.ASCII_COUNT;
  static ITALIC_FONT = 2 * Glyph.ASCII_COUNT;
  static ITALIC_BOLD_FONT = 3 * Glyph.ASCII_COUNT;
  bgColour;
  fgColour;
  charCode;
  constructor(bgColour, fgColour, charCode) {
    this.bgColour = bgColour;
    this.fgColour = fgColour;
    this.charCode = charCode;
    this.bgColour = bgColour;
    this.fgColour = fgColour;
    this.charCode = charCode;
  }
  data() {
    const packed = this.bgColour & 255 | (this.fgColour & 255) << 8 | (this.charCode & 65535) << 16;
    return new Uint32Array(Glyph.VERTICES).fill(packed);
  }
  static fromData(data) {
    const packed = data[0];
    return new Glyph(packed & 255, packed >> 8 & 255, packed >> 16 & 65535);
  }
}

class Terminal {
  static CELL_SIZE = 8;
  static BYTES_PER_GLYPH = Glyph.VERTICES * Renderer.STRIDE;
  static UINT32_PER_GLYPH = Glyph.VERTICES;
  renderer;
  mouseX;
  mouseY;
  data;
  cols;
  rows;
  cellWidth;
  cellHeight;
  programRow;
  programCol;
  programRows;
  programCols;
  mouseCol;
  mouseRow;
  mouseDownRow;
  mouseDownCol;
  mouseClick;
  mouseDown;
  mouseOwner = "";
  detailText = "";
  constructor(canvas, logMessage) {
    this.renderer = new Renderer(canvas, logMessage);
  }
  async init() {
    await this.renderer.init();
    this.programRow = 0;
    this.programCol = 0;
    this.programRows = 0;
    this.programCols = 0;
    this.resize(0, 0, 1, 1);
    window.addEventListener("resize", () => {
      this.resize(this.programRow, this.programCol, this.programRows, this.programCols);
    });
    window.addEventListener("pointermove", (e) => {
      const dpr = window.devicePixelRatio || 1;
      this.mouseX = dpr * e.clientX;
      this.mouseY = dpr * e.clientY;
      this.mouseRow = Math.floor(this.mouseY / this.cellHeight);
      this.mouseCol = Math.floor(this.mouseX / this.cellWidth);
    });
    this.renderer.canvas.addEventListener("pointerdown", (e) => {
      const dpr = window.devicePixelRatio || 1;
      this.mouseX = dpr * e.clientX;
      this.mouseY = dpr * e.clientY;
      const row = Math.floor(this.mouseY / this.cellHeight);
      const col = Math.floor(this.mouseX / this.cellWidth);
      this.mouseRow = row;
      this.mouseCol = col;
      this.mouseDown = true;
      this.mouseDownRow = row;
      this.mouseDownCol = col;
      e.currentTarget.setPointerCapture(e.pointerId);
    });
    this.renderer.canvas.addEventListener("pointerup", () => {
      this.mouseDown = false;
      this.mouseClick = true;
    });
    this.renderer.canvas.addEventListener("pointercancel", () => {
      this.mouseDown = false;
    });
    this.renderer.canvas.addEventListener("pointerleave", () => {
      this.mouseDown = false;
    });
    this.mouseRow = 0;
    this.mouseCol = 0;
    this.mouseDownRow = 0;
    this.mouseDownCol = 0;
    this.mouseClick = false;
    this.mouseDown = false;
  }
  resize(vrow, vcol, vrows, vcols) {
    if (vrow !== this.programRow || vcol !== this.programCol || vrows !== this.programRows || vcols !== this.programCols) {
      this.programRow = vrow;
      this.programCol = vcol;
      this.programRows = vrows;
      this.programCols = vcols;
    }
    const dpr = window.devicePixelRatio || 1;
    this.cellWidth = Terminal.CELL_SIZE * dpr;
    this.cellHeight = Glyph.WTOH_RATIO * this.cellWidth;
    const canvasWidth = Math.max(1, this.renderer.canvas.clientWidth * dpr);
    const canvasHeight = Math.max(1, this.renderer.canvas.clientHeight * dpr);
    const _cols = Math.floor(canvasWidth / this.cellWidth);
    const _rows = Math.floor(canvasHeight / this.cellHeight);
    if (this.cols !== _cols || this.rows !== _rows) {
      this.cols = _cols;
      this.rows = _rows;
      const count = this.rows * this.cols * Terminal.UINT32_PER_GLYPH;
      this.data = new Uint32Array(count);
    }
    this.cellWidth = canvasWidth / this.cols;
    this.cellHeight = canvasHeight / this.rows;
    if (this.programRows === 0)
      this.programRows = this.rows;
    if (this.programCols === 0)
      this.programCols = this.cols;
    this.renderer.resize(canvasWidth, canvasHeight, this.rows, this.cols, this.programRow, this.programCol, this.programRows, this.programCols);
  }
  clear() {
    this.data.fill(0);
    document.body.className = "";
  }
  drawText(text, row, col, backColour, fgColour, bgColour = 0, shadowColour = 0, shadow = false, fontOffset = Glyph.NORMAL_FONT) {
    row = Math.round(row);
    col = Math.round(col);
    const textLength = text.length;
    if (shadow) {
      if (text.includes(`
`) || text.includes("\t")) {
        shadow = false;
      } else {
        const shadow2 = "▀".repeat(textLength);
        text = text + `▄
 ` + shadow2;
      }
    }
    let r = row;
    let c = col;
    let i = 0;
    while (r < this.rows && i < text.length) {
      const charCode = text.charCodeAt(i);
      let bg = backColour;
      let fg = fgColour;
      if (charCode === 10) {
        c = col;
        r++;
        i++;
        continue;
      }
      if (charCode === 9) {
        c += 4;
        i++;
        continue;
      }
      if (shadow && (i >= textLength || r > row)) {
        bg = bgColour;
        fg = shadowColour;
      }
      if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
        const glyphIndex = r * this.cols + c;
        const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;
        const off = charCode < 33 ? 0 : fontOffset;
        const glyph = new Glyph(bg, fg, charCode + off);
        this.data.set(glyph.data(), uint32Index);
      }
      c++;
      i++;
    }
  }
  setPalette(palette) {
    this.renderer.setPalette(palette);
  }
  drawBox(row, col, h, w, bgColour, backColour, borderColour, shadowColour, shadow) {
    const rStart = Math.max(0, row);
    const rEnd = Math.min(this.rows - 1, row + h);
    const cStart = Math.max(0, col);
    const cEnd = Math.min(this.cols - 1, col + w);
    for (let r = rStart;r <= rEnd; r++) {
      for (let c = cStart;c <= cEnd; c++) {
        const shadowRegion = r === row + h || c === col + w;
        const shadowGap = r === row + h && c === col;
        if (!shadow && shadowRegion) {
          continue;
        }
        const glyphIndex = r * this.cols + c;
        const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;
        let charCode = 1;
        let bg = backColour;
        let fg = borderColour;
        if (shadow && shadowRegion) {
          if (!shadowGap) {
            charCode = r == row + h ? "▀".codePointAt(0) : c === col + w && r === row ? "▄".codePointAt(0) : "█".codePointAt(0);
            bg = bgColour;
            fg = shadowColour;
          } else {
            charCode = "█".codePointAt(0);
            bg = shadowColour;
            fg = bgColour;
          }
        } else {
          const edgeChars = "┐┌┘└│─";
          if (r === row && c === col)
            charCode = edgeChars.codePointAt(1);
          else if (r === row && c === col + w - 1)
            charCode = edgeChars.codePointAt(0);
          else if (r === row + h - 1 && c === col)
            charCode = edgeChars.codePointAt(3);
          else if (r === row + h - 1 && c === col + w - 1)
            charCode = edgeChars.codePointAt(2);
          else if (r === row || r === row + h - 1)
            charCode = edgeChars.codePointAt(5);
          else if (c === col || c === col + w - 1)
            charCode = edgeChars.codePointAt(4);
        }
        const glyph = new Glyph(bg, fg, charCode);
        this.data.set(glyph.data(), uint32Index);
      }
    }
  }
  mouseAt(row, col, rows, cols) {
    return this.mouseRow >= row && this.mouseRow < row + rows && this.mouseCol >= col && this.mouseCol < col + cols;
  }
  mouseDownAt(row, col, rows, cols) {
    return this.mouseDownRow >= row && this.mouseDownRow < row + rows && this.mouseDownCol >= col && this.mouseDownCol < col + cols;
  }
  draw() {
    if (this.mouseCol !== undefined && this.mouseRow !== undefined) {
      if (this.mouseCol < 0) {
        this.mouseCol = 0;
      } else if (this.mouseCol >= this.cols) {
        this.mouseCol = this.cols - 1;
      }
      if (this.mouseRow < 0) {
        this.mouseRow = 0;
      } else if (this.mouseRow >= this.rows) {
        this.mouseRow = this.rows - 1;
      }
      const glyphIndex = this.mouseRow * this.cols + this.mouseCol;
      const uint32Index = glyphIndex * Terminal.UINT32_PER_GLYPH;
      const cellData = this.data.subarray(uint32Index, uint32Index + Terminal.UINT32_PER_GLYPH);
      const glyph = Glyph.fromData(cellData);
      if (this.mouseDown) {
        glyph.bgColour = 1;
        glyph.fgColour = 13;
      } else {
        const bgColour = glyph.bgColour;
        glyph.bgColour = glyph.fgColour;
        glyph.fgColour = bgColour;
      }
      if (glyph.bgColour === glyph.fgColour) {
        if (glyph.bgColour < 15) {
          glyph.bgColour = 15;
        } else {
          glyph.bgColour = 0;
        }
      }
      this.data.set(glyph.data(), uint32Index);
    }
    this.mouseClick = false;
    if (this.detailText.length > 0) {
      this.drawText(this.detailText, this.rows - 1, 0, 0, 15);
      this.detailText = "";
    }
    this.renderer.setData(this.data);
    this.renderer.draw();
  }
}

// src/components/divider.ts
class Divider {
  terminal;
  frac;
  interactive;
  mouseWasDown;
  dragging;
  hovering;
  static HORIZONTAL = 0;
  static VERTICAL = 1;
  static INTERSECT_NONE = 0;
  static INTERSECT_RIGHT = 2;
  static INTERSECT_LEFT = 1;
  static INTERSECT_TOP = 3;
  static INTERSECT_BOTTOM = 4;
  trows;
  lcols;
  constructor(terminal, frac, interactive) {
    this.terminal = terminal;
    this.frac = frac;
    this.interactive = interactive;
    this.mouseWasDown = false;
    this.dragging = false;
  }
  setFrac(frac) {
    this.frac = frac;
  }
  draw(direction, row, col, rows, cols, minRow = 0, minCol = 0, intRow = 0, intCol = 0, intersect = Divider.INTERSECT_NONE) {
    if (intersect !== Divider.INTERSECT_NONE && (intRow < row || intRow >= row + rows || intCol < col || intCol >= col + cols)) {
      intersect = Divider.INTERSECT_NONE;
    }
    if (row < 0 || col < 0 || rows < 2 || cols < 2 || row + rows > this.terminal.rows || col + cols > this.terminal.cols) {
      return;
    }
    let drawn_row, drawn_col, drawn_rows, drawn_cols;
    if (direction === Divider.HORIZONTAL) {
      drawn_row = row + Math.floor((rows - 1) * this.frac);
      drawn_col = col;
      drawn_rows = 1;
      drawn_cols = cols;
      intRow = drawn_row;
      if (drawn_row < minRow) {
        drawn_row = minRow;
        intRow = minRow;
      }
      this.trows = drawn_row - row;
      this.lcols = cols;
      const str = "─".repeat(cols);
      this.terminal.drawText(str, drawn_row, drawn_col, 16, this.hovering ? 8 : 0);
      if (this.dragging) {
        let mouseRow = Math.max(Math.min(this.terminal.mouseRow, row + rows - 1), row) - row;
        mouseRow = Math.max(mouseRow, minRow);
        this.frac = mouseRow / (rows - 1);
      }
    } else {
      drawn_row = row;
      drawn_col = col + Math.floor((cols - 1) * this.frac);
      drawn_rows = rows;
      drawn_cols = 1;
      intCol = drawn_col;
      if (drawn_col < minCol) {
        drawn_col = minCol;
        intCol = minCol;
      }
      this.trows = rows;
      this.lcols = drawn_col - col;
      for (let i = 0;i < rows; i++) {
        this.terminal.drawText("│", drawn_row + i, drawn_col, 16, this.hovering ? 8 : 0);
      }
      if (this.dragging) {
        let mouseCol = Math.max(Math.min(this.terminal.mouseCol, col + cols - 1), col) - col;
        mouseCol = Math.max(mouseCol, minCol);
        this.frac = mouseCol / (cols - 1);
      }
    }
    if (intersect !== Divider.INTERSECT_NONE) {
      let ch;
      switch (intersect) {
        case Divider.INTERSECT_RIGHT:
          ch = "├";
          break;
        case Divider.INTERSECT_LEFT:
          ch = "┤";
          break;
        case Divider.INTERSECT_TOP:
          ch = "┴";
          break;
        case Divider.INTERSECT_BOTTOM:
          ch = "┬";
          break;
      }
      this.terminal.drawText(ch, intRow, intCol, 16, this.hovering ? 8 : 0);
    }
    if (!this.interactive) {
      return;
    }
    const mouseInside = this.terminal.mouseAt(drawn_row, drawn_col, drawn_rows, drawn_cols);
    if (!this.terminal.mouseDown) {
      if (this.dragging) {
        this.terminal.mouseOwner = "";
      }
      this.mouseWasDown = false;
      this.dragging = false;
      if (mouseInside) {
        document.body.className = "grab";
        this.hovering = true;
      } else {
        this.hovering = false;
      }
    } else if (!this.mouseWasDown) {
      if (mouseInside && this.terminal.mouseOwner === "") {
        this.dragging = true;
        this.terminal.mouseOwner = "divider";
      } else {
        this.dragging = false;
      }
      this.mouseWasDown = true;
    } else if (this.dragging) {
      document.body.className = "grabbing";
      this.hovering = false;
    }
  }
}

// src/components/scrollable.ts
class Scrollable {
  terminal;
  wheel_px = 0;
  wheel_rows = 0;
  wheel_mouse_row = 0;
  wheel_mouse_col = 0;
  velocity = 0;
  last_mouse_row = 0;
  is_dragging = false;
  drag_start_offset = 0;
  drag_start_mouse_row = 0;
  row_offset = 0;
  constructor(terminal) {
    this.terminal = terminal;
    this.terminal.renderer.canvas.addEventListener("wheel", (event) => {
      switch (event.deltaMode) {
        case 0:
          this.wheel_px += event.deltaY;
          if (Math.abs(this.wheel_px) >= this.terminal.cellHeight) {
            this.wheel_rows += Math.floor(this.wheel_px / this.terminal.cellHeight);
            this.wheel_px %= this.terminal.cellHeight;
          }
          break;
        case 1:
          this.wheel_rows += event.deltaY;
          break;
        case 2:
          this.wheel_rows += event.deltaY * this.terminal.rows;
          break;
      }
      this.wheel_mouse_row = this.terminal.mouseRow;
      this.wheel_mouse_col = this.terminal.mouseCol;
    }, { passive: false });
  }
  draw(row, col, rows, cols, inner_rows) {
    if (row < 0 || col < 0 || rows <= 0 || cols <= 0) {
      return;
    }
    const max_offset = Math.max(0, inner_rows - rows);
    if (!this.terminal.mouseDown && Math.abs(this.velocity) > 0.01) {
      this.row_offset -= this.velocity;
      this.velocity *= 0.95;
    }
    if (this.wheel_mouse_row > row && this.wheel_mouse_row < row + rows && this.wheel_mouse_col > col && this.wheel_mouse_col < col + cols && this.wheel_rows !== 0) {
      this.row_offset += this.wheel_rows;
      this.wheel_rows = 0;
    }
    if (this.terminal.mouseAt(row, col, rows, cols) && this.terminal.mouseDownAt(row, col, rows, cols)) {
      if (this.terminal.mouseOwner === "" && this.terminal.mouseDown) {
        this.terminal.mouseOwner = "scrollable";
        this.is_dragging = true;
        this.drag_start_offset = this.row_offset;
        this.drag_start_mouse_row = this.terminal.mouseRow;
        this.last_mouse_row = this.terminal.mouseRow;
        this.velocity = 0;
      }
      if (this.terminal.mouseOwner === "scrollable") {
        if (this.terminal.mouseDown) {
          const current_mouse_row = this.terminal.mouseRow;
          const delta = current_mouse_row - this.last_mouse_row;
          this.velocity = Math.max(-2, Math.min(2, delta));
          this.last_mouse_row = current_mouse_row;
          const drag_delta = current_mouse_row - this.drag_start_mouse_row;
          this.row_offset = this.drag_start_offset - drag_delta;
        } else {
          this.is_dragging = false;
          this.terminal.mouseOwner = "";
        }
      }
    } else if (this.terminal.mouseOwner === "scrollable") {
      this.is_dragging = false;
      this.terminal.mouseOwner = "";
    }
    this.row_offset = Math.max(0, Math.min(this.row_offset, max_offset));
    if (this.row_offset > 0) {
      const hint = "(Scroll Up)";
      const leftCols = Math.ceil((cols - hint.length) / 2);
      const rightCols = cols - hint.length - leftCols;
      const text = " ".repeat(leftCols) + hint + " ".repeat(rightCols);
      this.terminal.drawText(text, row, col, 17, 16);
    }
    if (inner_rows - this.row_offset > rows) {
      const hint = "(Scroll Down)";
      const leftCols = Math.ceil((cols - hint.length) / 2);
      const rightCols = cols - hint.length - leftCols;
      const text = " ".repeat(leftCols) + hint + " ".repeat(rightCols);
      this.terminal.drawText(text, row + rows - 1, col, 17, 16);
    }
  }
}

// node_modules/devlop/lib/development.js
var codesWarned = new Set;

class AssertionError extends Error {
  name = "Assertion";
  code = "ERR_ASSERTION";
  constructor(message, actual, expected, operator, generated) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.actual = actual;
    this.expected = expected;
    this.generated = generated;
    this.operator = operator;
  }
}
function ok(value, message) {
  assert(Boolean(value), false, true, "ok", "Expected value to be truthy", message);
}
function assert(bool, actual, expected, operator, defaultMessage, userMessage) {
  if (!bool) {
    throw userMessage instanceof Error ? userMessage : new AssertionError(userMessage || defaultMessage, actual, expected, operator, !userMessage);
  }
}

// node_modules/mdast-util-to-string/lib/index.js
var emptyOptions = {};
function toString(value, options) {
  const settings = options || emptyOptions;
  const includeImageAlt = typeof settings.includeImageAlt === "boolean" ? settings.includeImageAlt : true;
  const includeHtml = typeof settings.includeHtml === "boolean" ? settings.includeHtml : true;
  return one(value, includeImageAlt, includeHtml);
}
function one(value, includeImageAlt, includeHtml) {
  if (node(value)) {
    if ("value" in value) {
      return value.type === "html" && !includeHtml ? "" : value.value;
    }
    if (includeImageAlt && "alt" in value && value.alt) {
      return value.alt;
    }
    if ("children" in value) {
      return all(value.children, includeImageAlt, includeHtml);
    }
  }
  if (Array.isArray(value)) {
    return all(value, includeImageAlt, includeHtml);
  }
  return "";
}
function all(values, includeImageAlt, includeHtml) {
  const result = [];
  let index = -1;
  while (++index < values.length) {
    result[index] = one(values[index], includeImageAlt, includeHtml);
  }
  return result.join("");
}
function node(value) {
  return Boolean(value && typeof value === "object");
}
// node_modules/decode-named-character-reference/index.dom.js
var element = document.createElement("i");
function decodeNamedCharacterReference(value) {
  const characterReference = "&" + value + ";";
  element.innerHTML = characterReference;
  const character = element.textContent;
  if (character.charCodeAt(character.length - 1) === 59 && value !== "semi") {
    return false;
  }
  return character === characterReference ? false : character;
}

// node_modules/micromark-util-symbol/lib/codes.js
var codes = {
  carriageReturn: -5,
  lineFeed: -4,
  carriageReturnLineFeed: -3,
  horizontalTab: -2,
  virtualSpace: -1,
  eof: null,
  nul: 0,
  soh: 1,
  stx: 2,
  etx: 3,
  eot: 4,
  enq: 5,
  ack: 6,
  bel: 7,
  bs: 8,
  ht: 9,
  lf: 10,
  vt: 11,
  ff: 12,
  cr: 13,
  so: 14,
  si: 15,
  dle: 16,
  dc1: 17,
  dc2: 18,
  dc3: 19,
  dc4: 20,
  nak: 21,
  syn: 22,
  etb: 23,
  can: 24,
  em: 25,
  sub: 26,
  esc: 27,
  fs: 28,
  gs: 29,
  rs: 30,
  us: 31,
  space: 32,
  exclamationMark: 33,
  quotationMark: 34,
  numberSign: 35,
  dollarSign: 36,
  percentSign: 37,
  ampersand: 38,
  apostrophe: 39,
  leftParenthesis: 40,
  rightParenthesis: 41,
  asterisk: 42,
  plusSign: 43,
  comma: 44,
  dash: 45,
  dot: 46,
  slash: 47,
  digit0: 48,
  digit1: 49,
  digit2: 50,
  digit3: 51,
  digit4: 52,
  digit5: 53,
  digit6: 54,
  digit7: 55,
  digit8: 56,
  digit9: 57,
  colon: 58,
  semicolon: 59,
  lessThan: 60,
  equalsTo: 61,
  greaterThan: 62,
  questionMark: 63,
  atSign: 64,
  uppercaseA: 65,
  uppercaseB: 66,
  uppercaseC: 67,
  uppercaseD: 68,
  uppercaseE: 69,
  uppercaseF: 70,
  uppercaseG: 71,
  uppercaseH: 72,
  uppercaseI: 73,
  uppercaseJ: 74,
  uppercaseK: 75,
  uppercaseL: 76,
  uppercaseM: 77,
  uppercaseN: 78,
  uppercaseO: 79,
  uppercaseP: 80,
  uppercaseQ: 81,
  uppercaseR: 82,
  uppercaseS: 83,
  uppercaseT: 84,
  uppercaseU: 85,
  uppercaseV: 86,
  uppercaseW: 87,
  uppercaseX: 88,
  uppercaseY: 89,
  uppercaseZ: 90,
  leftSquareBracket: 91,
  backslash: 92,
  rightSquareBracket: 93,
  caret: 94,
  underscore: 95,
  graveAccent: 96,
  lowercaseA: 97,
  lowercaseB: 98,
  lowercaseC: 99,
  lowercaseD: 100,
  lowercaseE: 101,
  lowercaseF: 102,
  lowercaseG: 103,
  lowercaseH: 104,
  lowercaseI: 105,
  lowercaseJ: 106,
  lowercaseK: 107,
  lowercaseL: 108,
  lowercaseM: 109,
  lowercaseN: 110,
  lowercaseO: 111,
  lowercaseP: 112,
  lowercaseQ: 113,
  lowercaseR: 114,
  lowercaseS: 115,
  lowercaseT: 116,
  lowercaseU: 117,
  lowercaseV: 118,
  lowercaseW: 119,
  lowercaseX: 120,
  lowercaseY: 121,
  lowercaseZ: 122,
  leftCurlyBrace: 123,
  verticalBar: 124,
  rightCurlyBrace: 125,
  tilde: 126,
  del: 127,
  byteOrderMarker: 65279,
  replacementCharacter: 65533
};
// node_modules/micromark-util-symbol/lib/constants.js
var constants = {
  attentionSideAfter: 2,
  attentionSideBefore: 1,
  atxHeadingOpeningFenceSizeMax: 6,
  autolinkDomainSizeMax: 63,
  autolinkSchemeSizeMax: 32,
  cdataOpeningString: "CDATA[",
  characterGroupPunctuation: 2,
  characterGroupWhitespace: 1,
  characterReferenceDecimalSizeMax: 7,
  characterReferenceHexadecimalSizeMax: 6,
  characterReferenceNamedSizeMax: 31,
  codeFencedSequenceSizeMin: 3,
  contentTypeContent: "content",
  contentTypeDocument: "document",
  contentTypeFlow: "flow",
  contentTypeString: "string",
  contentTypeText: "text",
  hardBreakPrefixSizeMin: 2,
  htmlBasic: 6,
  htmlCdata: 5,
  htmlComment: 2,
  htmlComplete: 7,
  htmlDeclaration: 4,
  htmlInstruction: 3,
  htmlRawSizeMax: 8,
  htmlRaw: 1,
  linkResourceDestinationBalanceMax: 32,
  linkReferenceSizeMax: 999,
  listItemValueSizeMax: 10,
  numericBaseDecimal: 10,
  numericBaseHexadecimal: 16,
  tabSize: 4,
  thematicBreakMarkerCountMin: 3,
  v8MaxSafeChunkSize: 1e4
};
// node_modules/micromark-util-symbol/lib/types.js
var types = {
  data: "data",
  whitespace: "whitespace",
  lineEnding: "lineEnding",
  lineEndingBlank: "lineEndingBlank",
  linePrefix: "linePrefix",
  lineSuffix: "lineSuffix",
  atxHeading: "atxHeading",
  atxHeadingSequence: "atxHeadingSequence",
  atxHeadingText: "atxHeadingText",
  autolink: "autolink",
  autolinkEmail: "autolinkEmail",
  autolinkMarker: "autolinkMarker",
  autolinkProtocol: "autolinkProtocol",
  characterEscape: "characterEscape",
  characterEscapeValue: "characterEscapeValue",
  characterReference: "characterReference",
  characterReferenceMarker: "characterReferenceMarker",
  characterReferenceMarkerNumeric: "characterReferenceMarkerNumeric",
  characterReferenceMarkerHexadecimal: "characterReferenceMarkerHexadecimal",
  characterReferenceValue: "characterReferenceValue",
  codeFenced: "codeFenced",
  codeFencedFence: "codeFencedFence",
  codeFencedFenceSequence: "codeFencedFenceSequence",
  codeFencedFenceInfo: "codeFencedFenceInfo",
  codeFencedFenceMeta: "codeFencedFenceMeta",
  codeFlowValue: "codeFlowValue",
  codeIndented: "codeIndented",
  codeText: "codeText",
  codeTextData: "codeTextData",
  codeTextPadding: "codeTextPadding",
  codeTextSequence: "codeTextSequence",
  content: "content",
  definition: "definition",
  definitionDestination: "definitionDestination",
  definitionDestinationLiteral: "definitionDestinationLiteral",
  definitionDestinationLiteralMarker: "definitionDestinationLiteralMarker",
  definitionDestinationRaw: "definitionDestinationRaw",
  definitionDestinationString: "definitionDestinationString",
  definitionLabel: "definitionLabel",
  definitionLabelMarker: "definitionLabelMarker",
  definitionLabelString: "definitionLabelString",
  definitionMarker: "definitionMarker",
  definitionTitle: "definitionTitle",
  definitionTitleMarker: "definitionTitleMarker",
  definitionTitleString: "definitionTitleString",
  emphasis: "emphasis",
  emphasisSequence: "emphasisSequence",
  emphasisText: "emphasisText",
  escapeMarker: "escapeMarker",
  hardBreakEscape: "hardBreakEscape",
  hardBreakTrailing: "hardBreakTrailing",
  htmlFlow: "htmlFlow",
  htmlFlowData: "htmlFlowData",
  htmlText: "htmlText",
  htmlTextData: "htmlTextData",
  image: "image",
  label: "label",
  labelText: "labelText",
  labelLink: "labelLink",
  labelImage: "labelImage",
  labelMarker: "labelMarker",
  labelImageMarker: "labelImageMarker",
  labelEnd: "labelEnd",
  link: "link",
  paragraph: "paragraph",
  reference: "reference",
  referenceMarker: "referenceMarker",
  referenceString: "referenceString",
  resource: "resource",
  resourceDestination: "resourceDestination",
  resourceDestinationLiteral: "resourceDestinationLiteral",
  resourceDestinationLiteralMarker: "resourceDestinationLiteralMarker",
  resourceDestinationRaw: "resourceDestinationRaw",
  resourceDestinationString: "resourceDestinationString",
  resourceMarker: "resourceMarker",
  resourceTitle: "resourceTitle",
  resourceTitleMarker: "resourceTitleMarker",
  resourceTitleString: "resourceTitleString",
  setextHeading: "setextHeading",
  setextHeadingText: "setextHeadingText",
  setextHeadingLine: "setextHeadingLine",
  setextHeadingLineSequence: "setextHeadingLineSequence",
  strong: "strong",
  strongSequence: "strongSequence",
  strongText: "strongText",
  thematicBreak: "thematicBreak",
  thematicBreakSequence: "thematicBreakSequence",
  blockQuote: "blockQuote",
  blockQuotePrefix: "blockQuotePrefix",
  blockQuoteMarker: "blockQuoteMarker",
  blockQuotePrefixWhitespace: "blockQuotePrefixWhitespace",
  listOrdered: "listOrdered",
  listUnordered: "listUnordered",
  listItemIndent: "listItemIndent",
  listItemMarker: "listItemMarker",
  listItemPrefix: "listItemPrefix",
  listItemPrefixWhitespace: "listItemPrefixWhitespace",
  listItemValue: "listItemValue",
  chunkDocument: "chunkDocument",
  chunkContent: "chunkContent",
  chunkFlow: "chunkFlow",
  chunkText: "chunkText",
  chunkString: "chunkString"
};
// node_modules/micromark-util-symbol/lib/values.js
var values = {
  ht: "\t",
  lf: `
`,
  cr: "\r",
  space: " ",
  exclamationMark: "!",
  quotationMark: '"',
  numberSign: "#",
  dollarSign: "$",
  percentSign: "%",
  ampersand: "&",
  apostrophe: "'",
  leftParenthesis: "(",
  rightParenthesis: ")",
  asterisk: "*",
  plusSign: "+",
  comma: ",",
  dash: "-",
  dot: ".",
  slash: "/",
  digit0: "0",
  digit1: "1",
  digit2: "2",
  digit3: "3",
  digit4: "4",
  digit5: "5",
  digit6: "6",
  digit7: "7",
  digit8: "8",
  digit9: "9",
  colon: ":",
  semicolon: ";",
  lessThan: "<",
  equalsTo: "=",
  greaterThan: ">",
  questionMark: "?",
  atSign: "@",
  uppercaseA: "A",
  uppercaseB: "B",
  uppercaseC: "C",
  uppercaseD: "D",
  uppercaseE: "E",
  uppercaseF: "F",
  uppercaseG: "G",
  uppercaseH: "H",
  uppercaseI: "I",
  uppercaseJ: "J",
  uppercaseK: "K",
  uppercaseL: "L",
  uppercaseM: "M",
  uppercaseN: "N",
  uppercaseO: "O",
  uppercaseP: "P",
  uppercaseQ: "Q",
  uppercaseR: "R",
  uppercaseS: "S",
  uppercaseT: "T",
  uppercaseU: "U",
  uppercaseV: "V",
  uppercaseW: "W",
  uppercaseX: "X",
  uppercaseY: "Y",
  uppercaseZ: "Z",
  leftSquareBracket: "[",
  backslash: "\\",
  rightSquareBracket: "]",
  caret: "^",
  underscore: "_",
  graveAccent: "`",
  lowercaseA: "a",
  lowercaseB: "b",
  lowercaseC: "c",
  lowercaseD: "d",
  lowercaseE: "e",
  lowercaseF: "f",
  lowercaseG: "g",
  lowercaseH: "h",
  lowercaseI: "i",
  lowercaseJ: "j",
  lowercaseK: "k",
  lowercaseL: "l",
  lowercaseM: "m",
  lowercaseN: "n",
  lowercaseO: "o",
  lowercaseP: "p",
  lowercaseQ: "q",
  lowercaseR: "r",
  lowercaseS: "s",
  lowercaseT: "t",
  lowercaseU: "u",
  lowercaseV: "v",
  lowercaseW: "w",
  lowercaseX: "x",
  lowercaseY: "y",
  lowercaseZ: "z",
  leftCurlyBrace: "{",
  verticalBar: "|",
  rightCurlyBrace: "}",
  tilde: "~",
  replacementCharacter: "�"
};
// node_modules/micromark-util-chunked/dev/index.js
function splice(list, start, remove, items) {
  const end = list.length;
  let chunkStart = 0;
  let parameters;
  if (start < 0) {
    start = -start > end ? 0 : end + start;
  } else {
    start = start > end ? end : start;
  }
  remove = remove > 0 ? remove : 0;
  if (items.length < constants.v8MaxSafeChunkSize) {
    parameters = Array.from(items);
    parameters.unshift(start, remove);
    list.splice(...parameters);
  } else {
    if (remove)
      list.splice(start, remove);
    while (chunkStart < items.length) {
      parameters = items.slice(chunkStart, chunkStart + constants.v8MaxSafeChunkSize);
      parameters.unshift(start, 0);
      list.splice(...parameters);
      chunkStart += constants.v8MaxSafeChunkSize;
      start += constants.v8MaxSafeChunkSize;
    }
  }
}
function push(list, items) {
  if (list.length > 0) {
    splice(list, list.length, 0, items);
    return list;
  }
  return items;
}

// node_modules/micromark-util-combine-extensions/index.js
var hasOwnProperty = {}.hasOwnProperty;
function combineExtensions(extensions) {
  const all2 = {};
  let index = -1;
  while (++index < extensions.length) {
    syntaxExtension(all2, extensions[index]);
  }
  return all2;
}
function syntaxExtension(all2, extension) {
  let hook;
  for (hook in extension) {
    const maybe = hasOwnProperty.call(all2, hook) ? all2[hook] : undefined;
    const left = maybe || (all2[hook] = {});
    const right = extension[hook];
    let code;
    if (right) {
      for (code in right) {
        if (!hasOwnProperty.call(left, code))
          left[code] = [];
        const value = right[code];
        constructs(left[code], Array.isArray(value) ? value : value ? [value] : []);
      }
    }
  }
}
function constructs(existing, list) {
  let index = -1;
  const before = [];
  while (++index < list.length) {
    (list[index].add === "after" ? existing : before).push(list[index]);
  }
  splice(existing, 0, 0, before);
}

// node_modules/micromark-util-decode-numeric-character-reference/dev/index.js
function decodeNumericCharacterReference(value, base) {
  const code = Number.parseInt(value, base);
  if (code < codes.ht || code === codes.vt || code > codes.cr && code < codes.space || code > codes.tilde && code < 160 || code > 55295 && code < 57344 || code > 64975 && code < 65008 || (code & 65535) === 65535 || (code & 65535) === 65534 || code > 1114111) {
    return values.replacementCharacter;
  }
  return String.fromCodePoint(code);
}

// node_modules/micromark-util-normalize-identifier/dev/index.js
function normalizeIdentifier(value) {
  return value.replace(/[\t\n\r ]+/g, values.space).replace(/^ | $/g, "").toLowerCase().toUpperCase();
}

// node_modules/micromark-util-character/dev/index.js
var asciiAlpha = regexCheck(/[A-Za-z]/);
var asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
var asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);
function asciiControl(code) {
  return code !== null && (code < codes.space || code === codes.del);
}
var asciiDigit = regexCheck(/\d/);
var asciiHexDigit = regexCheck(/[\dA-Fa-f]/);
var asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);
function markdownLineEnding(code) {
  return code !== null && code < codes.horizontalTab;
}
function markdownLineEndingOrSpace(code) {
  return code !== null && (code < codes.nul || code === codes.space);
}
function markdownSpace(code) {
  return code === codes.horizontalTab || code === codes.virtualSpace || code === codes.space;
}
var unicodePunctuation = regexCheck(/\p{P}|\p{S}/u);
var unicodeWhitespace = regexCheck(/\s/);
function regexCheck(regex) {
  return check;
  function check(code) {
    return code !== null && code > -1 && regex.test(String.fromCharCode(code));
  }
}

// node_modules/micromark-factory-space/dev/index.js
function factorySpace(effects, ok2, type, max) {
  const limit = max ? max - 1 : Number.POSITIVE_INFINITY;
  let size = 0;
  return start;
  function start(code) {
    if (markdownSpace(code)) {
      effects.enter(type);
      return prefix(code);
    }
    return ok2(code);
  }
  function prefix(code) {
    if (markdownSpace(code) && size++ < limit) {
      effects.consume(code);
      return prefix;
    }
    effects.exit(type);
    return ok2(code);
  }
}

// node_modules/micromark/dev/lib/initialize/content.js
var content = { tokenize: initializeContent };
function initializeContent(effects) {
  const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
  let previous;
  return contentStart;
  function afterContentStartConstruct(code) {
    ok(code === codes.eof || markdownLineEnding(code), "expected eol or eof");
    if (code === codes.eof) {
      effects.consume(code);
      return;
    }
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return factorySpace(effects, contentStart, types.linePrefix);
  }
  function paragraphInitial(code) {
    ok(code !== codes.eof && !markdownLineEnding(code), "expected anything other than a line ending or EOF");
    effects.enter(types.paragraph);
    return lineStart(code);
  }
  function lineStart(code) {
    const token = effects.enter(types.chunkText, {
      contentType: constants.contentTypeText,
      previous
    });
    if (previous) {
      previous.next = token;
    }
    previous = token;
    return data(code);
  }
  function data(code) {
    if (code === codes.eof) {
      effects.exit(types.chunkText);
      effects.exit(types.paragraph);
      effects.consume(code);
      return;
    }
    if (markdownLineEnding(code)) {
      effects.consume(code);
      effects.exit(types.chunkText);
      return lineStart;
    }
    effects.consume(code);
    return data;
  }
}

// node_modules/micromark/dev/lib/initialize/document.js
var document2 = { tokenize: initializeDocument };
var containerConstruct = { tokenize: tokenizeContainer };
function initializeDocument(effects) {
  const self = this;
  const stack = [];
  let continued = 0;
  let childFlow;
  let childToken;
  let lineStartOffset;
  return start;
  function start(code) {
    if (continued < stack.length) {
      const item = stack[continued];
      self.containerState = item[1];
      ok(item[0].continuation, "expected `continuation` to be defined on container construct");
      return effects.attempt(item[0].continuation, documentContinue, checkNewContainers)(code);
    }
    return checkNewContainers(code);
  }
  function documentContinue(code) {
    ok(self.containerState, "expected `containerState` to be defined after continuation");
    continued++;
    if (self.containerState._closeFlow) {
      self.containerState._closeFlow = undefined;
      if (childFlow) {
        closeFlow();
      }
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let point;
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === types.chunkFlow) {
          point = self.events[indexBeforeFlow][1].end;
          break;
        }
      }
      ok(point, "could not find previous flow chunk");
      exitContainers(continued);
      let index = indexBeforeExits;
      while (index < self.events.length) {
        self.events[index][1].end = { ...point };
        index++;
      }
      splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
      self.events.length = index;
      return checkNewContainers(code);
    }
    return start(code);
  }
  function checkNewContainers(code) {
    if (continued === stack.length) {
      if (!childFlow) {
        return documentContinued(code);
      }
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        return flowStart(code);
      }
      self.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
    }
    self.containerState = {};
    return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code);
  }
  function thereIsANewContainer(code) {
    if (childFlow)
      closeFlow();
    exitContainers(continued);
    return documentContinued(code);
  }
  function thereIsNoNewContainer(code) {
    self.parser.lazy[self.now().line] = continued !== stack.length;
    lineStartOffset = self.now().offset;
    return flowStart(code);
  }
  function documentContinued(code) {
    self.containerState = {};
    return effects.attempt(containerConstruct, containerContinue, flowStart)(code);
  }
  function containerContinue(code) {
    ok(self.currentConstruct, "expected `currentConstruct` to be defined on tokenizer");
    ok(self.containerState, "expected `containerState` to be defined on tokenizer");
    continued++;
    stack.push([self.currentConstruct, self.containerState]);
    return documentContinued(code);
  }
  function flowStart(code) {
    if (code === codes.eof) {
      if (childFlow)
        closeFlow();
      exitContainers(0);
      effects.consume(code);
      return;
    }
    childFlow = childFlow || self.parser.flow(self.now());
    effects.enter(types.chunkFlow, {
      _tokenizer: childFlow,
      contentType: constants.contentTypeFlow,
      previous: childToken
    });
    return flowContinue(code);
  }
  function flowContinue(code) {
    if (code === codes.eof) {
      writeToChild(effects.exit(types.chunkFlow), true);
      exitContainers(0);
      effects.consume(code);
      return;
    }
    if (markdownLineEnding(code)) {
      effects.consume(code);
      writeToChild(effects.exit(types.chunkFlow));
      continued = 0;
      self.interrupt = undefined;
      return start;
    }
    effects.consume(code);
    return flowContinue;
  }
  function writeToChild(token, endOfFile) {
    ok(childFlow, "expected `childFlow` to be defined when continuing");
    const stream = self.sliceStream(token);
    if (endOfFile)
      stream.push(null);
    token.previous = childToken;
    if (childToken)
      childToken.next = token;
    childToken = token;
    childFlow.defineSkip(token.start);
    childFlow.write(stream);
    if (self.parser.lazy[token.start.line]) {
      let index = childFlow.events.length;
      while (index--) {
        if (childFlow.events[index][1].start.offset < lineStartOffset && (!childFlow.events[index][1].end || childFlow.events[index][1].end.offset > lineStartOffset)) {
          return;
        }
      }
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let seen;
      let point;
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === types.chunkFlow) {
          if (seen) {
            point = self.events[indexBeforeFlow][1].end;
            break;
          }
          seen = true;
        }
      }
      ok(point, "could not find previous flow chunk");
      exitContainers(continued);
      index = indexBeforeExits;
      while (index < self.events.length) {
        self.events[index][1].end = { ...point };
        index++;
      }
      splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
      self.events.length = index;
    }
  }
  function exitContainers(size) {
    let index = stack.length;
    while (index-- > size) {
      const entry = stack[index];
      self.containerState = entry[1];
      ok(entry[0].exit, "expected `exit` to be defined on container construct");
      entry[0].exit.call(self, effects);
    }
    stack.length = size;
  }
  function closeFlow() {
    ok(self.containerState, "expected `containerState` to be defined when closing flow");
    ok(childFlow, "expected `childFlow` to be defined when closing it");
    childFlow.write([codes.eof]);
    childToken = undefined;
    childFlow = undefined;
    self.containerState._closeFlow = undefined;
  }
}
function tokenizeContainer(effects, ok2, nok) {
  ok(this.parser.constructs.disable.null, "expected `disable.null` to be populated");
  return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok2, nok), types.linePrefix, this.parser.constructs.disable.null.includes("codeIndented") ? undefined : constants.tabSize);
}

// node_modules/micromark-util-classify-character/dev/index.js
function classifyCharacter(code) {
  if (code === codes.eof || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
    return constants.characterGroupWhitespace;
  }
  if (unicodePunctuation(code)) {
    return constants.characterGroupPunctuation;
  }
}

// node_modules/micromark-util-resolve-all/index.js
function resolveAll(constructs2, events, context) {
  const called = [];
  let index = -1;
  while (++index < constructs2.length) {
    const resolve = constructs2[index].resolveAll;
    if (resolve && !called.includes(resolve)) {
      events = resolve(events, context);
      called.push(resolve);
    }
  }
  return events;
}

// node_modules/micromark-core-commonmark/dev/lib/attention.js
var attention = {
  name: "attention",
  resolveAll: resolveAllAttention,
  tokenize: tokenizeAttention
};
function resolveAllAttention(events, context) {
  let index = -1;
  let open;
  let group;
  let text;
  let openingSequence;
  let closingSequence;
  let use;
  let nextEvents;
  let offset;
  while (++index < events.length) {
    if (events[index][0] === "enter" && events[index][1].type === "attentionSequence" && events[index][1]._close) {
      open = index;
      while (open--) {
        if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index][1]).charCodeAt(0)) {
          if ((events[open][1]._close || events[index][1]._open) && (events[index][1].end.offset - events[index][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index][1].end.offset - events[index][1].start.offset) % 3)) {
            continue;
          }
          use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index][1].end.offset - events[index][1].start.offset > 1 ? 2 : 1;
          const start = { ...events[open][1].end };
          const end = { ...events[index][1].start };
          movePoint(start, -use);
          movePoint(end, use);
          openingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start,
            end: { ...events[open][1].end }
          };
          closingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start: { ...events[index][1].start },
            end
          };
          text = {
            type: use > 1 ? types.strongText : types.emphasisText,
            start: { ...events[open][1].end },
            end: { ...events[index][1].start }
          };
          group = {
            type: use > 1 ? types.strong : types.emphasis,
            start: { ...openingSequence.start },
            end: { ...closingSequence.end }
          };
          events[open][1].end = { ...openingSequence.start };
          events[index][1].start = { ...closingSequence.end };
          nextEvents = [];
          if (events[open][1].end.offset - events[open][1].start.offset) {
            nextEvents = push(nextEvents, [
              ["enter", events[open][1], context],
              ["exit", events[open][1], context]
            ]);
          }
          nextEvents = push(nextEvents, [
            ["enter", group, context],
            ["enter", openingSequence, context],
            ["exit", openingSequence, context],
            ["enter", text, context]
          ]);
          ok(context.parser.constructs.insideSpan.null, "expected `insideSpan` to be populated");
          nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index), context));
          nextEvents = push(nextEvents, [
            ["exit", text, context],
            ["enter", closingSequence, context],
            ["exit", closingSequence, context],
            ["exit", group, context]
          ]);
          if (events[index][1].end.offset - events[index][1].start.offset) {
            offset = 2;
            nextEvents = push(nextEvents, [
              ["enter", events[index][1], context],
              ["exit", events[index][1], context]
            ]);
          } else {
            offset = 0;
          }
          splice(events, open - 1, index - open + 3, nextEvents);
          index = open + nextEvents.length - offset - 2;
          break;
        }
      }
    }
  }
  index = -1;
  while (++index < events.length) {
    if (events[index][1].type === "attentionSequence") {
      events[index][1].type = "data";
    }
  }
  return events;
}
function tokenizeAttention(effects, ok2) {
  const attentionMarkers = this.parser.constructs.attentionMarkers.null;
  const previous = this.previous;
  const before = classifyCharacter(previous);
  let marker;
  return start;
  function start(code) {
    ok(code === codes.asterisk || code === codes.underscore, "expected asterisk or underscore");
    marker = code;
    effects.enter("attentionSequence");
    return inside(code);
  }
  function inside(code) {
    if (code === marker) {
      effects.consume(code);
      return inside;
    }
    const token = effects.exit("attentionSequence");
    const after = classifyCharacter(code);
    ok(attentionMarkers, "expected `attentionMarkers` to be populated");
    const open = !after || after === constants.characterGroupPunctuation && before || attentionMarkers.includes(code);
    const close = !before || before === constants.characterGroupPunctuation && after || attentionMarkers.includes(previous);
    token._open = Boolean(marker === codes.asterisk ? open : open && (before || !close));
    token._close = Boolean(marker === codes.asterisk ? close : close && (after || !open));
    return ok2(code);
  }
}
function movePoint(point, offset) {
  point.column += offset;
  point.offset += offset;
  point._bufferIndex += offset;
}
// node_modules/micromark-core-commonmark/dev/lib/autolink.js
var autolink = { name: "autolink", tokenize: tokenizeAutolink };
function tokenizeAutolink(effects, ok2, nok) {
  let size = 0;
  return start;
  function start(code) {
    ok(code === codes.lessThan, "expected `<`");
    effects.enter(types.autolink);
    effects.enter(types.autolinkMarker);
    effects.consume(code);
    effects.exit(types.autolinkMarker);
    effects.enter(types.autolinkProtocol);
    return open;
  }
  function open(code) {
    if (asciiAlpha(code)) {
      effects.consume(code);
      return schemeOrEmailAtext;
    }
    if (code === codes.atSign) {
      return nok(code);
    }
    return emailAtext(code);
  }
  function schemeOrEmailAtext(code) {
    if (code === codes.plusSign || code === codes.dash || code === codes.dot || asciiAlphanumeric(code)) {
      size = 1;
      return schemeInsideOrEmailAtext(code);
    }
    return emailAtext(code);
  }
  function schemeInsideOrEmailAtext(code) {
    if (code === codes.colon) {
      effects.consume(code);
      size = 0;
      return urlInside;
    }
    if ((code === codes.plusSign || code === codes.dash || code === codes.dot || asciiAlphanumeric(code)) && size++ < constants.autolinkSchemeSizeMax) {
      effects.consume(code);
      return schemeInsideOrEmailAtext;
    }
    size = 0;
    return emailAtext(code);
  }
  function urlInside(code) {
    if (code === codes.greaterThan) {
      effects.exit(types.autolinkProtocol);
      effects.enter(types.autolinkMarker);
      effects.consume(code);
      effects.exit(types.autolinkMarker);
      effects.exit(types.autolink);
      return ok2;
    }
    if (code === codes.eof || code === codes.space || code === codes.lessThan || asciiControl(code)) {
      return nok(code);
    }
    effects.consume(code);
    return urlInside;
  }
  function emailAtext(code) {
    if (code === codes.atSign) {
      effects.consume(code);
      return emailAtSignOrDot;
    }
    if (asciiAtext(code)) {
      effects.consume(code);
      return emailAtext;
    }
    return nok(code);
  }
  function emailAtSignOrDot(code) {
    return asciiAlphanumeric(code) ? emailLabel(code) : nok(code);
  }
  function emailLabel(code) {
    if (code === codes.dot) {
      effects.consume(code);
      size = 0;
      return emailAtSignOrDot;
    }
    if (code === codes.greaterThan) {
      effects.exit(types.autolinkProtocol).type = types.autolinkEmail;
      effects.enter(types.autolinkMarker);
      effects.consume(code);
      effects.exit(types.autolinkMarker);
      effects.exit(types.autolink);
      return ok2;
    }
    return emailValue(code);
  }
  function emailValue(code) {
    if ((code === codes.dash || asciiAlphanumeric(code)) && size++ < constants.autolinkDomainSizeMax) {
      const next = code === codes.dash ? emailValue : emailLabel;
      effects.consume(code);
      return next;
    }
    return nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/blank-line.js
var blankLine = { partial: true, tokenize: tokenizeBlankLine };
function tokenizeBlankLine(effects, ok2, nok) {
  return start;
  function start(code) {
    return markdownSpace(code) ? factorySpace(effects, after, types.linePrefix)(code) : after(code);
  }
  function after(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok2(code) : nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/block-quote.js
var blockQuote = {
  continuation: { tokenize: tokenizeBlockQuoteContinuation },
  exit,
  name: "blockQuote",
  tokenize: tokenizeBlockQuoteStart
};
function tokenizeBlockQuoteStart(effects, ok2, nok) {
  const self = this;
  return start;
  function start(code) {
    if (code === codes.greaterThan) {
      const state = self.containerState;
      ok(state, "expected `containerState` to be defined in container");
      if (!state.open) {
        effects.enter(types.blockQuote, { _container: true });
        state.open = true;
      }
      effects.enter(types.blockQuotePrefix);
      effects.enter(types.blockQuoteMarker);
      effects.consume(code);
      effects.exit(types.blockQuoteMarker);
      return after;
    }
    return nok(code);
  }
  function after(code) {
    if (markdownSpace(code)) {
      effects.enter(types.blockQuotePrefixWhitespace);
      effects.consume(code);
      effects.exit(types.blockQuotePrefixWhitespace);
      effects.exit(types.blockQuotePrefix);
      return ok2;
    }
    effects.exit(types.blockQuotePrefix);
    return ok2(code);
  }
}
function tokenizeBlockQuoteContinuation(effects, ok2, nok) {
  const self = this;
  return contStart;
  function contStart(code) {
    if (markdownSpace(code)) {
      ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
      return factorySpace(effects, contBefore, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? undefined : constants.tabSize)(code);
    }
    return contBefore(code);
  }
  function contBefore(code) {
    return effects.attempt(blockQuote, ok2, nok)(code);
  }
}
function exit(effects) {
  effects.exit(types.blockQuote);
}
// node_modules/micromark-core-commonmark/dev/lib/character-escape.js
var characterEscape = {
  name: "characterEscape",
  tokenize: tokenizeCharacterEscape
};
function tokenizeCharacterEscape(effects, ok2, nok) {
  return start;
  function start(code) {
    ok(code === codes.backslash, "expected `\\`");
    effects.enter(types.characterEscape);
    effects.enter(types.escapeMarker);
    effects.consume(code);
    effects.exit(types.escapeMarker);
    return inside;
  }
  function inside(code) {
    if (asciiPunctuation(code)) {
      effects.enter(types.characterEscapeValue);
      effects.consume(code);
      effects.exit(types.characterEscapeValue);
      effects.exit(types.characterEscape);
      return ok2;
    }
    return nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/character-reference.js
var characterReference = {
  name: "characterReference",
  tokenize: tokenizeCharacterReference
};
function tokenizeCharacterReference(effects, ok2, nok) {
  const self = this;
  let size = 0;
  let max;
  let test;
  return start;
  function start(code) {
    ok(code === codes.ampersand, "expected `&`");
    effects.enter(types.characterReference);
    effects.enter(types.characterReferenceMarker);
    effects.consume(code);
    effects.exit(types.characterReferenceMarker);
    return open;
  }
  function open(code) {
    if (code === codes.numberSign) {
      effects.enter(types.characterReferenceMarkerNumeric);
      effects.consume(code);
      effects.exit(types.characterReferenceMarkerNumeric);
      return numeric;
    }
    effects.enter(types.characterReferenceValue);
    max = constants.characterReferenceNamedSizeMax;
    test = asciiAlphanumeric;
    return value(code);
  }
  function numeric(code) {
    if (code === codes.uppercaseX || code === codes.lowercaseX) {
      effects.enter(types.characterReferenceMarkerHexadecimal);
      effects.consume(code);
      effects.exit(types.characterReferenceMarkerHexadecimal);
      effects.enter(types.characterReferenceValue);
      max = constants.characterReferenceHexadecimalSizeMax;
      test = asciiHexDigit;
      return value;
    }
    effects.enter(types.characterReferenceValue);
    max = constants.characterReferenceDecimalSizeMax;
    test = asciiDigit;
    return value(code);
  }
  function value(code) {
    if (code === codes.semicolon && size) {
      const token = effects.exit(types.characterReferenceValue);
      if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self.sliceSerialize(token))) {
        return nok(code);
      }
      effects.enter(types.characterReferenceMarker);
      effects.consume(code);
      effects.exit(types.characterReferenceMarker);
      effects.exit(types.characterReference);
      return ok2;
    }
    if (test(code) && size++ < max) {
      effects.consume(code);
      return value;
    }
    return nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/code-fenced.js
var nonLazyContinuation = {
  partial: true,
  tokenize: tokenizeNonLazyContinuation
};
var codeFenced = {
  concrete: true,
  name: "codeFenced",
  tokenize: tokenizeCodeFenced
};
function tokenizeCodeFenced(effects, ok2, nok) {
  const self = this;
  const closeStart = { partial: true, tokenize: tokenizeCloseStart };
  let initialPrefix = 0;
  let sizeOpen = 0;
  let marker;
  return start;
  function start(code) {
    return beforeSequenceOpen(code);
  }
  function beforeSequenceOpen(code) {
    ok(code === codes.graveAccent || code === codes.tilde, "expected `` ` `` or `~`");
    const tail = self.events[self.events.length - 1];
    initialPrefix = tail && tail[1].type === types.linePrefix ? tail[2].sliceSerialize(tail[1], true).length : 0;
    marker = code;
    effects.enter(types.codeFenced);
    effects.enter(types.codeFencedFence);
    effects.enter(types.codeFencedFenceSequence);
    return sequenceOpen(code);
  }
  function sequenceOpen(code) {
    if (code === marker) {
      sizeOpen++;
      effects.consume(code);
      return sequenceOpen;
    }
    if (sizeOpen < constants.codeFencedSequenceSizeMin) {
      return nok(code);
    }
    effects.exit(types.codeFencedFenceSequence);
    return markdownSpace(code) ? factorySpace(effects, infoBefore, types.whitespace)(code) : infoBefore(code);
  }
  function infoBefore(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFencedFence);
      return self.interrupt ? ok2(code) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
    }
    effects.enter(types.codeFencedFenceInfo);
    effects.enter(types.chunkString, { contentType: constants.contentTypeString });
    return info(code);
  }
  function info(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString);
      effects.exit(types.codeFencedFenceInfo);
      return infoBefore(code);
    }
    if (markdownSpace(code)) {
      effects.exit(types.chunkString);
      effects.exit(types.codeFencedFenceInfo);
      return factorySpace(effects, metaBefore, types.whitespace)(code);
    }
    if (code === codes.graveAccent && code === marker) {
      return nok(code);
    }
    effects.consume(code);
    return info;
  }
  function metaBefore(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return infoBefore(code);
    }
    effects.enter(types.codeFencedFenceMeta);
    effects.enter(types.chunkString, { contentType: constants.contentTypeString });
    return meta(code);
  }
  function meta(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString);
      effects.exit(types.codeFencedFenceMeta);
      return infoBefore(code);
    }
    if (code === codes.graveAccent && code === marker) {
      return nok(code);
    }
    effects.consume(code);
    return meta;
  }
  function atNonLazyBreak(code) {
    ok(markdownLineEnding(code), "expected eol");
    return effects.attempt(closeStart, after, contentBefore)(code);
  }
  function contentBefore(code) {
    ok(markdownLineEnding(code), "expected eol");
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return contentStart;
  }
  function contentStart(code) {
    return initialPrefix > 0 && markdownSpace(code) ? factorySpace(effects, beforeContentChunk, types.linePrefix, initialPrefix + 1)(code) : beforeContentChunk(code);
  }
  function beforeContentChunk(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
    }
    effects.enter(types.codeFlowValue);
    return contentChunk(code);
  }
  function contentChunk(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue);
      return beforeContentChunk(code);
    }
    effects.consume(code);
    return contentChunk;
  }
  function after(code) {
    effects.exit(types.codeFenced);
    return ok2(code);
  }
  function tokenizeCloseStart(effects2, ok3, nok2) {
    let size = 0;
    return startBefore;
    function startBefore(code) {
      ok(markdownLineEnding(code), "expected eol");
      effects2.enter(types.lineEnding);
      effects2.consume(code);
      effects2.exit(types.lineEnding);
      return start2;
    }
    function start2(code) {
      ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
      effects2.enter(types.codeFencedFence);
      return markdownSpace(code) ? factorySpace(effects2, beforeSequenceClose, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? undefined : constants.tabSize)(code) : beforeSequenceClose(code);
    }
    function beforeSequenceClose(code) {
      if (code === marker) {
        effects2.enter(types.codeFencedFenceSequence);
        return sequenceClose(code);
      }
      return nok2(code);
    }
    function sequenceClose(code) {
      if (code === marker) {
        size++;
        effects2.consume(code);
        return sequenceClose;
      }
      if (size >= sizeOpen) {
        effects2.exit(types.codeFencedFenceSequence);
        return markdownSpace(code) ? factorySpace(effects2, sequenceCloseAfter, types.whitespace)(code) : sequenceCloseAfter(code);
      }
      return nok2(code);
    }
    function sequenceCloseAfter(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects2.exit(types.codeFencedFence);
        return ok3(code);
      }
      return nok2(code);
    }
  }
}
function tokenizeNonLazyContinuation(effects, ok2, nok) {
  const self = this;
  return start;
  function start(code) {
    if (code === codes.eof) {
      return nok(code);
    }
    ok(markdownLineEnding(code), "expected eol");
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return lineStart;
  }
  function lineStart(code) {
    return self.parser.lazy[self.now().line] ? nok(code) : ok2(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/code-indented.js
var codeIndented = {
  name: "codeIndented",
  tokenize: tokenizeCodeIndented
};
var furtherStart = { partial: true, tokenize: tokenizeFurtherStart };
function tokenizeCodeIndented(effects, ok2, nok) {
  const self = this;
  return start;
  function start(code) {
    ok(markdownSpace(code));
    effects.enter(types.codeIndented);
    return factorySpace(effects, afterPrefix, types.linePrefix, constants.tabSize + 1)(code);
  }
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === types.linePrefix && tail[2].sliceSerialize(tail[1], true).length >= constants.tabSize ? atBreak(code) : nok(code);
  }
  function atBreak(code) {
    if (code === codes.eof) {
      return after(code);
    }
    if (markdownLineEnding(code)) {
      return effects.attempt(furtherStart, atBreak, after)(code);
    }
    effects.enter(types.codeFlowValue);
    return inside(code);
  }
  function inside(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.codeFlowValue);
      return atBreak(code);
    }
    effects.consume(code);
    return inside;
  }
  function after(code) {
    effects.exit(types.codeIndented);
    return ok2(code);
  }
}
function tokenizeFurtherStart(effects, ok2, nok) {
  const self = this;
  return furtherStart2;
  function furtherStart2(code) {
    if (self.parser.lazy[self.now().line]) {
      return nok(code);
    }
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      return furtherStart2;
    }
    return factorySpace(effects, afterPrefix, types.linePrefix, constants.tabSize + 1)(code);
  }
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === types.linePrefix && tail[2].sliceSerialize(tail[1], true).length >= constants.tabSize ? ok2(code) : markdownLineEnding(code) ? furtherStart2(code) : nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/code-text.js
var codeText = {
  name: "codeText",
  previous,
  resolve: resolveCodeText,
  tokenize: tokenizeCodeText
};
function resolveCodeText(events) {
  let tailExitIndex = events.length - 4;
  let headEnterIndex = 3;
  let index;
  let enter;
  if ((events[headEnterIndex][1].type === types.lineEnding || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === types.lineEnding || events[tailExitIndex][1].type === "space")) {
    index = headEnterIndex;
    while (++index < tailExitIndex) {
      if (events[index][1].type === types.codeTextData) {
        events[headEnterIndex][1].type = types.codeTextPadding;
        events[tailExitIndex][1].type = types.codeTextPadding;
        headEnterIndex += 2;
        tailExitIndex -= 2;
        break;
      }
    }
  }
  index = headEnterIndex - 1;
  tailExitIndex++;
  while (++index <= tailExitIndex) {
    if (enter === undefined) {
      if (index !== tailExitIndex && events[index][1].type !== types.lineEnding) {
        enter = index;
      }
    } else if (index === tailExitIndex || events[index][1].type === types.lineEnding) {
      events[enter][1].type = types.codeTextData;
      if (index !== enter + 2) {
        events[enter][1].end = events[index - 1][1].end;
        events.splice(enter + 2, index - enter - 2);
        tailExitIndex -= index - enter - 2;
        index = enter + 2;
      }
      enter = undefined;
    }
  }
  return events;
}
function previous(code) {
  return code !== codes.graveAccent || this.events[this.events.length - 1][1].type === types.characterEscape;
}
function tokenizeCodeText(effects, ok2, nok) {
  const self = this;
  let sizeOpen = 0;
  let size;
  let token;
  return start;
  function start(code) {
    ok(code === codes.graveAccent, "expected `` ` ``");
    ok(previous.call(self, self.previous), "expected correct previous");
    effects.enter(types.codeText);
    effects.enter(types.codeTextSequence);
    return sequenceOpen(code);
  }
  function sequenceOpen(code) {
    if (code === codes.graveAccent) {
      effects.consume(code);
      sizeOpen++;
      return sequenceOpen;
    }
    effects.exit(types.codeTextSequence);
    return between(code);
  }
  function between(code) {
    if (code === codes.eof) {
      return nok(code);
    }
    if (code === codes.space) {
      effects.enter("space");
      effects.consume(code);
      effects.exit("space");
      return between;
    }
    if (code === codes.graveAccent) {
      token = effects.enter(types.codeTextSequence);
      size = 0;
      return sequenceClose(code);
    }
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      return between;
    }
    effects.enter(types.codeTextData);
    return data(code);
  }
  function data(code) {
    if (code === codes.eof || code === codes.space || code === codes.graveAccent || markdownLineEnding(code)) {
      effects.exit(types.codeTextData);
      return between(code);
    }
    effects.consume(code);
    return data;
  }
  function sequenceClose(code) {
    if (code === codes.graveAccent) {
      effects.consume(code);
      size++;
      return sequenceClose;
    }
    if (size === sizeOpen) {
      effects.exit(types.codeTextSequence);
      effects.exit(types.codeText);
      return ok2(code);
    }
    token.type = types.codeTextData;
    return data(code);
  }
}
// node_modules/micromark-util-subtokenize/dev/lib/splice-buffer.js
class SpliceBuffer {
  constructor(initial) {
    this.left = initial ? [...initial] : [];
    this.right = [];
  }
  get(index) {
    if (index < 0 || index >= this.left.length + this.right.length) {
      throw new RangeError("Cannot access index `" + index + "` in a splice buffer of size `" + (this.left.length + this.right.length) + "`");
    }
    if (index < this.left.length)
      return this.left[index];
    return this.right[this.right.length - index + this.left.length - 1];
  }
  get length() {
    return this.left.length + this.right.length;
  }
  shift() {
    this.setCursor(0);
    return this.right.pop();
  }
  slice(start, end) {
    const stop = end === null || end === undefined ? Number.POSITIVE_INFINITY : end;
    if (stop < this.left.length) {
      return this.left.slice(start, stop);
    }
    if (start > this.left.length) {
      return this.right.slice(this.right.length - stop + this.left.length, this.right.length - start + this.left.length).reverse();
    }
    return this.left.slice(start).concat(this.right.slice(this.right.length - stop + this.left.length).reverse());
  }
  splice(start, deleteCount, items) {
    const count = deleteCount || 0;
    this.setCursor(Math.trunc(start));
    const removed = this.right.splice(this.right.length - count, Number.POSITIVE_INFINITY);
    if (items)
      chunkedPush(this.left, items);
    return removed.reverse();
  }
  pop() {
    this.setCursor(Number.POSITIVE_INFINITY);
    return this.left.pop();
  }
  push(item) {
    this.setCursor(Number.POSITIVE_INFINITY);
    this.left.push(item);
  }
  pushMany(items) {
    this.setCursor(Number.POSITIVE_INFINITY);
    chunkedPush(this.left, items);
  }
  unshift(item) {
    this.setCursor(0);
    this.right.push(item);
  }
  unshiftMany(items) {
    this.setCursor(0);
    chunkedPush(this.right, items.reverse());
  }
  setCursor(n) {
    if (n === this.left.length || n > this.left.length && this.right.length === 0 || n < 0 && this.left.length === 0)
      return;
    if (n < this.left.length) {
      const removed = this.left.splice(n, Number.POSITIVE_INFINITY);
      chunkedPush(this.right, removed.reverse());
    } else {
      const removed = this.right.splice(this.left.length + this.right.length - n, Number.POSITIVE_INFINITY);
      chunkedPush(this.left, removed.reverse());
    }
  }
}
function chunkedPush(list, right) {
  let chunkStart = 0;
  if (right.length < constants.v8MaxSafeChunkSize) {
    list.push(...right);
  } else {
    while (chunkStart < right.length) {
      list.push(...right.slice(chunkStart, chunkStart + constants.v8MaxSafeChunkSize));
      chunkStart += constants.v8MaxSafeChunkSize;
    }
  }
}

// node_modules/micromark-util-subtokenize/dev/index.js
function subtokenize(eventsArray) {
  const jumps = {};
  let index = -1;
  let event;
  let lineIndex;
  let otherIndex;
  let otherEvent;
  let parameters;
  let subevents;
  let more;
  const events = new SpliceBuffer(eventsArray);
  while (++index < events.length) {
    while (index in jumps) {
      index = jumps[index];
    }
    event = events.get(index);
    if (index && event[1].type === types.chunkFlow && events.get(index - 1)[1].type === types.listItemPrefix) {
      ok(event[1]._tokenizer, "expected `_tokenizer` on subtokens");
      subevents = event[1]._tokenizer.events;
      otherIndex = 0;
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === types.lineEndingBlank) {
        otherIndex += 2;
      }
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === types.content) {
        while (++otherIndex < subevents.length) {
          if (subevents[otherIndex][1].type === types.content) {
            break;
          }
          if (subevents[otherIndex][1].type === types.chunkText) {
            subevents[otherIndex][1]._isInFirstContentOfListItem = true;
            otherIndex++;
          }
        }
      }
    }
    if (event[0] === "enter") {
      if (event[1].contentType) {
        Object.assign(jumps, subcontent(events, index));
        index = jumps[index];
        more = true;
      }
    } else if (event[1]._container) {
      otherIndex = index;
      lineIndex = undefined;
      while (otherIndex--) {
        otherEvent = events.get(otherIndex);
        if (otherEvent[1].type === types.lineEnding || otherEvent[1].type === types.lineEndingBlank) {
          if (otherEvent[0] === "enter") {
            if (lineIndex) {
              events.get(lineIndex)[1].type = types.lineEndingBlank;
            }
            otherEvent[1].type = types.lineEnding;
            lineIndex = otherIndex;
          }
        } else if (otherEvent[1].type === types.linePrefix || otherEvent[1].type === types.listItemIndent) {} else {
          break;
        }
      }
      if (lineIndex) {
        event[1].end = { ...events.get(lineIndex)[1].start };
        parameters = events.slice(lineIndex, index);
        parameters.unshift(event);
        events.splice(lineIndex, index - lineIndex + 1, parameters);
      }
    }
  }
  splice(eventsArray, 0, Number.POSITIVE_INFINITY, events.slice(0));
  return !more;
}
function subcontent(events, eventIndex) {
  const token = events.get(eventIndex)[1];
  const context = events.get(eventIndex)[2];
  let startPosition = eventIndex - 1;
  const startPositions = [];
  ok(token.contentType, "expected `contentType` on subtokens");
  let tokenizer = token._tokenizer;
  if (!tokenizer) {
    tokenizer = context.parser[token.contentType](token.start);
    if (token._contentTypeTextTrailing) {
      tokenizer._contentTypeTextTrailing = true;
    }
  }
  const childEvents = tokenizer.events;
  const jumps = [];
  const gaps = {};
  let stream;
  let previous2;
  let index = -1;
  let current = token;
  let adjust = 0;
  let start = 0;
  const breaks = [start];
  while (current) {
    while (events.get(++startPosition)[1] !== current) {}
    ok(!previous2 || current.previous === previous2, "expected previous to match");
    ok(!previous2 || previous2.next === current, "expected next to match");
    startPositions.push(startPosition);
    if (!current._tokenizer) {
      stream = context.sliceStream(current);
      if (!current.next) {
        stream.push(codes.eof);
      }
      if (previous2) {
        tokenizer.defineSkip(current.start);
      }
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = true;
      }
      tokenizer.write(stream);
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = undefined;
      }
    }
    previous2 = current;
    current = current.next;
  }
  current = token;
  while (++index < childEvents.length) {
    if (childEvents[index][0] === "exit" && childEvents[index - 1][0] === "enter" && childEvents[index][1].type === childEvents[index - 1][1].type && childEvents[index][1].start.line !== childEvents[index][1].end.line) {
      ok(current, "expected a current token");
      start = index + 1;
      breaks.push(start);
      current._tokenizer = undefined;
      current.previous = undefined;
      current = current.next;
    }
  }
  tokenizer.events = [];
  if (current) {
    current._tokenizer = undefined;
    current.previous = undefined;
    ok(!current.next, "expected no next token");
  } else {
    breaks.pop();
  }
  index = breaks.length;
  while (index--) {
    const slice = childEvents.slice(breaks[index], breaks[index + 1]);
    const start2 = startPositions.pop();
    ok(start2 !== undefined, "expected a start position when splicing");
    jumps.push([start2, start2 + slice.length - 1]);
    events.splice(start2, 2, slice);
  }
  jumps.reverse();
  index = -1;
  while (++index < jumps.length) {
    gaps[adjust + jumps[index][0]] = adjust + jumps[index][1];
    adjust += jumps[index][1] - jumps[index][0] - 1;
  }
  return gaps;
}

// node_modules/micromark-core-commonmark/dev/lib/content.js
var content2 = { resolve: resolveContent, tokenize: tokenizeContent };
var continuationConstruct = { partial: true, tokenize: tokenizeContinuation };
function resolveContent(events) {
  subtokenize(events);
  return events;
}
function tokenizeContent(effects, ok2) {
  let previous2;
  return chunkStart;
  function chunkStart(code) {
    ok(code !== codes.eof && !markdownLineEnding(code), "expected no eof or eol");
    effects.enter(types.content);
    previous2 = effects.enter(types.chunkContent, {
      contentType: constants.contentTypeContent
    });
    return chunkInside(code);
  }
  function chunkInside(code) {
    if (code === codes.eof) {
      return contentEnd(code);
    }
    if (markdownLineEnding(code)) {
      return effects.check(continuationConstruct, contentContinue, contentEnd)(code);
    }
    effects.consume(code);
    return chunkInside;
  }
  function contentEnd(code) {
    effects.exit(types.chunkContent);
    effects.exit(types.content);
    return ok2(code);
  }
  function contentContinue(code) {
    ok(markdownLineEnding(code), "expected eol");
    effects.consume(code);
    effects.exit(types.chunkContent);
    ok(previous2, "expected previous token");
    previous2.next = effects.enter(types.chunkContent, {
      contentType: constants.contentTypeContent,
      previous: previous2
    });
    previous2 = previous2.next;
    return chunkInside;
  }
}
function tokenizeContinuation(effects, ok2, nok) {
  const self = this;
  return startLookahead;
  function startLookahead(code) {
    ok(markdownLineEnding(code), "expected a line ending");
    effects.exit(types.chunkContent);
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return factorySpace(effects, prefixed, types.linePrefix);
  }
  function prefixed(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code);
    }
    ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
    const tail = self.events[self.events.length - 1];
    if (!self.parser.constructs.disable.null.includes("codeIndented") && tail && tail[1].type === types.linePrefix && tail[2].sliceSerialize(tail[1], true).length >= constants.tabSize) {
      return ok2(code);
    }
    return effects.interrupt(self.parser.constructs.flow, nok, ok2)(code);
  }
}
// node_modules/micromark-factory-destination/dev/index.js
function factoryDestination(effects, ok2, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
  const limit = max || Number.POSITIVE_INFINITY;
  let balance = 0;
  return start;
  function start(code) {
    if (code === codes.lessThan) {
      effects.enter(type);
      effects.enter(literalType);
      effects.enter(literalMarkerType);
      effects.consume(code);
      effects.exit(literalMarkerType);
      return enclosedBefore;
    }
    if (code === codes.eof || code === codes.space || code === codes.rightParenthesis || asciiControl(code)) {
      return nok(code);
    }
    effects.enter(type);
    effects.enter(rawType);
    effects.enter(stringType);
    effects.enter(types.chunkString, { contentType: constants.contentTypeString });
    return raw(code);
  }
  function enclosedBefore(code) {
    if (code === codes.greaterThan) {
      effects.enter(literalMarkerType);
      effects.consume(code);
      effects.exit(literalMarkerType);
      effects.exit(literalType);
      effects.exit(type);
      return ok2;
    }
    effects.enter(stringType);
    effects.enter(types.chunkString, { contentType: constants.contentTypeString });
    return enclosed(code);
  }
  function enclosed(code) {
    if (code === codes.greaterThan) {
      effects.exit(types.chunkString);
      effects.exit(stringType);
      return enclosedBefore(code);
    }
    if (code === codes.eof || code === codes.lessThan || markdownLineEnding(code)) {
      return nok(code);
    }
    effects.consume(code);
    return code === codes.backslash ? enclosedEscape : enclosed;
  }
  function enclosedEscape(code) {
    if (code === codes.lessThan || code === codes.greaterThan || code === codes.backslash) {
      effects.consume(code);
      return enclosed;
    }
    return enclosed(code);
  }
  function raw(code) {
    if (!balance && (code === codes.eof || code === codes.rightParenthesis || markdownLineEndingOrSpace(code))) {
      effects.exit(types.chunkString);
      effects.exit(stringType);
      effects.exit(rawType);
      effects.exit(type);
      return ok2(code);
    }
    if (balance < limit && code === codes.leftParenthesis) {
      effects.consume(code);
      balance++;
      return raw;
    }
    if (code === codes.rightParenthesis) {
      effects.consume(code);
      balance--;
      return raw;
    }
    if (code === codes.eof || code === codes.space || code === codes.leftParenthesis || asciiControl(code)) {
      return nok(code);
    }
    effects.consume(code);
    return code === codes.backslash ? rawEscape : raw;
  }
  function rawEscape(code) {
    if (code === codes.leftParenthesis || code === codes.rightParenthesis || code === codes.backslash) {
      effects.consume(code);
      return raw;
    }
    return raw(code);
  }
}

// node_modules/micromark-factory-label/dev/index.js
function factoryLabel(effects, ok2, nok, type, markerType, stringType) {
  const self = this;
  let size = 0;
  let seen;
  return start;
  function start(code) {
    ok(code === codes.leftSquareBracket, "expected `[`");
    effects.enter(type);
    effects.enter(markerType);
    effects.consume(code);
    effects.exit(markerType);
    effects.enter(stringType);
    return atBreak;
  }
  function atBreak(code) {
    if (size > constants.linkReferenceSizeMax || code === codes.eof || code === codes.leftSquareBracket || code === codes.rightSquareBracket && !seen || code === codes.caret && !size && "_hiddenFootnoteSupport" in self.parser.constructs) {
      return nok(code);
    }
    if (code === codes.rightSquareBracket) {
      effects.exit(stringType);
      effects.enter(markerType);
      effects.consume(code);
      effects.exit(markerType);
      effects.exit(type);
      return ok2;
    }
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      return atBreak;
    }
    effects.enter(types.chunkString, { contentType: constants.contentTypeString });
    return labelInside(code);
  }
  function labelInside(code) {
    if (code === codes.eof || code === codes.leftSquareBracket || code === codes.rightSquareBracket || markdownLineEnding(code) || size++ > constants.linkReferenceSizeMax) {
      effects.exit(types.chunkString);
      return atBreak(code);
    }
    effects.consume(code);
    if (!seen)
      seen = !markdownSpace(code);
    return code === codes.backslash ? labelEscape : labelInside;
  }
  function labelEscape(code) {
    if (code === codes.leftSquareBracket || code === codes.backslash || code === codes.rightSquareBracket) {
      effects.consume(code);
      size++;
      return labelInside;
    }
    return labelInside(code);
  }
}

// node_modules/micromark-factory-title/dev/index.js
function factoryTitle(effects, ok2, nok, type, markerType, stringType) {
  let marker;
  return start;
  function start(code) {
    if (code === codes.quotationMark || code === codes.apostrophe || code === codes.leftParenthesis) {
      effects.enter(type);
      effects.enter(markerType);
      effects.consume(code);
      effects.exit(markerType);
      marker = code === codes.leftParenthesis ? codes.rightParenthesis : code;
      return begin;
    }
    return nok(code);
  }
  function begin(code) {
    if (code === marker) {
      effects.enter(markerType);
      effects.consume(code);
      effects.exit(markerType);
      effects.exit(type);
      return ok2;
    }
    effects.enter(stringType);
    return atBreak(code);
  }
  function atBreak(code) {
    if (code === marker) {
      effects.exit(stringType);
      return begin(marker);
    }
    if (code === codes.eof) {
      return nok(code);
    }
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      return factorySpace(effects, atBreak, types.linePrefix);
    }
    effects.enter(types.chunkString, { contentType: constants.contentTypeString });
    return inside(code);
  }
  function inside(code) {
    if (code === marker || code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString);
      return atBreak(code);
    }
    effects.consume(code);
    return code === codes.backslash ? escape : inside;
  }
  function escape(code) {
    if (code === marker || code === codes.backslash) {
      effects.consume(code);
      return inside;
    }
    return inside(code);
  }
}

// node_modules/micromark-factory-whitespace/dev/index.js
function factoryWhitespace(effects, ok2) {
  let seen;
  return start;
  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      seen = true;
      return start;
    }
    if (markdownSpace(code)) {
      return factorySpace(effects, start, seen ? types.linePrefix : types.lineSuffix)(code);
    }
    return ok2(code);
  }
}

// node_modules/micromark-core-commonmark/dev/lib/definition.js
var definition = { name: "definition", tokenize: tokenizeDefinition };
var titleBefore = { partial: true, tokenize: tokenizeTitleBefore };
function tokenizeDefinition(effects, ok2, nok) {
  const self = this;
  let identifier;
  return start;
  function start(code) {
    effects.enter(types.definition);
    return before(code);
  }
  function before(code) {
    ok(code === codes.leftSquareBracket, "expected `[`");
    return factoryLabel.call(self, effects, labelAfter, nok, types.definitionLabel, types.definitionLabelMarker, types.definitionLabelString)(code);
  }
  function labelAfter(code) {
    identifier = normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1));
    if (code === codes.colon) {
      effects.enter(types.definitionMarker);
      effects.consume(code);
      effects.exit(types.definitionMarker);
      return markerAfter;
    }
    return nok(code);
  }
  function markerAfter(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, destinationBefore)(code) : destinationBefore(code);
  }
  function destinationBefore(code) {
    return factoryDestination(effects, destinationAfter, nok, types.definitionDestination, types.definitionDestinationLiteral, types.definitionDestinationLiteralMarker, types.definitionDestinationRaw, types.definitionDestinationString)(code);
  }
  function destinationAfter(code) {
    return effects.attempt(titleBefore, after, after)(code);
  }
  function after(code) {
    return markdownSpace(code) ? factorySpace(effects, afterWhitespace, types.whitespace)(code) : afterWhitespace(code);
  }
  function afterWhitespace(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.definition);
      self.parser.defined.push(identifier);
      return ok2(code);
    }
    return nok(code);
  }
}
function tokenizeTitleBefore(effects, ok2, nok) {
  return titleBefore2;
  function titleBefore2(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, beforeMarker)(code) : nok(code);
  }
  function beforeMarker(code) {
    return factoryTitle(effects, titleAfter, nok, types.definitionTitle, types.definitionTitleMarker, types.definitionTitleString)(code);
  }
  function titleAfter(code) {
    return markdownSpace(code) ? factorySpace(effects, titleAfterOptionalWhitespace, types.whitespace)(code) : titleAfterOptionalWhitespace(code);
  }
  function titleAfterOptionalWhitespace(code) {
    return code === codes.eof || markdownLineEnding(code) ? ok2(code) : nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/hard-break-escape.js
var hardBreakEscape = {
  name: "hardBreakEscape",
  tokenize: tokenizeHardBreakEscape
};
function tokenizeHardBreakEscape(effects, ok2, nok) {
  return start;
  function start(code) {
    ok(code === codes.backslash, "expected `\\`");
    effects.enter(types.hardBreakEscape);
    effects.consume(code);
    return after;
  }
  function after(code) {
    if (markdownLineEnding(code)) {
      effects.exit(types.hardBreakEscape);
      return ok2(code);
    }
    return nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/heading-atx.js
var headingAtx = {
  name: "headingAtx",
  resolve: resolveHeadingAtx,
  tokenize: tokenizeHeadingAtx
};
function resolveHeadingAtx(events, context) {
  let contentEnd = events.length - 2;
  let contentStart = 3;
  let content3;
  let text;
  if (events[contentStart][1].type === types.whitespace) {
    contentStart += 2;
  }
  if (contentEnd - 2 > contentStart && events[contentEnd][1].type === types.whitespace) {
    contentEnd -= 2;
  }
  if (events[contentEnd][1].type === types.atxHeadingSequence && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === types.whitespace)) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
  }
  if (contentEnd > contentStart) {
    content3 = {
      type: types.atxHeadingText,
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    };
    text = {
      type: types.chunkText,
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: constants.contentTypeText
    };
    splice(events, contentStart, contentEnd - contentStart + 1, [
      ["enter", content3, context],
      ["enter", text, context],
      ["exit", text, context],
      ["exit", content3, context]
    ]);
  }
  return events;
}
function tokenizeHeadingAtx(effects, ok2, nok) {
  let size = 0;
  return start;
  function start(code) {
    effects.enter(types.atxHeading);
    return before(code);
  }
  function before(code) {
    ok(code === codes.numberSign, "expected `#`");
    effects.enter(types.atxHeadingSequence);
    return sequenceOpen(code);
  }
  function sequenceOpen(code) {
    if (code === codes.numberSign && size++ < constants.atxHeadingOpeningFenceSizeMax) {
      effects.consume(code);
      return sequenceOpen;
    }
    if (code === codes.eof || markdownLineEndingOrSpace(code)) {
      effects.exit(types.atxHeadingSequence);
      return atBreak(code);
    }
    return nok(code);
  }
  function atBreak(code) {
    if (code === codes.numberSign) {
      effects.enter(types.atxHeadingSequence);
      return sequenceFurther(code);
    }
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.atxHeading);
      return ok2(code);
    }
    if (markdownSpace(code)) {
      return factorySpace(effects, atBreak, types.whitespace)(code);
    }
    effects.enter(types.atxHeadingText);
    return data(code);
  }
  function sequenceFurther(code) {
    if (code === codes.numberSign) {
      effects.consume(code);
      return sequenceFurther;
    }
    effects.exit(types.atxHeadingSequence);
    return atBreak(code);
  }
  function data(code) {
    if (code === codes.eof || code === codes.numberSign || markdownLineEndingOrSpace(code)) {
      effects.exit(types.atxHeadingText);
      return atBreak(code);
    }
    effects.consume(code);
    return data;
  }
}
// node_modules/micromark-util-html-tag-name/index.js
var htmlBlockNames = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
];
var htmlRawNames = ["pre", "script", "style", "textarea"];

// node_modules/micromark-core-commonmark/dev/lib/html-flow.js
var htmlFlow = {
  concrete: true,
  name: "htmlFlow",
  resolveTo: resolveToHtmlFlow,
  tokenize: tokenizeHtmlFlow
};
var blankLineBefore = { partial: true, tokenize: tokenizeBlankLineBefore };
var nonLazyContinuationStart = {
  partial: true,
  tokenize: tokenizeNonLazyContinuationStart
};
function resolveToHtmlFlow(events) {
  let index = events.length;
  while (index--) {
    if (events[index][0] === "enter" && events[index][1].type === types.htmlFlow) {
      break;
    }
  }
  if (index > 1 && events[index - 2][1].type === types.linePrefix) {
    events[index][1].start = events[index - 2][1].start;
    events[index + 1][1].start = events[index - 2][1].start;
    events.splice(index - 2, 2);
  }
  return events;
}
function tokenizeHtmlFlow(effects, ok2, nok) {
  const self = this;
  let marker;
  let closingTag;
  let buffer;
  let index;
  let markerB;
  return start;
  function start(code) {
    return before(code);
  }
  function before(code) {
    ok(code === codes.lessThan, "expected `<`");
    effects.enter(types.htmlFlow);
    effects.enter(types.htmlFlowData);
    effects.consume(code);
    return open;
  }
  function open(code) {
    if (code === codes.exclamationMark) {
      effects.consume(code);
      return declarationOpen;
    }
    if (code === codes.slash) {
      effects.consume(code);
      closingTag = true;
      return tagCloseStart;
    }
    if (code === codes.questionMark) {
      effects.consume(code);
      marker = constants.htmlInstruction;
      return self.interrupt ? ok2 : continuationDeclarationInside;
    }
    if (asciiAlpha(code)) {
      ok(code !== null);
      effects.consume(code);
      buffer = String.fromCharCode(code);
      return tagName;
    }
    return nok(code);
  }
  function declarationOpen(code) {
    if (code === codes.dash) {
      effects.consume(code);
      marker = constants.htmlComment;
      return commentOpenInside;
    }
    if (code === codes.leftSquareBracket) {
      effects.consume(code);
      marker = constants.htmlCdata;
      index = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code)) {
      effects.consume(code);
      marker = constants.htmlDeclaration;
      return self.interrupt ? ok2 : continuationDeclarationInside;
    }
    return nok(code);
  }
  function commentOpenInside(code) {
    if (code === codes.dash) {
      effects.consume(code);
      return self.interrupt ? ok2 : continuationDeclarationInside;
    }
    return nok(code);
  }
  function cdataOpenInside(code) {
    const value = constants.cdataOpeningString;
    if (code === value.charCodeAt(index++)) {
      effects.consume(code);
      if (index === value.length) {
        return self.interrupt ? ok2 : continuation;
      }
      return cdataOpenInside;
    }
    return nok(code);
  }
  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      ok(code !== null);
      effects.consume(code);
      buffer = String.fromCharCode(code);
      return tagName;
    }
    return nok(code);
  }
  function tagName(code) {
    if (code === codes.eof || code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) {
      const slash = code === codes.slash;
      const name = buffer.toLowerCase();
      if (!slash && !closingTag && htmlRawNames.includes(name)) {
        marker = constants.htmlRaw;
        return self.interrupt ? ok2(code) : continuation(code);
      }
      if (htmlBlockNames.includes(buffer.toLowerCase())) {
        marker = constants.htmlBasic;
        if (slash) {
          effects.consume(code);
          return basicSelfClosing;
        }
        return self.interrupt ? ok2(code) : continuation(code);
      }
      marker = constants.htmlComplete;
      return self.interrupt && !self.parser.lazy[self.now().line] ? nok(code) : closingTag ? completeClosingTagAfter(code) : completeAttributeNameBefore(code);
    }
    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code);
      buffer += String.fromCharCode(code);
      return tagName;
    }
    return nok(code);
  }
  function basicSelfClosing(code) {
    if (code === codes.greaterThan) {
      effects.consume(code);
      return self.interrupt ? ok2 : continuation;
    }
    return nok(code);
  }
  function completeClosingTagAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeClosingTagAfter;
    }
    return completeEnd(code);
  }
  function completeAttributeNameBefore(code) {
    if (code === codes.slash) {
      effects.consume(code);
      return completeEnd;
    }
    if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
      effects.consume(code);
      return completeAttributeName;
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAttributeNameBefore;
    }
    return completeEnd(code);
  }
  function completeAttributeName(code) {
    if (code === codes.dash || code === codes.dot || code === codes.colon || code === codes.underscore || asciiAlphanumeric(code)) {
      effects.consume(code);
      return completeAttributeName;
    }
    return completeAttributeNameAfter(code);
  }
  function completeAttributeNameAfter(code) {
    if (code === codes.equalsTo) {
      effects.consume(code);
      return completeAttributeValueBefore;
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAttributeNameAfter;
    }
    return completeAttributeNameBefore(code);
  }
  function completeAttributeValueBefore(code) {
    if (code === codes.eof || code === codes.lessThan || code === codes.equalsTo || code === codes.greaterThan || code === codes.graveAccent) {
      return nok(code);
    }
    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.consume(code);
      markerB = code;
      return completeAttributeValueQuoted;
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAttributeValueBefore;
    }
    return completeAttributeValueUnquoted(code);
  }
  function completeAttributeValueQuoted(code) {
    if (code === markerB) {
      effects.consume(code);
      markerB = null;
      return completeAttributeValueQuotedAfter;
    }
    if (code === codes.eof || markdownLineEnding(code)) {
      return nok(code);
    }
    effects.consume(code);
    return completeAttributeValueQuoted;
  }
  function completeAttributeValueUnquoted(code) {
    if (code === codes.eof || code === codes.quotationMark || code === codes.apostrophe || code === codes.slash || code === codes.lessThan || code === codes.equalsTo || code === codes.greaterThan || code === codes.graveAccent || markdownLineEndingOrSpace(code)) {
      return completeAttributeNameAfter(code);
    }
    effects.consume(code);
    return completeAttributeValueUnquoted;
  }
  function completeAttributeValueQuotedAfter(code) {
    if (code === codes.slash || code === codes.greaterThan || markdownSpace(code)) {
      return completeAttributeNameBefore(code);
    }
    return nok(code);
  }
  function completeEnd(code) {
    if (code === codes.greaterThan) {
      effects.consume(code);
      return completeAfter;
    }
    return nok(code);
  }
  function completeAfter(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return continuation(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAfter;
    }
    return nok(code);
  }
  function continuation(code) {
    if (code === codes.dash && marker === constants.htmlComment) {
      effects.consume(code);
      return continuationCommentInside;
    }
    if (code === codes.lessThan && marker === constants.htmlRaw) {
      effects.consume(code);
      return continuationRawTagOpen;
    }
    if (code === codes.greaterThan && marker === constants.htmlDeclaration) {
      effects.consume(code);
      return continuationClose;
    }
    if (code === codes.questionMark && marker === constants.htmlInstruction) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    if (code === codes.rightSquareBracket && marker === constants.htmlCdata) {
      effects.consume(code);
      return continuationCdataInside;
    }
    if (markdownLineEnding(code) && (marker === constants.htmlBasic || marker === constants.htmlComplete)) {
      effects.exit(types.htmlFlowData);
      return effects.check(blankLineBefore, continuationAfter, continuationStart)(code);
    }
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.htmlFlowData);
      return continuationStart(code);
    }
    effects.consume(code);
    return continuation;
  }
  function continuationStart(code) {
    return effects.check(nonLazyContinuationStart, continuationStartNonLazy, continuationAfter)(code);
  }
  function continuationStartNonLazy(code) {
    ok(markdownLineEnding(code));
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return continuationBefore;
  }
  function continuationBefore(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      return continuationStart(code);
    }
    effects.enter(types.htmlFlowData);
    return continuation(code);
  }
  function continuationCommentInside(code) {
    if (code === codes.dash) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    return continuation(code);
  }
  function continuationRawTagOpen(code) {
    if (code === codes.slash) {
      effects.consume(code);
      buffer = "";
      return continuationRawEndTag;
    }
    return continuation(code);
  }
  function continuationRawEndTag(code) {
    if (code === codes.greaterThan) {
      const name = buffer.toLowerCase();
      if (htmlRawNames.includes(name)) {
        effects.consume(code);
        return continuationClose;
      }
      return continuation(code);
    }
    if (asciiAlpha(code) && buffer.length < constants.htmlRawSizeMax) {
      ok(code !== null);
      effects.consume(code);
      buffer += String.fromCharCode(code);
      return continuationRawEndTag;
    }
    return continuation(code);
  }
  function continuationCdataInside(code) {
    if (code === codes.rightSquareBracket) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    return continuation(code);
  }
  function continuationDeclarationInside(code) {
    if (code === codes.greaterThan) {
      effects.consume(code);
      return continuationClose;
    }
    if (code === codes.dash && marker === constants.htmlComment) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    return continuation(code);
  }
  function continuationClose(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.htmlFlowData);
      return continuationAfter(code);
    }
    effects.consume(code);
    return continuationClose;
  }
  function continuationAfter(code) {
    effects.exit(types.htmlFlow);
    return ok2(code);
  }
}
function tokenizeNonLazyContinuationStart(effects, ok2, nok) {
  const self = this;
  return start;
  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      return after;
    }
    return nok(code);
  }
  function after(code) {
    return self.parser.lazy[self.now().line] ? nok(code) : ok2(code);
  }
}
function tokenizeBlankLineBefore(effects, ok2, nok) {
  return start;
  function start(code) {
    ok(markdownLineEnding(code), "expected a line ending");
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return effects.attempt(blankLine, ok2, nok);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/html-text.js
var htmlText = { name: "htmlText", tokenize: tokenizeHtmlText };
function tokenizeHtmlText(effects, ok2, nok) {
  const self = this;
  let marker;
  let index;
  let returnState;
  return start;
  function start(code) {
    ok(code === codes.lessThan, "expected `<`");
    effects.enter(types.htmlText);
    effects.enter(types.htmlTextData);
    effects.consume(code);
    return open;
  }
  function open(code) {
    if (code === codes.exclamationMark) {
      effects.consume(code);
      return declarationOpen;
    }
    if (code === codes.slash) {
      effects.consume(code);
      return tagCloseStart;
    }
    if (code === codes.questionMark) {
      effects.consume(code);
      return instruction;
    }
    if (asciiAlpha(code)) {
      effects.consume(code);
      return tagOpen;
    }
    return nok(code);
  }
  function declarationOpen(code) {
    if (code === codes.dash) {
      effects.consume(code);
      return commentOpenInside;
    }
    if (code === codes.leftSquareBracket) {
      effects.consume(code);
      index = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code)) {
      effects.consume(code);
      return declaration;
    }
    return nok(code);
  }
  function commentOpenInside(code) {
    if (code === codes.dash) {
      effects.consume(code);
      return commentEnd;
    }
    return nok(code);
  }
  function comment(code) {
    if (code === codes.eof) {
      return nok(code);
    }
    if (code === codes.dash) {
      effects.consume(code);
      return commentClose;
    }
    if (markdownLineEnding(code)) {
      returnState = comment;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return comment;
  }
  function commentClose(code) {
    if (code === codes.dash) {
      effects.consume(code);
      return commentEnd;
    }
    return comment(code);
  }
  function commentEnd(code) {
    return code === codes.greaterThan ? end(code) : code === codes.dash ? commentClose(code) : comment(code);
  }
  function cdataOpenInside(code) {
    const value = constants.cdataOpeningString;
    if (code === value.charCodeAt(index++)) {
      effects.consume(code);
      return index === value.length ? cdata : cdataOpenInside;
    }
    return nok(code);
  }
  function cdata(code) {
    if (code === codes.eof) {
      return nok(code);
    }
    if (code === codes.rightSquareBracket) {
      effects.consume(code);
      return cdataClose;
    }
    if (markdownLineEnding(code)) {
      returnState = cdata;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return cdata;
  }
  function cdataClose(code) {
    if (code === codes.rightSquareBracket) {
      effects.consume(code);
      return cdataEnd;
    }
    return cdata(code);
  }
  function cdataEnd(code) {
    if (code === codes.greaterThan) {
      return end(code);
    }
    if (code === codes.rightSquareBracket) {
      effects.consume(code);
      return cdataEnd;
    }
    return cdata(code);
  }
  function declaration(code) {
    if (code === codes.eof || code === codes.greaterThan) {
      return end(code);
    }
    if (markdownLineEnding(code)) {
      returnState = declaration;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return declaration;
  }
  function instruction(code) {
    if (code === codes.eof) {
      return nok(code);
    }
    if (code === codes.questionMark) {
      effects.consume(code);
      return instructionClose;
    }
    if (markdownLineEnding(code)) {
      returnState = instruction;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return instruction;
  }
  function instructionClose(code) {
    return code === codes.greaterThan ? end(code) : instruction(code);
  }
  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      effects.consume(code);
      return tagClose;
    }
    return nok(code);
  }
  function tagClose(code) {
    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code);
      return tagClose;
    }
    return tagCloseBetween(code);
  }
  function tagCloseBetween(code) {
    if (markdownLineEnding(code)) {
      returnState = tagCloseBetween;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagCloseBetween;
    }
    return end(code);
  }
  function tagOpen(code) {
    if (code === codes.dash || asciiAlphanumeric(code)) {
      effects.consume(code);
      return tagOpen;
    }
    if (code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) {
      return tagOpenBetween(code);
    }
    return nok(code);
  }
  function tagOpenBetween(code) {
    if (code === codes.slash) {
      effects.consume(code);
      return end;
    }
    if (code === codes.colon || code === codes.underscore || asciiAlpha(code)) {
      effects.consume(code);
      return tagOpenAttributeName;
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenBetween;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagOpenBetween;
    }
    return end(code);
  }
  function tagOpenAttributeName(code) {
    if (code === codes.dash || code === codes.dot || code === codes.colon || code === codes.underscore || asciiAlphanumeric(code)) {
      effects.consume(code);
      return tagOpenAttributeName;
    }
    return tagOpenAttributeNameAfter(code);
  }
  function tagOpenAttributeNameAfter(code) {
    if (code === codes.equalsTo) {
      effects.consume(code);
      return tagOpenAttributeValueBefore;
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeNameAfter;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagOpenAttributeNameAfter;
    }
    return tagOpenBetween(code);
  }
  function tagOpenAttributeValueBefore(code) {
    if (code === codes.eof || code === codes.lessThan || code === codes.equalsTo || code === codes.greaterThan || code === codes.graveAccent) {
      return nok(code);
    }
    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.consume(code);
      marker = code;
      return tagOpenAttributeValueQuoted;
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeValueBefore;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagOpenAttributeValueBefore;
    }
    effects.consume(code);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuoted(code) {
    if (code === marker) {
      effects.consume(code);
      marker = undefined;
      return tagOpenAttributeValueQuotedAfter;
    }
    if (code === codes.eof) {
      return nok(code);
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeValueQuoted;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return tagOpenAttributeValueQuoted;
  }
  function tagOpenAttributeValueUnquoted(code) {
    if (code === codes.eof || code === codes.quotationMark || code === codes.apostrophe || code === codes.lessThan || code === codes.equalsTo || code === codes.graveAccent) {
      return nok(code);
    }
    if (code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) {
      return tagOpenBetween(code);
    }
    effects.consume(code);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuotedAfter(code) {
    if (code === codes.slash || code === codes.greaterThan || markdownLineEndingOrSpace(code)) {
      return tagOpenBetween(code);
    }
    return nok(code);
  }
  function end(code) {
    if (code === codes.greaterThan) {
      effects.consume(code);
      effects.exit(types.htmlTextData);
      effects.exit(types.htmlText);
      return ok2;
    }
    return nok(code);
  }
  function lineEndingBefore(code) {
    ok(returnState, "expected return state");
    ok(markdownLineEnding(code), "expected eol");
    effects.exit(types.htmlTextData);
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return lineEndingAfter;
  }
  function lineEndingAfter(code) {
    ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
    return markdownSpace(code) ? factorySpace(effects, lineEndingAfterPrefix, types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? undefined : constants.tabSize)(code) : lineEndingAfterPrefix(code);
  }
  function lineEndingAfterPrefix(code) {
    effects.enter(types.htmlTextData);
    return returnState(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/label-end.js
var labelEnd = {
  name: "labelEnd",
  resolveAll: resolveAllLabelEnd,
  resolveTo: resolveToLabelEnd,
  tokenize: tokenizeLabelEnd
};
var resourceConstruct = { tokenize: tokenizeResource };
var referenceFullConstruct = { tokenize: tokenizeReferenceFull };
var referenceCollapsedConstruct = { tokenize: tokenizeReferenceCollapsed };
function resolveAllLabelEnd(events) {
  let index = -1;
  const newEvents = [];
  while (++index < events.length) {
    const token = events[index][1];
    newEvents.push(events[index]);
    if (token.type === types.labelImage || token.type === types.labelLink || token.type === types.labelEnd) {
      const offset = token.type === types.labelImage ? 4 : 2;
      token.type = types.data;
      index += offset;
    }
  }
  if (events.length !== newEvents.length) {
    splice(events, 0, events.length, newEvents);
  }
  return events;
}
function resolveToLabelEnd(events, context) {
  let index = events.length;
  let offset = 0;
  let token;
  let open;
  let close;
  let media;
  while (index--) {
    token = events[index][1];
    if (open) {
      if (token.type === types.link || token.type === types.labelLink && token._inactive) {
        break;
      }
      if (events[index][0] === "enter" && token.type === types.labelLink) {
        token._inactive = true;
      }
    } else if (close) {
      if (events[index][0] === "enter" && (token.type === types.labelImage || token.type === types.labelLink) && !token._balanced) {
        open = index;
        if (token.type !== types.labelLink) {
          offset = 2;
          break;
        }
      }
    } else if (token.type === types.labelEnd) {
      close = index;
    }
  }
  ok(open !== undefined, "`open` is supposed to be found");
  ok(close !== undefined, "`close` is supposed to be found");
  const group = {
    type: events[open][1].type === types.labelLink ? types.link : types.image,
    start: { ...events[open][1].start },
    end: { ...events[events.length - 1][1].end }
  };
  const label = {
    type: types.label,
    start: { ...events[open][1].start },
    end: { ...events[close][1].end }
  };
  const text = {
    type: types.labelText,
    start: { ...events[open + offset + 2][1].end },
    end: { ...events[close - 2][1].start }
  };
  media = [
    ["enter", group, context],
    ["enter", label, context]
  ];
  media = push(media, events.slice(open + 1, open + offset + 3));
  media = push(media, [["enter", text, context]]);
  ok(context.parser.constructs.insideSpan.null, "expected `insideSpan.null` to be populated");
  media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close - 3), context));
  media = push(media, [
    ["exit", text, context],
    events[close - 2],
    events[close - 1],
    ["exit", label, context]
  ]);
  media = push(media, events.slice(close + 1));
  media = push(media, [["exit", group, context]]);
  splice(events, open, events.length, media);
  return events;
}
function tokenizeLabelEnd(effects, ok2, nok) {
  const self = this;
  let index = self.events.length;
  let labelStart;
  let defined;
  while (index--) {
    if ((self.events[index][1].type === types.labelImage || self.events[index][1].type === types.labelLink) && !self.events[index][1]._balanced) {
      labelStart = self.events[index][1];
      break;
    }
  }
  return start;
  function start(code) {
    ok(code === codes.rightSquareBracket, "expected `]`");
    if (!labelStart) {
      return nok(code);
    }
    if (labelStart._inactive) {
      return labelEndNok(code);
    }
    defined = self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize({ start: labelStart.end, end: self.now() })));
    effects.enter(types.labelEnd);
    effects.enter(types.labelMarker);
    effects.consume(code);
    effects.exit(types.labelMarker);
    effects.exit(types.labelEnd);
    return after;
  }
  function after(code) {
    if (code === codes.leftParenthesis) {
      return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code);
    }
    if (code === codes.leftSquareBracket) {
      return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code);
    }
    return defined ? labelEndOk(code) : labelEndNok(code);
  }
  function referenceNotFull(code) {
    return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code);
  }
  function labelEndOk(code) {
    return ok2(code);
  }
  function labelEndNok(code) {
    labelStart._balanced = true;
    return nok(code);
  }
}
function tokenizeResource(effects, ok2, nok) {
  return resourceStart;
  function resourceStart(code) {
    ok(code === codes.leftParenthesis, "expected left paren");
    effects.enter(types.resource);
    effects.enter(types.resourceMarker);
    effects.consume(code);
    effects.exit(types.resourceMarker);
    return resourceBefore;
  }
  function resourceBefore(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceOpen)(code) : resourceOpen(code);
  }
  function resourceOpen(code) {
    if (code === codes.rightParenthesis) {
      return resourceEnd(code);
    }
    return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, types.resourceDestination, types.resourceDestinationLiteral, types.resourceDestinationLiteralMarker, types.resourceDestinationRaw, types.resourceDestinationString, constants.linkResourceDestinationBalanceMax)(code);
  }
  function resourceDestinationAfter(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceBetween)(code) : resourceEnd(code);
  }
  function resourceDestinationMissing(code) {
    return nok(code);
  }
  function resourceBetween(code) {
    if (code === codes.quotationMark || code === codes.apostrophe || code === codes.leftParenthesis) {
      return factoryTitle(effects, resourceTitleAfter, nok, types.resourceTitle, types.resourceTitleMarker, types.resourceTitleString)(code);
    }
    return resourceEnd(code);
  }
  function resourceTitleAfter(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceEnd)(code) : resourceEnd(code);
  }
  function resourceEnd(code) {
    if (code === codes.rightParenthesis) {
      effects.enter(types.resourceMarker);
      effects.consume(code);
      effects.exit(types.resourceMarker);
      effects.exit(types.resource);
      return ok2;
    }
    return nok(code);
  }
}
function tokenizeReferenceFull(effects, ok2, nok) {
  const self = this;
  return referenceFull;
  function referenceFull(code) {
    ok(code === codes.leftSquareBracket, "expected left bracket");
    return factoryLabel.call(self, effects, referenceFullAfter, referenceFullMissing, types.reference, types.referenceMarker, types.referenceString)(code);
  }
  function referenceFullAfter(code) {
    return self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1))) ? ok2(code) : nok(code);
  }
  function referenceFullMissing(code) {
    return nok(code);
  }
}
function tokenizeReferenceCollapsed(effects, ok2, nok) {
  return referenceCollapsedStart;
  function referenceCollapsedStart(code) {
    ok(code === codes.leftSquareBracket, "expected left bracket");
    effects.enter(types.reference);
    effects.enter(types.referenceMarker);
    effects.consume(code);
    effects.exit(types.referenceMarker);
    return referenceCollapsedOpen;
  }
  function referenceCollapsedOpen(code) {
    if (code === codes.rightSquareBracket) {
      effects.enter(types.referenceMarker);
      effects.consume(code);
      effects.exit(types.referenceMarker);
      effects.exit(types.reference);
      return ok2;
    }
    return nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/label-start-image.js
var labelStartImage = {
  name: "labelStartImage",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartImage
};
function tokenizeLabelStartImage(effects, ok2, nok) {
  const self = this;
  return start;
  function start(code) {
    ok(code === codes.exclamationMark, "expected `!`");
    effects.enter(types.labelImage);
    effects.enter(types.labelImageMarker);
    effects.consume(code);
    effects.exit(types.labelImageMarker);
    return open;
  }
  function open(code) {
    if (code === codes.leftSquareBracket) {
      effects.enter(types.labelMarker);
      effects.consume(code);
      effects.exit(types.labelMarker);
      effects.exit(types.labelImage);
      return after;
    }
    return nok(code);
  }
  function after(code) {
    return code === codes.caret && "_hiddenFootnoteSupport" in self.parser.constructs ? nok(code) : ok2(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/label-start-link.js
var labelStartLink = {
  name: "labelStartLink",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartLink
};
function tokenizeLabelStartLink(effects, ok2, nok) {
  const self = this;
  return start;
  function start(code) {
    ok(code === codes.leftSquareBracket, "expected `[`");
    effects.enter(types.labelLink);
    effects.enter(types.labelMarker);
    effects.consume(code);
    effects.exit(types.labelMarker);
    effects.exit(types.labelLink);
    return after;
  }
  function after(code) {
    return code === codes.caret && "_hiddenFootnoteSupport" in self.parser.constructs ? nok(code) : ok2(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/line-ending.js
var lineEnding = { name: "lineEnding", tokenize: tokenizeLineEnding };
function tokenizeLineEnding(effects, ok2) {
  return start;
  function start(code) {
    ok(markdownLineEnding(code), "expected eol");
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return factorySpace(effects, ok2, types.linePrefix);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/thematic-break.js
var thematicBreak = {
  name: "thematicBreak",
  tokenize: tokenizeThematicBreak
};
function tokenizeThematicBreak(effects, ok2, nok) {
  let size = 0;
  let marker;
  return start;
  function start(code) {
    effects.enter(types.thematicBreak);
    return before(code);
  }
  function before(code) {
    ok(code === codes.asterisk || code === codes.dash || code === codes.underscore, "expected `*`, `-`, or `_`");
    marker = code;
    return atBreak(code);
  }
  function atBreak(code) {
    if (code === marker) {
      effects.enter(types.thematicBreakSequence);
      return sequence(code);
    }
    if (size >= constants.thematicBreakMarkerCountMin && (code === codes.eof || markdownLineEnding(code))) {
      effects.exit(types.thematicBreak);
      return ok2(code);
    }
    return nok(code);
  }
  function sequence(code) {
    if (code === marker) {
      effects.consume(code);
      size++;
      return sequence;
    }
    effects.exit(types.thematicBreakSequence);
    return markdownSpace(code) ? factorySpace(effects, atBreak, types.whitespace)(code) : atBreak(code);
  }
}

// node_modules/micromark-core-commonmark/dev/lib/list.js
var list = {
  continuation: { tokenize: tokenizeListContinuation },
  exit: tokenizeListEnd,
  name: "list",
  tokenize: tokenizeListStart
};
var listItemPrefixWhitespaceConstruct = {
  partial: true,
  tokenize: tokenizeListItemPrefixWhitespace
};
var indentConstruct = { partial: true, tokenize: tokenizeIndent };
function tokenizeListStart(effects, ok2, nok) {
  const self = this;
  const tail = self.events[self.events.length - 1];
  let initialSize = tail && tail[1].type === types.linePrefix ? tail[2].sliceSerialize(tail[1], true).length : 0;
  let size = 0;
  return start;
  function start(code) {
    ok(self.containerState, "expected state");
    const kind = self.containerState.type || (code === codes.asterisk || code === codes.plusSign || code === codes.dash ? types.listUnordered : types.listOrdered);
    if (kind === types.listUnordered ? !self.containerState.marker || code === self.containerState.marker : asciiDigit(code)) {
      if (!self.containerState.type) {
        self.containerState.type = kind;
        effects.enter(kind, { _container: true });
      }
      if (kind === types.listUnordered) {
        effects.enter(types.listItemPrefix);
        return code === codes.asterisk || code === codes.dash ? effects.check(thematicBreak, nok, atMarker)(code) : atMarker(code);
      }
      if (!self.interrupt || code === codes.digit1) {
        effects.enter(types.listItemPrefix);
        effects.enter(types.listItemValue);
        return inside(code);
      }
    }
    return nok(code);
  }
  function inside(code) {
    ok(self.containerState, "expected state");
    if (asciiDigit(code) && ++size < constants.listItemValueSizeMax) {
      effects.consume(code);
      return inside;
    }
    if ((!self.interrupt || size < 2) && (self.containerState.marker ? code === self.containerState.marker : code === codes.rightParenthesis || code === codes.dot)) {
      effects.exit(types.listItemValue);
      return atMarker(code);
    }
    return nok(code);
  }
  function atMarker(code) {
    ok(self.containerState, "expected state");
    ok(code !== codes.eof, "eof (`null`) is not a marker");
    effects.enter(types.listItemMarker);
    effects.consume(code);
    effects.exit(types.listItemMarker);
    self.containerState.marker = self.containerState.marker || code;
    return effects.check(blankLine, self.interrupt ? nok : onBlank, effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix));
  }
  function onBlank(code) {
    ok(self.containerState, "expected state");
    self.containerState.initialBlankLine = true;
    initialSize++;
    return endOfPrefix(code);
  }
  function otherPrefix(code) {
    if (markdownSpace(code)) {
      effects.enter(types.listItemPrefixWhitespace);
      effects.consume(code);
      effects.exit(types.listItemPrefixWhitespace);
      return endOfPrefix;
    }
    return nok(code);
  }
  function endOfPrefix(code) {
    ok(self.containerState, "expected state");
    self.containerState.size = initialSize + self.sliceSerialize(effects.exit(types.listItemPrefix), true).length;
    return ok2(code);
  }
}
function tokenizeListContinuation(effects, ok2, nok) {
  const self = this;
  ok(self.containerState, "expected state");
  self.containerState._closeFlow = undefined;
  return effects.check(blankLine, onBlank, notBlank);
  function onBlank(code) {
    ok(self.containerState, "expected state");
    ok(typeof self.containerState.size === "number", "expected size");
    self.containerState.furtherBlankLines = self.containerState.furtherBlankLines || self.containerState.initialBlankLine;
    return factorySpace(effects, ok2, types.listItemIndent, self.containerState.size + 1)(code);
  }
  function notBlank(code) {
    ok(self.containerState, "expected state");
    if (self.containerState.furtherBlankLines || !markdownSpace(code)) {
      self.containerState.furtherBlankLines = undefined;
      self.containerState.initialBlankLine = undefined;
      return notInCurrentItem(code);
    }
    self.containerState.furtherBlankLines = undefined;
    self.containerState.initialBlankLine = undefined;
    return effects.attempt(indentConstruct, ok2, notInCurrentItem)(code);
  }
  function notInCurrentItem(code) {
    ok(self.containerState, "expected state");
    self.containerState._closeFlow = true;
    self.interrupt = undefined;
    ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
    return factorySpace(effects, effects.attempt(list, ok2, nok), types.linePrefix, self.parser.constructs.disable.null.includes("codeIndented") ? undefined : constants.tabSize)(code);
  }
}
function tokenizeIndent(effects, ok2, nok) {
  const self = this;
  ok(self.containerState, "expected state");
  ok(typeof self.containerState.size === "number", "expected size");
  return factorySpace(effects, afterPrefix, types.listItemIndent, self.containerState.size + 1);
  function afterPrefix(code) {
    ok(self.containerState, "expected state");
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === types.listItemIndent && tail[2].sliceSerialize(tail[1], true).length === self.containerState.size ? ok2(code) : nok(code);
  }
}
function tokenizeListEnd(effects) {
  ok(this.containerState, "expected state");
  ok(typeof this.containerState.type === "string", "expected type");
  effects.exit(this.containerState.type);
}
function tokenizeListItemPrefixWhitespace(effects, ok2, nok) {
  const self = this;
  ok(self.parser.constructs.disable.null, "expected `disable.null` to be populated");
  return factorySpace(effects, afterPrefix, types.listItemPrefixWhitespace, self.parser.constructs.disable.null.includes("codeIndented") ? undefined : constants.tabSize + 1);
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return !markdownSpace(code) && tail && tail[1].type === types.listItemPrefixWhitespace ? ok2(code) : nok(code);
  }
}
// node_modules/micromark-core-commonmark/dev/lib/setext-underline.js
var setextUnderline = {
  name: "setextUnderline",
  resolveTo: resolveToSetextUnderline,
  tokenize: tokenizeSetextUnderline
};
function resolveToSetextUnderline(events, context) {
  let index = events.length;
  let content3;
  let text;
  let definition2;
  while (index--) {
    if (events[index][0] === "enter") {
      if (events[index][1].type === types.content) {
        content3 = index;
        break;
      }
      if (events[index][1].type === types.paragraph) {
        text = index;
      }
    } else {
      if (events[index][1].type === types.content) {
        events.splice(index, 1);
      }
      if (!definition2 && events[index][1].type === types.definition) {
        definition2 = index;
      }
    }
  }
  ok(text !== undefined, "expected a `text` index to be found");
  ok(content3 !== undefined, "expected a `text` index to be found");
  ok(events[content3][2] === context, "enter context should be same");
  ok(events[events.length - 1][2] === context, "enter context should be same");
  const heading = {
    type: types.setextHeading,
    start: { ...events[content3][1].start },
    end: { ...events[events.length - 1][1].end }
  };
  events[text][1].type = types.setextHeadingText;
  if (definition2) {
    events.splice(text, 0, ["enter", heading, context]);
    events.splice(definition2 + 1, 0, ["exit", events[content3][1], context]);
    events[content3][1].end = { ...events[definition2][1].end };
  } else {
    events[content3][1] = heading;
  }
  events.push(["exit", heading, context]);
  return events;
}
function tokenizeSetextUnderline(effects, ok2, nok) {
  const self = this;
  let marker;
  return start;
  function start(code) {
    let index = self.events.length;
    let paragraph;
    ok(code === codes.dash || code === codes.equalsTo, "expected `=` or `-`");
    while (index--) {
      if (self.events[index][1].type !== types.lineEnding && self.events[index][1].type !== types.linePrefix && self.events[index][1].type !== types.content) {
        paragraph = self.events[index][1].type === types.paragraph;
        break;
      }
    }
    if (!self.parser.lazy[self.now().line] && (self.interrupt || paragraph)) {
      effects.enter(types.setextHeadingLine);
      marker = code;
      return before(code);
    }
    return nok(code);
  }
  function before(code) {
    effects.enter(types.setextHeadingLineSequence);
    return inside(code);
  }
  function inside(code) {
    if (code === marker) {
      effects.consume(code);
      return inside;
    }
    effects.exit(types.setextHeadingLineSequence);
    return markdownSpace(code) ? factorySpace(effects, after, types.lineSuffix)(code) : after(code);
  }
  function after(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.setextHeadingLine);
      return ok2(code);
    }
    return nok(code);
  }
}
// node_modules/micromark/dev/lib/initialize/flow.js
var flow = { tokenize: initializeFlow };
function initializeFlow(effects) {
  const self = this;
  const initial = effects.attempt(blankLine, atBlankEnding, effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content2, afterConstruct)), types.linePrefix)));
  return initial;
  function atBlankEnding(code) {
    ok(code === codes.eof || markdownLineEnding(code), "expected eol or eof");
    if (code === codes.eof) {
      effects.consume(code);
      return;
    }
    effects.enter(types.lineEndingBlank);
    effects.consume(code);
    effects.exit(types.lineEndingBlank);
    self.currentConstruct = undefined;
    return initial;
  }
  function afterConstruct(code) {
    ok(code === codes.eof || markdownLineEnding(code), "expected eol or eof");
    if (code === codes.eof) {
      effects.consume(code);
      return;
    }
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    self.currentConstruct = undefined;
    return initial;
  }
}

// node_modules/micromark/dev/lib/initialize/text.js
var resolver = { resolveAll: createResolver() };
var string = initializeFactory("string");
var text = initializeFactory("text");
function initializeFactory(field) {
  return {
    resolveAll: createResolver(field === "text" ? resolveAllLineSuffixes : undefined),
    tokenize: initializeText
  };
  function initializeText(effects) {
    const self = this;
    const constructs2 = this.parser.constructs[field];
    const text2 = effects.attempt(constructs2, start, notText);
    return start;
    function start(code) {
      return atBreak(code) ? text2(code) : notText(code);
    }
    function notText(code) {
      if (code === codes.eof) {
        effects.consume(code);
        return;
      }
      effects.enter(types.data);
      effects.consume(code);
      return data;
    }
    function data(code) {
      if (atBreak(code)) {
        effects.exit(types.data);
        return text2(code);
      }
      effects.consume(code);
      return data;
    }
    function atBreak(code) {
      if (code === codes.eof) {
        return true;
      }
      const list2 = constructs2[code];
      let index = -1;
      if (list2) {
        ok(Array.isArray(list2), "expected `disable.null` to be populated");
        while (++index < list2.length) {
          const item = list2[index];
          if (!item.previous || item.previous.call(self, self.previous)) {
            return true;
          }
        }
      }
      return false;
    }
  }
}
function createResolver(extraResolver) {
  return resolveAllText;
  function resolveAllText(events, context) {
    let index = -1;
    let enter;
    while (++index <= events.length) {
      if (enter === undefined) {
        if (events[index] && events[index][1].type === types.data) {
          enter = index;
          index++;
        }
      } else if (!events[index] || events[index][1].type !== types.data) {
        if (index !== enter + 2) {
          events[enter][1].end = events[index - 1][1].end;
          events.splice(enter + 2, index - enter - 2);
          index = enter + 2;
        }
        enter = undefined;
      }
    }
    return extraResolver ? extraResolver(events, context) : events;
  }
}
function resolveAllLineSuffixes(events, context) {
  let eventIndex = 0;
  while (++eventIndex <= events.length) {
    if ((eventIndex === events.length || events[eventIndex][1].type === types.lineEnding) && events[eventIndex - 1][1].type === types.data) {
      const data = events[eventIndex - 1][1];
      const chunks = context.sliceStream(data);
      let index = chunks.length;
      let bufferIndex = -1;
      let size = 0;
      let tabs;
      while (index--) {
        const chunk = chunks[index];
        if (typeof chunk === "string") {
          bufferIndex = chunk.length;
          while (chunk.charCodeAt(bufferIndex - 1) === codes.space) {
            size++;
            bufferIndex--;
          }
          if (bufferIndex)
            break;
          bufferIndex = -1;
        } else if (chunk === codes.horizontalTab) {
          tabs = true;
          size++;
        } else if (chunk === codes.virtualSpace) {} else {
          index++;
          break;
        }
      }
      if (context._contentTypeTextTrailing && eventIndex === events.length) {
        size = 0;
      }
      if (size) {
        const token = {
          type: eventIndex === events.length || tabs || size < constants.hardBreakPrefixSizeMin ? types.lineSuffix : types.hardBreakTrailing,
          start: {
            _bufferIndex: index ? bufferIndex : data.start._bufferIndex + bufferIndex,
            _index: data.start._index + index,
            line: data.end.line,
            column: data.end.column - size,
            offset: data.end.offset - size
          },
          end: { ...data.end }
        };
        data.end = { ...token.start };
        if (data.start.offset === data.end.offset) {
          Object.assign(data, token);
        } else {
          events.splice(eventIndex, 0, ["enter", token, context], ["exit", token, context]);
          eventIndex += 2;
        }
      }
      eventIndex++;
    }
  }
  return events;
}

// node_modules/micromark/dev/lib/constructs.js
var exports_constructs = {};
__export(exports_constructs, {
  text: () => text2,
  string: () => string2,
  insideSpan: () => insideSpan,
  flowInitial: () => flowInitial,
  flow: () => flow2,
  document: () => document3,
  disable: () => disable,
  contentInitial: () => contentInitial,
  attentionMarkers: () => attentionMarkers
});
var document3 = {
  [codes.asterisk]: list,
  [codes.plusSign]: list,
  [codes.dash]: list,
  [codes.digit0]: list,
  [codes.digit1]: list,
  [codes.digit2]: list,
  [codes.digit3]: list,
  [codes.digit4]: list,
  [codes.digit5]: list,
  [codes.digit6]: list,
  [codes.digit7]: list,
  [codes.digit8]: list,
  [codes.digit9]: list,
  [codes.greaterThan]: blockQuote
};
var contentInitial = {
  [codes.leftSquareBracket]: definition
};
var flowInitial = {
  [codes.horizontalTab]: codeIndented,
  [codes.virtualSpace]: codeIndented,
  [codes.space]: codeIndented
};
var flow2 = {
  [codes.numberSign]: headingAtx,
  [codes.asterisk]: thematicBreak,
  [codes.dash]: [setextUnderline, thematicBreak],
  [codes.lessThan]: htmlFlow,
  [codes.equalsTo]: setextUnderline,
  [codes.underscore]: thematicBreak,
  [codes.graveAccent]: codeFenced,
  [codes.tilde]: codeFenced
};
var string2 = {
  [codes.ampersand]: characterReference,
  [codes.backslash]: characterEscape
};
var text2 = {
  [codes.carriageReturn]: lineEnding,
  [codes.lineFeed]: lineEnding,
  [codes.carriageReturnLineFeed]: lineEnding,
  [codes.exclamationMark]: labelStartImage,
  [codes.ampersand]: characterReference,
  [codes.asterisk]: attention,
  [codes.lessThan]: [autolink, htmlText],
  [codes.leftSquareBracket]: labelStartLink,
  [codes.backslash]: [hardBreakEscape, characterEscape],
  [codes.rightSquareBracket]: labelEnd,
  [codes.underscore]: attention,
  [codes.graveAccent]: codeText
};
var insideSpan = { null: [attention, resolver] };
var attentionMarkers = { null: [codes.asterisk, codes.underscore] };
var disable = { null: [] };

// node_modules/micromark/dev/lib/create-tokenizer.js
var import_debug = __toESM(require_browser(), 1);
var debug = import_debug.default("micromark");
function createTokenizer(parser, initialize, from) {
  let point = {
    _bufferIndex: -1,
    _index: 0,
    line: from && from.line || 1,
    column: from && from.column || 1,
    offset: from && from.offset || 0
  };
  const columnStart = {};
  const resolveAllConstructs = [];
  let chunks = [];
  let stack = [];
  let consumed = true;
  const effects = {
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    consume,
    enter,
    exit: exit2,
    interrupt: constructFactory(onsuccessfulcheck, { interrupt: true })
  };
  const context = {
    code: codes.eof,
    containerState: {},
    defineSkip,
    events: [],
    now,
    parser,
    previous: codes.eof,
    sliceSerialize,
    sliceStream,
    write
  };
  let state = initialize.tokenize.call(context, effects);
  let expectedCode;
  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize);
  }
  return context;
  function write(slice) {
    chunks = push(chunks, slice);
    main();
    if (chunks[chunks.length - 1] !== codes.eof) {
      return [];
    }
    addResult(initialize, 0);
    context.events = resolveAll(resolveAllConstructs, context.events, context);
    return context.events;
  }
  function sliceSerialize(token, expandTabs) {
    return serializeChunks(sliceStream(token), expandTabs);
  }
  function sliceStream(token) {
    return sliceChunks(chunks, token);
  }
  function now() {
    const { _bufferIndex, _index, line, column, offset } = point;
    return { _bufferIndex, _index, line, column, offset };
  }
  function defineSkip(value) {
    columnStart[value.line] = value.column;
    accountForPotentialSkip();
    debug("position: define skip: `%j`", point);
  }
  function main() {
    let chunkIndex;
    while (point._index < chunks.length) {
      const chunk = chunks[point._index];
      if (typeof chunk === "string") {
        chunkIndex = point._index;
        if (point._bufferIndex < 0) {
          point._bufferIndex = 0;
        }
        while (point._index === chunkIndex && point._bufferIndex < chunk.length) {
          go(chunk.charCodeAt(point._bufferIndex));
        }
      } else {
        go(chunk);
      }
    }
  }
  function go(code) {
    ok(consumed === true, "expected character to be consumed");
    consumed = undefined;
    debug("main: passing `%s` to %s", code, state && state.name);
    expectedCode = code;
    ok(typeof state === "function", "expected state");
    state = state(code);
  }
  function consume(code) {
    ok(code === expectedCode, "expected given code to equal expected code");
    debug("consume: `%s`", code);
    ok(consumed === undefined, "expected code to not have been consumed: this might be because `return x(code)` instead of `return x` was used");
    ok(code === null ? context.events.length === 0 || context.events[context.events.length - 1][0] === "exit" : context.events[context.events.length - 1][0] === "enter", "expected last token to be open");
    if (markdownLineEnding(code)) {
      point.line++;
      point.column = 1;
      point.offset += code === codes.carriageReturnLineFeed ? 2 : 1;
      accountForPotentialSkip();
      debug("position: after eol: `%j`", point);
    } else if (code !== codes.virtualSpace) {
      point.column++;
      point.offset++;
    }
    if (point._bufferIndex < 0) {
      point._index++;
    } else {
      point._bufferIndex++;
      if (point._bufferIndex === chunks[point._index].length) {
        point._bufferIndex = -1;
        point._index++;
      }
    }
    context.previous = code;
    consumed = true;
  }
  function enter(type, fields) {
    const token = fields || {};
    token.type = type;
    token.start = now();
    ok(typeof type === "string", "expected string type");
    ok(type.length > 0, "expected non-empty string");
    debug("enter: `%s`", type);
    context.events.push(["enter", token, context]);
    stack.push(token);
    return token;
  }
  function exit2(type) {
    ok(typeof type === "string", "expected string type");
    ok(type.length > 0, "expected non-empty string");
    const token = stack.pop();
    ok(token, "cannot close w/o open tokens");
    token.end = now();
    ok(type === token.type, "expected exit token to match current token");
    ok(!(token.start._index === token.end._index && token.start._bufferIndex === token.end._bufferIndex), "expected non-empty token (`" + type + "`)");
    debug("exit: `%s`", token.type);
    context.events.push(["exit", token, context]);
    return token;
  }
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from);
  }
  function onsuccessfulcheck(_, info) {
    info.restore();
  }
  function constructFactory(onreturn, fields) {
    return hook;
    function hook(constructs2, returnState, bogusState) {
      let listOfConstructs;
      let constructIndex;
      let currentConstruct;
      let info;
      return Array.isArray(constructs2) ? handleListOfConstructs(constructs2) : ("tokenize" in constructs2) ? handleListOfConstructs([constructs2]) : handleMapOfConstructs(constructs2);
      function handleMapOfConstructs(map) {
        return start;
        function start(code) {
          const left = code !== null && map[code];
          const all2 = code !== null && map.null;
          const list2 = [
            ...Array.isArray(left) ? left : left ? [left] : [],
            ...Array.isArray(all2) ? all2 : all2 ? [all2] : []
          ];
          return handleListOfConstructs(list2)(code);
        }
      }
      function handleListOfConstructs(list2) {
        listOfConstructs = list2;
        constructIndex = 0;
        if (list2.length === 0) {
          ok(bogusState, "expected `bogusState` to be given");
          return bogusState;
        }
        return handleConstruct(list2[constructIndex]);
      }
      function handleConstruct(construct) {
        return start;
        function start(code) {
          info = store();
          currentConstruct = construct;
          if (!construct.partial) {
            context.currentConstruct = construct;
          }
          ok(context.parser.constructs.disable.null, "expected `disable.null` to be populated");
          if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) {
            return nok(code);
          }
          return construct.tokenize.call(fields ? Object.assign(Object.create(context), fields) : context, effects, ok2, nok)(code);
        }
      }
      function ok2(code) {
        ok(code === expectedCode, "expected code");
        consumed = true;
        onreturn(currentConstruct, info);
        return returnState;
      }
      function nok(code) {
        ok(code === expectedCode, "expected code");
        consumed = true;
        info.restore();
        if (++constructIndex < listOfConstructs.length) {
          return handleConstruct(listOfConstructs[constructIndex]);
        }
        return bogusState;
      }
    }
  }
  function addResult(construct, from2) {
    if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
      resolveAllConstructs.push(construct);
    }
    if (construct.resolve) {
      splice(context.events, from2, context.events.length - from2, construct.resolve(context.events.slice(from2), context));
    }
    if (construct.resolveTo) {
      context.events = construct.resolveTo(context.events, context);
    }
    ok(construct.partial || context.events.length === 0 || context.events[context.events.length - 1][0] === "exit", "expected last token to end");
  }
  function store() {
    const startPoint = now();
    const startPrevious = context.previous;
    const startCurrentConstruct = context.currentConstruct;
    const startEventsIndex = context.events.length;
    const startStack = Array.from(stack);
    return { from: startEventsIndex, restore };
    function restore() {
      point = startPoint;
      context.previous = startPrevious;
      context.currentConstruct = startCurrentConstruct;
      context.events.length = startEventsIndex;
      stack = startStack;
      accountForPotentialSkip();
      debug("position: restore: `%j`", point);
    }
  }
  function accountForPotentialSkip() {
    if (point.line in columnStart && point.column < 2) {
      point.column = columnStart[point.line];
      point.offset += columnStart[point.line] - 1;
    }
  }
}
function sliceChunks(chunks, token) {
  const startIndex = token.start._index;
  const startBufferIndex = token.start._bufferIndex;
  const endIndex = token.end._index;
  const endBufferIndex = token.end._bufferIndex;
  let view;
  if (startIndex === endIndex) {
    ok(endBufferIndex > -1, "expected non-negative end buffer index");
    ok(startBufferIndex > -1, "expected non-negative start buffer index");
    view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
  } else {
    view = chunks.slice(startIndex, endIndex);
    if (startBufferIndex > -1) {
      const head = view[0];
      if (typeof head === "string") {
        view[0] = head.slice(startBufferIndex);
      } else {
        ok(startBufferIndex === 0, "expected `startBufferIndex` to be `0`");
        view.shift();
      }
    }
    if (endBufferIndex > 0) {
      view.push(chunks[endIndex].slice(0, endBufferIndex));
    }
  }
  return view;
}
function serializeChunks(chunks, expandTabs) {
  let index = -1;
  const result = [];
  let atTab;
  while (++index < chunks.length) {
    const chunk = chunks[index];
    let value;
    if (typeof chunk === "string") {
      value = chunk;
    } else
      switch (chunk) {
        case codes.carriageReturn: {
          value = values.cr;
          break;
        }
        case codes.lineFeed: {
          value = values.lf;
          break;
        }
        case codes.carriageReturnLineFeed: {
          value = values.cr + values.lf;
          break;
        }
        case codes.horizontalTab: {
          value = expandTabs ? values.space : values.ht;
          break;
        }
        case codes.virtualSpace: {
          if (!expandTabs && atTab)
            continue;
          value = values.space;
          break;
        }
        default: {
          ok(typeof chunk === "number", "expected number");
          value = String.fromCharCode(chunk);
        }
      }
    atTab = chunk === codes.horizontalTab;
    result.push(value);
  }
  return result.join("");
}

// node_modules/micromark/dev/lib/parse.js
function parse(options) {
  const settings = options || {};
  const constructs2 = combineExtensions([exports_constructs, ...settings.extensions || []]);
  const parser = {
    constructs: constructs2,
    content: create(content),
    defined: [],
    document: create(document2),
    flow: create(flow),
    lazy: {},
    string: create(string),
    text: create(text)
  };
  return parser;
  function create(initial) {
    return creator;
    function creator(from) {
      return createTokenizer(parser, initial, from);
    }
  }
}

// node_modules/micromark/dev/lib/postprocess.js
function postprocess(events) {
  while (!subtokenize(events)) {}
  return events;
}

// node_modules/micromark/dev/lib/preprocess.js
var search = /[\0\t\n\r]/g;
function preprocess() {
  let column = 1;
  let buffer = "";
  let start = true;
  let atCarriageReturn;
  return preprocessor;
  function preprocessor(value, encoding, end) {
    const chunks = [];
    let match;
    let next;
    let startPosition;
    let endPosition;
    let code;
    value = buffer + (typeof value === "string" ? value.toString() : new TextDecoder(encoding || undefined).decode(value));
    startPosition = 0;
    buffer = "";
    if (start) {
      if (value.charCodeAt(0) === codes.byteOrderMarker) {
        startPosition++;
      }
      start = undefined;
    }
    while (startPosition < value.length) {
      search.lastIndex = startPosition;
      match = search.exec(value);
      endPosition = match && match.index !== undefined ? match.index : value.length;
      code = value.charCodeAt(endPosition);
      if (!match) {
        buffer = value.slice(startPosition);
        break;
      }
      if (code === codes.lf && startPosition === endPosition && atCarriageReturn) {
        chunks.push(codes.carriageReturnLineFeed);
        atCarriageReturn = undefined;
      } else {
        if (atCarriageReturn) {
          chunks.push(codes.carriageReturn);
          atCarriageReturn = undefined;
        }
        if (startPosition < endPosition) {
          chunks.push(value.slice(startPosition, endPosition));
          column += endPosition - startPosition;
        }
        switch (code) {
          case codes.nul: {
            chunks.push(codes.replacementCharacter);
            column++;
            break;
          }
          case codes.ht: {
            next = Math.ceil(column / constants.tabSize) * constants.tabSize;
            chunks.push(codes.horizontalTab);
            while (column++ < next)
              chunks.push(codes.virtualSpace);
            break;
          }
          case codes.lf: {
            chunks.push(codes.lineFeed);
            column = 1;
            break;
          }
          default: {
            atCarriageReturn = true;
            column = 1;
          }
        }
      }
      startPosition = endPosition + 1;
    }
    if (end) {
      if (atCarriageReturn)
        chunks.push(codes.carriageReturn);
      if (buffer)
        chunks.push(buffer);
      chunks.push(codes.eof);
    }
    return chunks;
  }
}
// node_modules/micromark-util-decode-string/dev/index.js
var characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
function decodeString(value) {
  return value.replace(characterEscapeOrReference, decode);
}
function decode($0, $1, $2) {
  if ($1) {
    return $1;
  }
  const head = $2.charCodeAt(0);
  if (head === codes.numberSign) {
    const head2 = $2.charCodeAt(1);
    const hex = head2 === codes.lowercaseX || head2 === codes.uppercaseX;
    return decodeNumericCharacterReference($2.slice(hex ? 2 : 1), hex ? constants.numericBaseHexadecimal : constants.numericBaseDecimal);
  }
  return decodeNamedCharacterReference($2) || $0;
}

// node_modules/unist-util-stringify-position/lib/index.js
function stringifyPosition(value) {
  if (!value || typeof value !== "object") {
    return "";
  }
  if ("position" in value || "type" in value) {
    return position(value.position);
  }
  if ("start" in value || "end" in value) {
    return position(value);
  }
  if ("line" in value || "column" in value) {
    return point(value);
  }
  return "";
}
function point(point2) {
  return index(point2 && point2.line) + ":" + index(point2 && point2.column);
}
function position(pos) {
  return point(pos && pos.start) + "-" + point(pos && pos.end);
}
function index(value) {
  return value && typeof value === "number" ? value : 1;
}
// node_modules/mdast-util-from-markdown/dev/lib/index.js
var own = {}.hasOwnProperty;
function fromMarkdown(value, encoding, options) {
  if (encoding && typeof encoding === "object") {
    options = encoding;
    encoding = undefined;
  }
  return compiler(options)(postprocess(parse(options).document().write(preprocess()(value, encoding, true))));
}
function compiler(options) {
  const config = {
    transforms: [],
    canContainEols: ["emphasis", "fragment", "heading", "paragraph", "strong"],
    enter: {
      autolink: opener(link),
      autolinkProtocol: onenterdata,
      autolinkEmail: onenterdata,
      atxHeading: opener(heading),
      blockQuote: opener(blockQuote2),
      characterEscape: onenterdata,
      characterReference: onenterdata,
      codeFenced: opener(codeFlow),
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeIndented: opener(codeFlow, buffer),
      codeText: opener(codeText2, buffer),
      codeTextData: onenterdata,
      data: onenterdata,
      codeFlowValue: onenterdata,
      definition: opener(definition2),
      definitionDestinationString: buffer,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: opener(emphasis),
      hardBreakEscape: opener(hardBreak),
      hardBreakTrailing: opener(hardBreak),
      htmlFlow: opener(html, buffer),
      htmlFlowData: onenterdata,
      htmlText: opener(html, buffer),
      htmlTextData: onenterdata,
      image: opener(image),
      label: buffer,
      link: opener(link),
      listItem: opener(listItem),
      listItemValue: onenterlistitemvalue,
      listOrdered: opener(list2, onenterlistordered),
      listUnordered: opener(list2),
      paragraph: opener(paragraph),
      reference: onenterreference,
      referenceString: buffer,
      resourceDestinationString: buffer,
      resourceTitleString: buffer,
      setextHeading: opener(heading),
      strong: opener(strong),
      thematicBreak: opener(thematicBreak2)
    },
    exit: {
      atxHeading: closer(),
      atxHeadingSequence: onexitatxheadingsequence,
      autolink: closer(),
      autolinkEmail: onexitautolinkemail,
      autolinkProtocol: onexitautolinkprotocol,
      blockQuote: closer(),
      characterEscapeValue: onexitdata,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReference: onexitcharacterreference,
      codeFenced: closer(onexitcodefenced),
      codeFencedFence: onexitcodefencedfence,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: onexitcodefencedfencemeta,
      codeFlowValue: onexitdata,
      codeIndented: closer(onexitcodeindented),
      codeText: closer(onexitcodetext),
      codeTextData: onexitdata,
      data: onexitdata,
      definition: closer(),
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
      emphasis: closer(),
      hardBreakEscape: closer(onexithardbreak),
      hardBreakTrailing: closer(onexithardbreak),
      htmlFlow: closer(onexithtmlflow),
      htmlFlowData: onexitdata,
      htmlText: closer(onexithtmltext),
      htmlTextData: onexitdata,
      image: closer(onexitimage),
      label: onexitlabel,
      labelText: onexitlabeltext,
      lineEnding: onexitlineending,
      link: closer(onexitlink),
      listItem: closer(),
      listOrdered: closer(),
      listUnordered: closer(),
      paragraph: closer(),
      referenceString: onexitreferencestring,
      resourceDestinationString: onexitresourcedestinationstring,
      resourceTitleString: onexitresourcetitlestring,
      resource: onexitresource,
      setextHeading: closer(onexitsetextheading),
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      setextHeadingText: onexitsetextheadingtext,
      strong: closer(),
      thematicBreak: closer()
    }
  };
  configure(config, (options || {}).mdastExtensions || []);
  const data = {};
  return compile;
  function compile(events) {
    let tree = { type: "root", children: [] };
    const context = {
      stack: [tree],
      tokenStack: [],
      config,
      enter,
      exit: exit2,
      buffer,
      resume,
      data
    };
    const listStack = [];
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === types.listOrdered || events[index2][1].type === types.listUnordered) {
        if (events[index2][0] === "enter") {
          listStack.push(index2);
        } else {
          const tail = listStack.pop();
          ok(typeof tail === "number", "expected list to be open");
          index2 = prepareList(events, tail, index2);
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      const handler = config[events[index2][0]];
      if (own.call(handler, events[index2][1].type)) {
        handler[events[index2][1].type].call(Object.assign({ sliceSerialize: events[index2][2].sliceSerialize }, context), events[index2][1]);
      }
    }
    if (context.tokenStack.length > 0) {
      const tail = context.tokenStack[context.tokenStack.length - 1];
      const handler = tail[1] || defaultOnError;
      handler.call(context, undefined, tail[0]);
    }
    tree.position = {
      start: point2(events.length > 0 ? events[0][1].start : { line: 1, column: 1, offset: 0 }),
      end: point2(events.length > 0 ? events[events.length - 2][1].end : { line: 1, column: 1, offset: 0 })
    };
    index2 = -1;
    while (++index2 < config.transforms.length) {
      tree = config.transforms[index2](tree) || tree;
    }
    return tree;
  }
  function prepareList(events, start, length) {
    let index2 = start - 1;
    let containerBalance = -1;
    let listSpread = false;
    let listItem2;
    let lineIndex;
    let firstBlankLineIndex;
    let atMarker;
    while (++index2 <= length) {
      const event = events[index2];
      switch (event[1].type) {
        case types.listUnordered:
        case types.listOrdered:
        case types.blockQuote: {
          if (event[0] === "enter") {
            containerBalance++;
          } else {
            containerBalance--;
          }
          atMarker = undefined;
          break;
        }
        case types.lineEndingBlank: {
          if (event[0] === "enter") {
            if (listItem2 && !atMarker && !containerBalance && !firstBlankLineIndex) {
              firstBlankLineIndex = index2;
            }
            atMarker = undefined;
          }
          break;
        }
        case types.linePrefix:
        case types.listItemValue:
        case types.listItemMarker:
        case types.listItemPrefix:
        case types.listItemPrefixWhitespace: {
          break;
        }
        default: {
          atMarker = undefined;
        }
      }
      if (!containerBalance && event[0] === "enter" && event[1].type === types.listItemPrefix || containerBalance === -1 && event[0] === "exit" && (event[1].type === types.listUnordered || event[1].type === types.listOrdered)) {
        if (listItem2) {
          let tailIndex = index2;
          lineIndex = undefined;
          while (tailIndex--) {
            const tailEvent = events[tailIndex];
            if (tailEvent[1].type === types.lineEnding || tailEvent[1].type === types.lineEndingBlank) {
              if (tailEvent[0] === "exit")
                continue;
              if (lineIndex) {
                events[lineIndex][1].type = types.lineEndingBlank;
                listSpread = true;
              }
              tailEvent[1].type = types.lineEnding;
              lineIndex = tailIndex;
            } else if (tailEvent[1].type === types.linePrefix || tailEvent[1].type === types.blockQuotePrefix || tailEvent[1].type === types.blockQuotePrefixWhitespace || tailEvent[1].type === types.blockQuoteMarker || tailEvent[1].type === types.listItemIndent) {} else {
              break;
            }
          }
          if (firstBlankLineIndex && (!lineIndex || firstBlankLineIndex < lineIndex)) {
            listItem2._spread = true;
          }
          listItem2.end = Object.assign({}, lineIndex ? events[lineIndex][1].start : event[1].end);
          events.splice(lineIndex || index2, 0, ["exit", listItem2, event[2]]);
          index2++;
          length++;
        }
        if (event[1].type === types.listItemPrefix) {
          const item = {
            type: "listItem",
            _spread: false,
            start: Object.assign({}, event[1].start),
            end: undefined
          };
          listItem2 = item;
          events.splice(index2, 0, ["enter", item, event[2]]);
          index2++;
          length++;
          firstBlankLineIndex = undefined;
          atMarker = true;
        }
      }
    }
    events[start][1]._spread = listSpread;
    return length;
  }
  function opener(create, and) {
    return open;
    function open(token) {
      enter.call(this, create(token), token);
      if (and)
        and.call(this, token);
    }
  }
  function buffer() {
    this.stack.push({ type: "fragment", children: [] });
  }
  function enter(node2, token, errorHandler) {
    const parent = this.stack[this.stack.length - 1];
    ok(parent, "expected `parent`");
    ok("children" in parent, "expected `parent`");
    const siblings = parent.children;
    siblings.push(node2);
    this.stack.push(node2);
    this.tokenStack.push([token, errorHandler || undefined]);
    node2.position = {
      start: point2(token.start),
      end: undefined
    };
  }
  function closer(and) {
    return close;
    function close(token) {
      if (and)
        and.call(this, token);
      exit2.call(this, token);
    }
  }
  function exit2(token, onExitError) {
    const node2 = this.stack.pop();
    ok(node2, "expected `node`");
    const open = this.tokenStack.pop();
    if (!open) {
      throw new Error("Cannot close `" + token.type + "` (" + stringifyPosition({ start: token.start, end: token.end }) + "): it’s not open");
    } else if (open[0].type !== token.type) {
      if (onExitError) {
        onExitError.call(this, token, open[0]);
      } else {
        const handler = open[1] || defaultOnError;
        handler.call(this, token, open[0]);
      }
    }
    ok(node2.type !== "fragment", "unexpected fragment `exit`ed");
    ok(node2.position, "expected `position` to be defined");
    node2.position.end = point2(token.end);
  }
  function resume() {
    return toString(this.stack.pop());
  }
  function onenterlistordered() {
    this.data.expectingFirstListItemValue = true;
  }
  function onenterlistitemvalue(token) {
    if (this.data.expectingFirstListItemValue) {
      const ancestor = this.stack[this.stack.length - 2];
      ok(ancestor, "expected nodes on stack");
      ok(ancestor.type === "list", "expected list on stack");
      ancestor.start = Number.parseInt(this.sliceSerialize(token), constants.numericBaseDecimal);
      this.data.expectingFirstListItemValue = undefined;
    }
  }
  function onexitcodefencedfenceinfo() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "code", "expected code on stack");
    node2.lang = data2;
  }
  function onexitcodefencedfencemeta() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "code", "expected code on stack");
    node2.meta = data2;
  }
  function onexitcodefencedfence() {
    if (this.data.flowCodeInside)
      return;
    this.buffer();
    this.data.flowCodeInside = true;
  }
  function onexitcodefenced() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "code", "expected code on stack");
    node2.value = data2.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
    this.data.flowCodeInside = undefined;
  }
  function onexitcodeindented() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "code", "expected code on stack");
    node2.value = data2.replace(/(\r?\n|\r)$/g, "");
  }
  function onexitdefinitionlabelstring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "definition", "expected definition on stack");
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
  }
  function onexitdefinitiontitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "definition", "expected definition on stack");
    node2.title = data2;
  }
  function onexitdefinitiondestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "definition", "expected definition on stack");
    node2.url = data2;
  }
  function onexitatxheadingsequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "heading", "expected heading on stack");
    if (!node2.depth) {
      const depth = this.sliceSerialize(token).length;
      ok(depth === 1 || depth === 2 || depth === 3 || depth === 4 || depth === 5 || depth === 6, "expected `depth` between `1` and `6`");
      node2.depth = depth;
    }
  }
  function onexitsetextheadingtext() {
    this.data.setextHeadingSlurpLineEnding = true;
  }
  function onexitsetextheadinglinesequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "heading", "expected heading on stack");
    node2.depth = this.sliceSerialize(token).codePointAt(0) === codes.equalsTo ? 1 : 2;
  }
  function onexitsetextheading() {
    this.data.setextHeadingSlurpLineEnding = undefined;
  }
  function onenterdata(token) {
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok("children" in node2, "expected parent on stack");
    const siblings = node2.children;
    let tail = siblings[siblings.length - 1];
    if (!tail || tail.type !== "text") {
      tail = text3();
      tail.position = {
        start: point2(token.start),
        end: undefined
      };
      siblings.push(tail);
    }
    this.stack.push(tail);
  }
  function onexitdata(token) {
    const tail = this.stack.pop();
    ok(tail, "expected a `node` to be on the stack");
    ok("value" in tail, "expected a `literal` to be on the stack");
    ok(tail.position, "expected `node` to have an open position");
    tail.value += this.sliceSerialize(token);
    tail.position.end = point2(token.end);
  }
  function onexitlineending(token) {
    const context = this.stack[this.stack.length - 1];
    ok(context, "expected `node`");
    if (this.data.atHardBreak) {
      ok("children" in context, "expected `parent`");
      const tail = context.children[context.children.length - 1];
      ok(tail.position, "expected tail to have a starting position");
      tail.position.end = point2(token.end);
      this.data.atHardBreak = undefined;
      return;
    }
    if (!this.data.setextHeadingSlurpLineEnding && config.canContainEols.includes(context.type)) {
      onenterdata.call(this, token);
      onexitdata.call(this, token);
    }
  }
  function onexithardbreak() {
    this.data.atHardBreak = true;
  }
  function onexithtmlflow() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "html", "expected html on stack");
    node2.value = data2;
  }
  function onexithtmltext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "html", "expected html on stack");
    node2.value = data2;
  }
  function onexitcodetext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "inlineCode", "expected inline code on stack");
    node2.value = data2;
  }
  function onexitlink() {
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "link", "expected link on stack");
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = undefined;
  }
  function onexitimage() {
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "image", "expected image on stack");
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = undefined;
  }
  function onexitlabeltext(token) {
    const string3 = this.sliceSerialize(token);
    const ancestor = this.stack[this.stack.length - 2];
    ok(ancestor, "expected ancestor on stack");
    ok(ancestor.type === "image" || ancestor.type === "link", "expected image or link on stack");
    ancestor.label = decodeString(string3);
    ancestor.identifier = normalizeIdentifier(string3).toLowerCase();
  }
  function onexitlabel() {
    const fragment = this.stack[this.stack.length - 1];
    ok(fragment, "expected node on stack");
    ok(fragment.type === "fragment", "expected fragment on stack");
    const value = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "image" || node2.type === "link", "expected image or link on stack");
    this.data.inReference = true;
    if (node2.type === "link") {
      const children = fragment.children;
      node2.children = children;
    } else {
      node2.alt = value;
    }
  }
  function onexitresourcedestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "image" || node2.type === "link", "expected image or link on stack");
    node2.url = data2;
  }
  function onexitresourcetitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "image" || node2.type === "link", "expected image or link on stack");
    node2.title = data2;
  }
  function onexitresource() {
    this.data.inReference = undefined;
  }
  function onenterreference() {
    this.data.referenceType = "collapsed";
  }
  function onexitreferencestring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "image" || node2.type === "link", "expected image reference or link reference on stack");
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
    this.data.referenceType = "full";
  }
  function onexitcharacterreferencemarker(token) {
    ok(token.type === "characterReferenceMarkerNumeric" || token.type === "characterReferenceMarkerHexadecimal");
    this.data.characterReferenceType = token.type;
  }
  function onexitcharacterreferencevalue(token) {
    const data2 = this.sliceSerialize(token);
    const type = this.data.characterReferenceType;
    let value;
    if (type) {
      value = decodeNumericCharacterReference(data2, type === types.characterReferenceMarkerNumeric ? constants.numericBaseDecimal : constants.numericBaseHexadecimal);
      this.data.characterReferenceType = undefined;
    } else {
      const result = decodeNamedCharacterReference(data2);
      ok(result !== false, "expected reference to decode");
      value = result;
    }
    const tail = this.stack[this.stack.length - 1];
    ok(tail, "expected `node`");
    ok("value" in tail, "expected `node.value`");
    tail.value += value;
  }
  function onexitcharacterreference(token) {
    const tail = this.stack.pop();
    ok(tail, "expected `node`");
    ok(tail.position, "expected `node.position`");
    tail.position.end = point2(token.end);
  }
  function onexitautolinkprotocol(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "link", "expected link on stack");
    node2.url = this.sliceSerialize(token);
  }
  function onexitautolinkemail(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    ok(node2, "expected node on stack");
    ok(node2.type === "link", "expected link on stack");
    node2.url = "mailto:" + this.sliceSerialize(token);
  }
  function blockQuote2() {
    return { type: "blockquote", children: [] };
  }
  function codeFlow() {
    return { type: "code", lang: null, meta: null, value: "" };
  }
  function codeText2() {
    return { type: "inlineCode", value: "" };
  }
  function definition2() {
    return {
      type: "definition",
      identifier: "",
      label: null,
      title: null,
      url: ""
    };
  }
  function emphasis() {
    return { type: "emphasis", children: [] };
  }
  function heading() {
    return {
      type: "heading",
      depth: 0,
      children: []
    };
  }
  function hardBreak() {
    return { type: "break" };
  }
  function html() {
    return { type: "html", value: "" };
  }
  function image() {
    return { type: "image", title: null, url: "", alt: null };
  }
  function link() {
    return { type: "link", title: null, url: "", children: [] };
  }
  function list2(token) {
    return {
      type: "list",
      ordered: token.type === "listOrdered",
      start: null,
      spread: token._spread,
      children: []
    };
  }
  function listItem(token) {
    return {
      type: "listItem",
      spread: token._spread,
      checked: null,
      children: []
    };
  }
  function paragraph() {
    return { type: "paragraph", children: [] };
  }
  function strong() {
    return { type: "strong", children: [] };
  }
  function text3() {
    return { type: "text", value: "" };
  }
  function thematicBreak2() {
    return { type: "thematicBreak" };
  }
}
function point2(d) {
  return { line: d.line, column: d.column, offset: d.offset };
}
function configure(combined, extensions) {
  let index2 = -1;
  while (++index2 < extensions.length) {
    const value = extensions[index2];
    if (Array.isArray(value)) {
      configure(combined, value);
    } else {
      extension(combined, value);
    }
  }
}
function extension(combined, extension2) {
  let key;
  for (key in extension2) {
    if (own.call(extension2, key)) {
      switch (key) {
        case "canContainEols": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "transforms": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "enter":
        case "exit": {
          const right = extension2[key];
          if (right) {
            Object.assign(combined[key], right);
          }
          break;
        }
      }
    }
  }
}
function defaultOnError(left, right) {
  if (left) {
    throw new Error("Cannot close `" + left.type + "` (" + stringifyPosition({ start: left.start, end: left.end }) + "): a different token (`" + right.type + "`, " + stringifyPosition({ start: right.start, end: right.end }) + ") is open");
  } else {
    throw new Error("Cannot close document, a token (`" + right.type + "`, " + stringifyPosition({ start: right.start, end: right.end }) + ") is still open");
  }
}
// src/components/link.ts
class Link {
  static draw(terminal, text3, url, row, col, backColour = 16, fgColour = 13, hoverBackColour = 13, hoverFgColour = 16) {
    const isHovered = terminal.mouseAt(row, col, 1, text3.length);
    const wasHovered = terminal.mouseDownAt(row, col, 1, text3.length);
    if (isHovered && wasHovered && terminal.mouseClick) {
      if (url.startsWith("mailto:")) {
        const a = document.createElement("a");
        a.href = url;
        a.click();
      } else if (url.startsWith("#")) {
        window.location.hash = url;
      } else {
        window.open(url, "_blank");
      }
    } else if (isHovered) {
      document.body.className = "pointer";
      const detail = url.startsWith("#") ? window.location.origin + url : url;
      terminal.detailText = " " + detail + " ";
    }
    const bg = isHovered ? hoverBackColour : backColour;
    const fg = isHovered ? hoverFgColour : fgColour;
    terminal.drawText(text3, row, col, bg, fg, 0, 0, false, Glyph.ITALIC_BOLD_FONT);
  }
}

// src/components/markdown.ts
class Markdown {
  static SECTION_TYPES = [
    "code",
    "heading",
    "list",
    "listItem",
    "paragraph"
  ];
  terminal;
  root;
  rows = 1;
  constructor(terminal, markdown) {
    this.terminal = terminal;
    this.root = fromMarkdown(markdown);
    console.log(this.root);
  }
  draw(row, col, rows, cols) {
    if (rows <= 0 || cols <= 0) {
      return;
    }
    const stack = [this.root];
    const indexes = [0];
    const fonts = [Glyph.NORMAL_FONT];
    let depth = 0;
    let r = row - 2;
    let c = col;
    let bg = 16;
    let fg = 17;
    let list_idx = 0;
    let list_content_flag = false;
    while (stack.length > 0) {
      const parent = stack[depth];
      const idx = indexes[depth];
      if (idx >= parent.children.length) {
        stack.pop();
        indexes.pop();
        fonts.pop();
        depth--;
        continue;
      }
      let node2 = parent.children[idx];
      indexes[depth] = idx + 1;
      if (!node2) {
        continue;
      }
      const is_list_content = node2.type === "paragraph" && list_content_flag;
      if (is_list_content) {
        list_content_flag = false;
      }
      if (Markdown.SECTION_TYPES.includes(node2.type) && !is_list_content) {
        r += node2.type.startsWith("list") ? 1 : 2;
        c = col;
      }
      const is_link = node2.type === "link";
      const link_url = is_link ? node2.url : "";
      if (is_link) {
        node2 = node2.children[0];
      }
      let font = fonts[depth];
      const is_normal_font = font === Glyph.NORMAL_FONT;
      if ("children" in node2) {
        switch (node2.type) {
          case "heading":
            const heading = node2;
            if (r >= row && r < row + rows) {
              this.terminal.drawText("#".repeat(heading.depth), r, c, 16, 7);
            }
            c += heading.depth + 1;
            break;
          case "list":
            list_idx = 1;
            break;
          case "listItem":
            const text4 = " -  ";
            if (r >= row && r < row + rows) {
              this.terminal.drawText(text4, r, c, 16, 7);
            }
            c += text4.length;
            list_content_flag = true;
            break;
          case "emphasis":
            font = is_normal_font ? Glyph.ITALIC_FONT : Glyph.ITALIC_BOLD_FONT;
            break;
          case "strong":
            font = is_normal_font ? Glyph.BOLD_FONT : Glyph.ITALIC_BOLD_FONT;
            break;
        }
        stack.push(node2);
        indexes.push(0);
        fonts.push(font);
        depth++;
        continue;
      } else if (node2.type === "thematicBreak") {
        c = col;
        r += 2;
        if (r >= row && r < row + rows) {
          this.terminal.drawText("----", r, c, 16, 7);
        }
        continue;
      }
      if (node2.type !== "text") {
        continue;
      }
      let text3 = node2.value;
      text3 = text3.replace(/\s+/g, " ");
      if (is_link) {
        if (c + text3.length > col + cols) {
          r++;
          c = col;
        }
        if (r >= row && r < row + rows) {
          Link.draw(this.terminal, text3, link_url, r, c);
        }
        c += text3.length;
        if (c > col + cols) {
          r++;
          c = col;
        }
        continue;
      }
      const words = text3.split(" ");
      for (let i = 0;i < words.length; i++) {
        let word = i === words.length - 1 ? words[i] : words[i] + " ";
        const visible_word = word.replace(/&(\d{1,2}|n)(.)?;/g, "");
        const visible_len = visible_word.trimEnd().length;
        if (visible_len <= cols && c + visible_len > col + cols) {
          r++;
          c = col;
        }
        while (true) {
          const match = word.match(/&(\d{1,2}|n)(.)?;/);
          if (!match) {
            if (word.length > 0) {
              if (word === " " && c === col) {} else if (r >= row && r < row + rows) {
                this.terminal.drawText(word, r, c, bg, fg, 0, 0, false, font);
                c += word.length;
              }
            }
            break;
          }
          const prefix = word.substring(0, match.index);
          if (prefix.length > 0) {
            if (r >= row && r < row + rows) {
              this.terminal.drawText(prefix, r, c, bg, fg, 0, 0, false, font);
            }
            c += prefix.length;
          }
          if (match[1] === "n") {
            r++;
            c = col;
          } else if (match[2] === "b") {
            bg = parseInt(match[1]);
          } else {
            fg = parseInt(match[1]);
          }
          word = word.substring(match.index + match[0].length);
        }
      }
    }
    this.rows = r - row + 1;
  }
}

// src/content/index.md
var content_default = `&7;README&17; |
[Education](#education) |
[Experience](#experience) |
[Projects](#projects) |
[Blog](#blog)

# **micahdb.com**

Welcome to my website.
I'm Micah Baker, a Software Developer from Vancouver, BC, Canada.

I am currently finishing a Bachelor of Science in Computing Science at
[Simon Fraser University^](https://www.sfu.ca/fas/computing.html).
Previously, I've worked at
[Open WebUI^](https://openwebui.com),
[Improving^](https://improving.com), and
[Brave Technology Coop^](https://brave.coop).

You can learn about my **Education**, **Experience**, and
**Projects** by clicking on the corresponding section tab above.
`;

// src/content/education.md
var education_default = `[README](#) |
&7;Education&17; |
[Experience](#experience) |
[Projects](#projects) |
[Blog](#blog)

# **Education**

## BSc Computing Science

I'm working towards a Bachelor of Science in Computing Science at [Simon Fraser University^](https://www.sfu.ca/fas/computing.html).

I've completed coursework in:

- Systems programming (CMPT 201, 454)
- Databases & DBMS implementation (CMPT 354, 454, 496)
- Machine learning (CMPT 310, 410)
- Computer vision (CMPT 361, 415, 416)
- Computer graphics (CMPT 361)

## Research

I've also been involved with research labs at SFU.
For more details regarding the following projects, see the **Projects** page.

### [Data-Intensive Systems (DIS) Lab^](https://github.com/sfu-dis)

(TBD): working on a project for optimizing DBMS data structures on high-performance modern hardware.

### [Tangent Lab^](https://tangent.cs.sfu.ca)

[Isaac ROS Gestures^](https://github.com/micahdbak/isaac_ros_gestures):
built a computer vision system for recognizing motion gestures, for use in a robotic guide dog.

`;

// src/content/experience.md
var experience_default = `[README](#) |
[Education](#education) |
&7;Experience&17; |
[Projects](#projects) |
[Blog](#blog)

# Experience

## [Open WebUI^](https://openwebui.com)

**Software Developer**&n;
Contract, Part-time&n;
Jan 2026 - Apr 2026&n;
Austin, TX, USA

## [Improving^](https://improving.com)

**Software Developer 1**&n;
Co-op, Full-time&n;
Sep 2024 - Aug 2025&n;
Vancouver, BC, Canada

## [Brave Technology Coop^](https://brave.coop)

**Firmware and Software Developer**&n;
Co-op, Full-time&n;
Sep 2023 - Apr 2024&n;
Vancouver, BC, Canada
`;

// src/content/projects.md
var projects_default = `[README](#) |
[Education](#education) |
[Experience](#experience) |
&7;Projects&17; |
[Blog](#blog)

# Projects

## Gestures for Robotic Guide Dog

- [GitHub Repository^](https://github.com/micahdbak/isaac_ros_gestures)
- 2025 Sep - 2026 Apr

Computer vision system for recognizing motion gestures.

Used online learning model for personalized interaction.

----

## Cheddar and Feta

- [Steam^](https://store.steampowered.com/app/4266860/Cheddar_and_Feta/)
- [GitHub Repository^](https://github.com/micahdbak/cheddar-and-feta)
- 2025 Jan - 2026 Feb

A short two-player cooperative adventure where you must save Cheddar and Feta from the perils of a militarized fire ant colony.

Game and engine built using [SDL3^](https://libsdl.org/) and [libdatachannel^](https://libdatachannel.org/) in C++.

----

## GleebleGlob

- [Archived Website^](https://web.archive.org/web/20250315161759/http://gleebleglob.club/)
- [GitHub Repository^](https://github.com/Vixlump/GG)
- 2024 May - 2024 June

Video streaming service on your terminal written in C++.

MP4 videos are decoded by [FFmpeg^](https://www.ffmpeg.org/), and displayed in ASCII.

Video storage and authentication facilitated by remote server.

----

## droppr.net

- [Website^](https://droppr.net)
- [GitHub Repository^](https://github.com/micahdbak/droppr)
- 2024 Mar - 2025 Jun

Send files over the internet using the peer-to-peer [WebRTC API^](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API).

Large files are chunked into blobs and stored in the [IndexedDB API^](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) for fast retrieval and recovery of failed packets.

Signal channel written in Go uses six-letter codes for peer discovery.

----

## PacMacro

- [GitHub Repository^](https://github.com/micahdbak/pacmacro)
- 2023 Jun - 2023 Sep

PacMan played in real life with a mobile web application.

Uses [Geolocation API^](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) to track player locations.

Synchronizes players with a WebSocket server written in Go.

----

## Yell P2P Library

- [GitHub Repository^](https://github.com/micahdbak/yell)
- 2023 Feb - 2023 Apr

C library for P2P applications and example chat program.

Built using BSD sockets for POSIX-compliant systems.

----

## EXEIRUS ARG

- [GitHub Repository^](https://github.com/micahdbak/exeirus)
- 2022 Dec - 2023 Feb

ARG where players compete by solving cryptographic puzzles.
`;

// src/content/blog.md
var blog_default = `[README](#) |
[Education](#education) |
[Experience](#experience) |
[Projects](#projects) |
&7;Blog&17;

# Blog

Check back here in the future...
`;

// src/content.ts
var INDEX_URL = "#";
var EDUCATION_URL = "#education";
var EXPERIENCE_URL = "#experience";
var PROJECTS_URL = "#projects";
var BLOG_URL = "#blog";
var _files = [
  [INDEX_URL, content_default],
  [EDUCATION_URL, education_default],
  [EXPERIENCE_URL, experience_default],
  [PROJECTS_URL, projects_default],
  [BLOG_URL, blog_default]
];
var CONTENT = {};
function loadContent() {
  for (let i = 0;i < _files.length; i++) {
    const url = _files[i][0];
    const md = _files[i][1];
    CONTENT[url] = md;
  }
}

// src/index.ts
var PALETTE = [
  40,
  42,
  46,
  165,
  66,
  66,
  222,
  147,
  95,
  140,
  148,
  64,
  94,
  141,
  135,
  95,
  129,
  157,
  133,
  103,
  143,
  134,
  136,
  134,
  55,
  59,
  65,
  204,
  102,
  102,
  240,
  198,
  116,
  181,
  189,
  104,
  138,
  190,
  183,
  129,
  162,
  190,
  178,
  148,
  187,
  213,
  216,
  214,
  17,
  17,
  18,
  205,
  205,
  205
];
var PANE_RATIO = 1 - 1 / 1.618;
var PANE_COLS = 50;
var PANE_ROW_PADDING = 1;
var PANE_COL_PADDING = 2;
var SESSION_DATE = Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
}).format(Date.now()).replace(/,/g, "");
var BANNER = `********************************************************************
Session: ${SESSION_DATE} on tty1
Welcome to micahdb.com!
********************************************************************`;
var CARD = `&15;█▐▌▀ % ▄▖▐% ▐▀▄ ▄ ▌▄ ▄ ▄ &n;
▌▌▌█▐▀▘▗▟▐▜ ▐▀▄ ▄▌▙▘▐▄▌▌▀&n;
▌ ▌█▐▄▞▚▟▐▐ ▐▄▀▝▄▌▌▙▝▄ ▌&17;&n;
&n;
&12;**I am a**&17;: % % Software Developer&n;
&12;**Based in**&17;: % Vancouver, BC, Canada&n;
&12;**Currently**&17;: %Studying&n;
&12;**Previously**&17;: Open WebUI, Improving, Brave&n;
&12;**Education**&17;: %BSc Computing Science at SFU&n;
&n;
&12;**E-mail**&17;: % % [mailto:\\<micah_baker@sfu.ca\\>](mailto:<micah_baker@sfu.ca>)&n;
&12;**GitHub**&17;: % % [https://github.com/micahdbak](https://github.com/micahdbak)&n;
&12;**LinkedIn**&17;: % [https://linkedin.com/in/micahdbak](https://linkedin.com/in/micahdbak)&n;
&12;**Resume/CV**&17;: %[/resume.pdf](https://micahdb.com/resume.pdf)

&0;███&1;███&3;███&2;███&5;███&6;███&4;███&7;███&n;
&8;███&9;███&11;███&10;███&13;███&14;███&12;███&15;███

----`.replaceAll("%", "&17; &15;");
var main = async () => {
  const log = document.getElementById("log");
  const canvas = document.getElementById("webgl");
  loadContent();
  try {
    const startTime = Date.now();
    let stillLoading = true;
    setTimeout(() => {
      if (stillLoading) {
        log.className = "";
      }
    }, 500);
    const logMessage = (source, message) => {
      let timestamp = ((Date.now() - startTime) / 1000).toFixed(6);
      const leadingSpaces = " ".repeat(12 - timestamp.length);
      timestamp = `[${leadingSpaces}${timestamp}]`;
      const pre = document.createElement("pre");
      pre.textContent = `${timestamp} ${source}: ${message}`;
      log.appendChild(pre);
    };
    const banner = document.createElement("pre");
    banner.textContent = BANNER;
    log.appendChild(banner);
    const terminal = new Terminal(canvas, logMessage);
    await terminal.init();
    if (Date.now() - startTime > 500) {
      logMessage("micahdb.com", "done loading");
      const prompt = "[micah@micahdb.com ~]$ ";
      const pre = document.createElement("pre");
      pre.textContent = prompt;
      log.appendChild(pre);
      for (let i = 0;i < 3; i++) {
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        const block = i % 2 === 0 ? "█" : "";
        pre.textContent = prompt + block;
      }
      const cmd = "./dashboard.sh";
      for (let i = 0;i <= cmd.length; i++) {
        pre.textContent = prompt + cmd.substr(0, i) + "█";
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      }
      pre.textContent = prompt + cmd + `
█`;
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }
    stillLoading = false;
    log.className = "hidden";
    canvas.className = "";
    terminal.setPalette(new Float32Array(PALETTE.map((e) => e / 255)));
    const divider = new Divider(terminal, PANE_RATIO, false);
    const scrollable = new Scrollable(terminal);
    const mdcard = new Markdown(terminal, CARD);
    const mdcache = {};
    let url = window.location.hash;
    if (!CONTENT[url]) {
      url = INDEX_URL;
    }
    let mdbody = new Markdown(terminal, CONTENT[url]);
    mdcache[url] = mdbody;
    window.addEventListener("hashchange", () => {
      let new_url = window.location.hash;
      if (new_url.length === 0) {
        new_url = INDEX_URL;
      }
      if (!CONTENT[new_url]) {
        window.location.hash = INDEX_URL;
        return;
      }
      url = new_url;
      if (!mdcache[url]) {
        mdbody = new Markdown(terminal, CONTENT[url]);
        mdcache[url] = mdbody;
      } else {
        mdbody = mdcache[url];
      }
    });
    let row_offset = 0;
    const draw = () => {
      terminal.clear();
      let pane1, pane2;
      if (terminal.cols > 2 * terminal.rows) {
        divider.setFrac(PANE_RATIO);
        divider.draw(Divider.VERTICAL, 0, 0, terminal.rows, terminal.cols, 0, PANE_COLS);
        const lcols = divider.lcols;
        pane1 = [0, 0, terminal.rows, lcols];
        pane2 = [0, lcols + 1, terminal.rows, terminal.cols - lcols - 1];
        terminal.resize(...pane2);
      } else {
        divider.setFrac(0.5);
        divider.draw(Divider.HORIZONTAL, 0, 0, terminal.rows, terminal.cols, 0, 0);
        const trows = divider.trows;
        pane1 = [0, 0, trows, terminal.cols];
        pane2 = [trows + 1, 0, terminal.rows - trows - 1, terminal.cols];
        terminal.resize(...pane2);
      }
      const card_row = PANE_ROW_PADDING - row_offset;
      mdcard.draw(card_row, pane1[1] + PANE_COL_PADDING, pane1[2] - card_row, pane1[3] - 2 * PANE_COL_PADDING);
      const body_row = card_row + mdcard.rows + 1;
      mdbody.draw(body_row, pane1[1] + PANE_COL_PADDING, pane1[2] - body_row, pane1[3] - 2 * PANE_COL_PADDING);
      const inner_rows = mdcard.rows + 1 + mdbody.rows + 2 * PANE_ROW_PADDING;
      scrollable.draw(pane1[0], pane1[1], pane1[2], pane1[3], inner_rows);
      row_offset = scrollable.row_offset;
      terminal.draw();
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  } catch (err) {
    console.error(err);
  }
};
await main();
