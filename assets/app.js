(() => {
  const header = document.querySelector(".site-header");
  const themeKey = "lc_theme";
  const root = document.documentElement;
  const themeSelect = document.getElementById("theme-select");
  const storedTheme = localStorage.getItem(themeKey);
  const initialTheme = storedTheme || "system";

  root.setAttribute("data-theme", initialTheme);
  if (themeSelect) {
    themeSelect.value = initialTheme;
    themeSelect.addEventListener("change", () => {
      const value = themeSelect.value;
      root.setAttribute("data-theme", value);
      if (value === "system") {
        localStorage.removeItem(themeKey);
      } else {
        localStorage.setItem(themeKey, value);
      }
    });
  }

  const scroller = document.querySelector("main.container");

  if (header) {
    const setHeaderHeight = () => {
      const height = header.offsetHeight || 52;
      root.style.setProperty("--header-height", `${height}px`);
    };
    setHeaderHeight();
    window.addEventListener("resize", setHeaderHeight);
  }

  if (header) {
    const syncHeaderShadow = () => {
      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      if (scrollTop > 4) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };
    syncHeaderShadow();
    const target = scroller || window;
    target.addEventListener("scroll", syncHeaderShadow, { passive: true });
  }

  const contentArea = document.getElementById("content-area");
  const nav = document.getElementById("module-nav");
  if (!contentArea || !nav) {
    return;
  }

  const defaultContent = contentArea.innerHTML;

  const moduleFromHref = (href) => {
    if (!href) return null;
    const match = href.match(/([^/]+)\.html(?:[#?].*)?$/i);
    return match ? match[1] : null;
  };

  const setActive = (name) => {
    const links = nav.querySelectorAll(".module-card");
    links.forEach((link) => link.classList.remove("active"));
    if (!name) return;
    const active = nav.querySelector(`a[href$="${name}.html"]`);
    if (active) {
      active.classList.add("active");
    }
  };

  const loadModule = async (href, name) => {
    if (!href) return;
    contentArea.classList.add("is-loading");
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${href}`);
      }
      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      const content = doc.querySelector(".content");
      if (content) {
        contentArea.innerHTML = content.innerHTML;
        if (scroller) {
          scroller.scrollTop = 0;
        }
      } else {
        contentArea.innerHTML =
          '<section class="card"><h2>Load error</h2><p>Unable to find content for this module.</p></section>';
      }
      setActive(name);
    } catch (err) {
      contentArea.innerHTML =
        '<section class="card"><h2>Load error</h2><p>Could not load the selected module.</p></section>';
    } finally {
      contentArea.classList.remove("is-loading");
    }
  };

  const loadFromHash = () => {
    const name = window.location.hash.replace("#", "").trim();
    if (!name) {
      contentArea.innerHTML = defaultContent;
      setActive(null);
      return;
    }
    const link = nav.querySelector(`a[href$="${name}.html"]`);
    const href = link ? link.getAttribute("href") : `langchain_classic/${name}.html`;
    loadModule(href, name);
  };

  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a.module-card");
    if (!link) return;
    const href = link.getAttribute("href");
    const name = moduleFromHref(href);
    if (!name) return;
    event.preventDefault();
    if (window.location.hash.replace("#", "") !== name) {
      window.location.hash = name;
    } else {
      loadModule(href, name);
    }
  });

  window.addEventListener("hashchange", loadFromHash);
  loadFromHash();
})();
