(() => {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
  window.gtag("set", { surface: "docs" });

  let attempts = 0;
  const registerPostHogSurface = () => {
    if (typeof window.posthog?.register === "function") {
      window.posthog.register({ surface: "docs" });
      return;
    }

    attempts += 1;
    if (attempts < 40) window.setTimeout(registerPostHogSurface, 250);
  };

  registerPostHogSurface();
})();
