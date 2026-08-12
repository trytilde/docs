(() => {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") {
    window.gtag("set", { surface: "docs" });
  } else {
    window.dataLayer.push(["set", { surface: "docs" }]);
  }

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
