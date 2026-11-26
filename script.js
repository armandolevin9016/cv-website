/* Farbschema, Menü auf schmalen Bildschirmen, aktueller Abschnitt.
   Breakpoint 980px muss mit styles.css übereinstimmen. */
(function () {
  var STORAGE_KEY = "theme";
  var root = document.documentElement;
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  root.classList.add("js");

  function storedTheme() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      if (value === "light" || value === "dark") return value;
    } catch (error) {
      return null;
    }
    return null;
  }

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    return systemTheme();
  }

  function paintChrome(theme) {
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "dark" ? "#111413" : "#f6f4ef");
    }
  }

  var saved = storedTheme();
  if (saved) root.setAttribute("data-theme", saved);
  paintChrome(currentTheme());

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("theme-toggle");
    var navToggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");

    function updateToggle(theme) {
      if (!toggle) return;
      var dark = theme === "dark";
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        dark ? "Hellen Modus aktivieren" : "Dunklen Modus aktivieren"
      );
    }

    updateToggle(currentTheme());

    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch (error) {
          /* Speicher nicht verfügbar, die Wahl gilt nur für diesen Aufruf. */
        }
        paintChrome(next);
        updateToggle(next);
      });
    }

    var scheme = window.matchMedia("(prefers-color-scheme: dark)");
    function onSchemeChange() {
      if (!storedTheme()) {
        root.removeAttribute("data-theme");
        var theme = currentTheme();
        paintChrome(theme);
        updateToggle(theme);
      }
    }
    if (typeof scheme.addEventListener === "function") {
      scheme.addEventListener("change", onSchemeChange);
    }

    function setNavOpen(open) {
      if (!nav || !navToggle) return;
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Menü schliessen" : "Menü öffnen");
    }

    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        setNavOpen(!nav.classList.contains("is-open"));
      });

      nav.addEventListener("click", function (event) {
        var link = event.target.closest("a");
        if (!link) return;
        nav.querySelectorAll('a[aria-current="true"]').forEach(function (item) {
          item.removeAttribute("aria-current");
        });
        link.setAttribute("aria-current", "true");
        var id = (link.getAttribute("href") || "").replace(/^#/, "");
        var target = id ? document.getElementById(id) : null;
        setNavOpen(false);
        if (!target) return;
        var heading = target.querySelector("h2") || target;
        window.setTimeout(function () {
          if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }, 0);
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
          setNavOpen(false);
          navToggle.focus();
        }
      });

      document.addEventListener("click", function (event) {
        if (!nav.classList.contains("is-open")) return;
        if (nav.contains(event.target) || navToggle.contains(event.target)) return;
        setNavOpen(false);
      });

      var desktop = window.matchMedia("(min-width: 980px)");
      function closeOnDesktop() {
        if (desktop.matches) setNavOpen(false);
      }
      if (typeof desktop.addEventListener === "function") {
        desktop.addEventListener("change", closeOnDesktop);
      }
    }

    var links = document.querySelectorAll('.site-nav a[href^="#"]');
    var sections = [];
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").slice(1);
      var section = id ? document.getElementById(id) : null;
      if (section) sections.push({ link: link, section: section });
    });

    if (sections.length) {
      var ticking = false;
      function markCurrent() {
        var active = null;
        sections.forEach(function (item) {
          if (item.section.getBoundingClientRect().top <= 160) active = item;
        });
        sections.forEach(function (item) {
          if (item === active) item.link.setAttribute("aria-current", "true");
          else item.link.removeAttribute("aria-current");
        });
      }
      document.addEventListener(
        "scroll",
        function () {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(function () {
            ticking = false;
            markCurrent();
          });
        },
        { passive: true }
      );
      markCurrent();
    }
  });
})();
