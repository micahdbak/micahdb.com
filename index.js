const COMM =
`wget https://micahbaker.xyz/message.txt -O message.txt
$ cat message.txt\ \ \ \ 
\`
$`;
const COMM_PROMPT = "micah@localhost~$";
const COMM_SPEED = 50;
const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
const TAG_COLORS = [
	"#ff8080",
	"#a0a080",
	"#80ff80",
	"#80a0a0",
	"#8080ff",
	"#a080a0"
];
const THEMES = {
	"light": {
		"--fg": "#141414",
		"--sp": "#a080a0",
		"--bb": "#c0c0c0",
		"--bs": "#e0e0e0",
		"--bg": "#f0f0f0",
		"--bp": "#f8f8f8",
		"--bf": "#ffffff"
	},
	"dark": {
		"--fg": "#f0f0f8",
		"--sp": "#a080a8",
		"--bb": "#404048",
		"--bs": "#28282c",
		"--bg": "#14141a",
		"--bp": "#303038",
		"--bf": "#404048"
	}
};

let sel = null;

window.onload = async () => {
	let header = document.getElementById("header");
	let display = document.getElementById("display");

	window.onscroll = () => {
		if ((window.scrollY && !header.classList.contains("scroll"))
		 || (!window.scrollY && header.classList.contains("scroll"))) {
			header.classList.toggle("scroll");
			display.classList.toggle("scroll");
		}
	};
	window.onscroll();

	let message;
	try {
		message = await fetch("message.txt");
		message = await message.json();
	} catch {
		message = "Sorry... There was an error fetching this message.";
	}

	let cons = document.getElementById("console");
	let comm_i, comm_f, inter;

	comm_i = 0;
	comm_speed = 50;
	comm_f = () => {
		if (comm_i >= COMM.length) {
			clearInterval(inter);
			return;
		}

		// increase speed
		if (COMM[comm_i] == '`') {
			cons.innerHTML += message;
			comm_i++;
			return;
		}

		if (COMM[comm_i] == '$') {
			cons.innerHTML += COMM_PROMPT;
		} else
			cons.innerHTML += COMM[comm_i];

		comm_i++;
	};
	inter = setInterval(comm_f, COMM_SPEED);

	let buttons = document.getElementById("buttons");

	for (const b of buttons.children) {
		b.onclick = () => {
			if (sel != null) {
				sel.classList.toggle("selected");

				if (sel == b) {
					sel = null;
					return;
				}
			}

			sel = b;
			sel.classList.toggle("selected");
		};
	}

	let projs;
	try {
		projs = await fetch("projects.json");
		projs = await projs.json();
	} catch {
		projs = [];
	}

	let projects = document.getElementById("projects");
	let projects_b = document.getElementById("projects-buttons");

	let col_i = 0;
	let col_m = new Map();

	for (const p of projs) {
		let tags = "";
		let points = "";

		for (const t of p.tags) {
			if (!col_m.has(t))
				col_m.set(t, TAG_COLORS[col_i++]);

			tags += `<span class="tag" style="background-color: ${col_m.get(t)}">${t}</span>`;
		}

		for (const pt of p.points)
			points += `<li>${pt}</li>`;

		projects_b.innerHTML += `<a href="#${p.name}">&rarr; ${p.name}</a>`;
		projects.innerHTML += `
			<h2 id=${p.name} class="project">
				<span class="monospace">${p.date.from[0]} ${MONTHS[p.date.from[1] - 1]}:</span>&nbsp;
				<b>${p.name}</b>
				${tags}&nbsp;
				<a href="${p.link}">View Project &nearr;</a>&nbsp;
			</h2>
			<ul>${points}</ul>
		`;
	}
};

let t = "light";

function toggleTheme(b) {
	if (t == "light") {
		b.innerHTML = "🌞";
		t = "dark";
	} else {
		b.innerHTML = "💤";
		t = "light";
	}

	let r = document.querySelector(":root");
	let props = [ "--fg", "--sp", "--bb", "--bs", "--bg", "--bp", "--bf" ];

	for (const p of props)
		r.style.setProperty(p, THEMES[t][p]);
}
