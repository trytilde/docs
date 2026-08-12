(() => {
  const dashboardUrl = "https://api.trytilde.ai";
  const whoamiUrl = `${dashboardUrl}/api/v1/identity/auth/whoami`;
  let label = "Get started";

  const headerLinks = [
    { label: "Blog", href: "https://trytilde.ai/blog" },
    { label: "Home", href: "https://trytilde.ai" },
    {
      label: "Talk to a human",
      href: "https://calendly.com/daniel-trytilde/30min",
      newTab: true,
    },
  ];

  const createHeaderNav = () => {
    const navbar = document.getElementById("navbar");
    if (!navbar || navbar.querySelector("[data-tilde-header-nav]")) return;

    const logoLink = navbar.querySelector(".nav-logo")?.closest("a");
    const desktopLayout = logoLink?.parentElement?.parentElement;
    const actionContainer = desktopLayout?.children[1];
    if (!(actionContainer instanceof HTMLElement)) return;

    const nav = document.createElement("nav");
    nav.className = "tilde-header-nav";
    nav.dataset.tildeHeaderNav = "";
    nav.setAttribute("aria-label", "Primary navigation");

    for (const link of headerLinks) {
      const anchor = document.createElement("a");
      anchor.className = "tilde-header-link";
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (link.newTab) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      nav.append(anchor);
    }

    const cta = document.createElement("a");
    cta.className = "tilde-header-cta";
    cta.dataset.tildeAuthCta = "";
    cta.href = dashboardUrl;
    cta.textContent = label;
    nav.append(cta);

    actionContainer.prepend(nav);
  };

  const orderMobileNav = () => {
    const hrefs = [...headerLinks.map((link) => link.href), dashboardUrl];
    const items = hrefs.map((href) =>
      document.querySelector(`li[data-title] > a[href="${href}"]`)?.closest("li"),
    );
    if (items.some((item) => !item)) return;

    const orderedItems = items.filter((item) => item instanceof HTMLLIElement);
    const list = orderedItems[0]?.parentElement;
    if (!list || orderedItems.some((item) => item.parentElement !== list)) return;

    const currentItems = Array.from(list.children).filter((item) => orderedItems.includes(item));
    if (currentItems.every((item, index) => item === orderedItems[index])) return;

    for (const item of orderedItems) list.append(item);
  };

  const updateCta = () => {
    createHeaderNav();
    orderMobileNav();

    const ctas = document.querySelectorAll(
      `[data-tilde-auth-cta], #topbar-cta-button, li[data-title] > a[href="${dashboardUrl}"]`,
    );

    for (const cta of ctas) {
      const labelElement = Array.from(cta.querySelectorAll("span")).find((element) => {
        const text = element.textContent?.trim();
        return text === "Get started" || text === "Dashboard";
      });

      if (labelElement && labelElement.textContent !== label) {
        labelElement.textContent = label;
      } else if (cta.matches("[data-tilde-auth-cta]") && cta.textContent !== label) {
        cta.textContent = label;
      }

      const item = cta.closest("li[data-title]");
      if (item) item.dataset.title = label;
    }
  };

  const observer = new MutationObserver(updateCta);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  updateCta();

  void fetch(whoamiUrl, {
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) return;
      label = "Dashboard";
      updateCta();
    })
    .catch(() => {
      // Keep the default CTA when the session check is unavailable.
    });
})();
