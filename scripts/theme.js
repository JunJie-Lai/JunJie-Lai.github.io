const root = document.documentElement;
const toggle = document.getElementById("theme");

// Load saved theme or fall back to system preference
const saved = localStorage.getItem("theme");
if (saved) {
	root.setAttribute("data-theme", saved);
} else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
	root.setAttribute("data-theme", "light");
}

toggle.addEventListener("click", () => {
	const current = root.getAttribute("data-theme");
	const next = current === "light" ? "dark" : "light";
	root.setAttribute("data-theme", next);
	localStorage.setItem("theme", next);
});
