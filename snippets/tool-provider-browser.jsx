export const PUBLIC_CATALOG_URL = "https://api.trytilde.ai/api/v1/mcp/available-tool-groups";

export const iconAliases = {
  "amazon s3": "aws-s3", "aws s3": "aws-s3", "google bigquery": "google-bigquery",
  "google gmail": "gmail", "google mail": "gmail", "mongo db": "mongodb",
  "open ai": "openai", "vercel ai sdk": "vercel",
};

export const iconUrl = (name) => {
  const normalized = String(name || "").toLowerCase().replace(/[_./:]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized || /^(tilde|debug|message internal)\b|internal agent$/.test(normalized)) return null;
  const slug = iconAliases[normalized] || normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug ? `https://thesvg.org/icons/${slug}/default.svg` : null;
};

export const providerFromApi = (source) => {
  const metadata = source.metadata || {};
  const auth = [...new Set((source.credential_sources || []).map((credential) =>
    credential.display_name || credential.name,
  ).filter(Boolean))];
  return {
    name: source.name,
    slug: source.type_id,
    initials: source.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase(),
    category: String(source.categories?.[0] || "Tools").replaceAll("_", " "),
    summary: source.documentation,
    auth,
    iconSources: [metadata.icon_url, iconUrl(metadata.icon_slug), iconUrl(source.type_id), iconUrl(source.name)].filter(Boolean),
    toolCount: (source.tools || []).length,
    tools: (source.tools || []).map((tool) => [tool.name, tool.documentation]),
  };
};

export const providerRoute = (slug) => String(slug || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

export const ProviderLogo = ({ provider, detail = false }) => {
  const sources = provider.iconSources || [iconUrl(provider.slug), iconUrl(provider.name)].filter(Boolean);
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = sources[sourceIndex];
  useEffect(() => setSourceIndex(0), [provider.slug]);
  return (
    <span className={detail ? "tp-detail-logo" : "tp-provider-logo"}>
      {source ? <img src={source} alt="" onError={() => setSourceIndex((index) => index + 1)} /> : (
        <span className="tp-logo-fallback">{provider.initials}</span>
      )}
    </span>
  );
};

export const ToolProviderDetail = ({
  provider: fallbackProvider,
  ProviderLogo,
  apiUrl = PUBLIC_CATALOG_URL,
}) => {
  const [provider, setProvider] = useState(fallbackProvider);
  const [toolQuery, setToolQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadProvider = async () => {
      const url = new URL(apiUrl);
      url.searchParams.set("page_size", "100");
      url.searchParams.set("deployment_alias", "latest");
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      const page = await response.json();
      const match = (page.items || []).find((item) => item.type_id === fallbackProvider.slug);
      if (match) setProvider(providerFromApi(match));
    };
    loadProvider().catch((error) => {
      if (error.name !== "AbortError") console.warn("Using bundled provider details", error);
    });
    return () => controller.abort();
  }, [apiUrl, fallbackProvider.slug]);

  const filteredTools = useMemo(() => {
    const normalized = toolQuery.trim().toLowerCase();
    if (!normalized) return provider.tools;
    return provider.tools.filter(([name, description]) =>
      `${name} ${description}`.toLowerCase().includes(normalized),
    );
  }, [provider, toolQuery]);

  return (
    <div className="tp-browser tp-detail">
      <a className="tp-back" href="/tool-providers/index">
        <span aria-hidden="true">←</span> Providers
      </a>
      <div className="tp-detail-header">
        <div>
          <ProviderLogo provider={provider} detail />
          <div className="tp-detail-copy">
            <h2>{provider.name}</h2>
            <p>{provider.summary}</p>
          </div>
        </div>
        <div className="tp-detail-meta">
          <span>{provider.category}</span>
          <a href="https://api.trytilde.ai/tools/available-tool-providers">Add provider</a>
        </div>
      </div>
      <div className="tp-supported-auth">
        <span>Supported auth</span>
        <div className="tp-badges">
          {provider.auth.map((method) => (
            <span className="tp-badge" key={method}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              {method}
            </span>
          ))}
        </div>
      </div>
      <section className="tp-tools-panel">
        <div className="tp-tools-heading">
          <div>
            <h3>Available tools</h3>
            <p>{filteredTools.length} shown{provider.tools.length < provider.toolCount ? ` · ${provider.toolCount} in Tilde` : ""}</p>
          </div>
          <label className="tp-search">
            <span className="sr-only">Search tools</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.6-3.6" />
            </svg>
            <input
              type="search"
              value={toolQuery}
              onChange={(event) => setToolQuery(event.target.value)}
              placeholder="Search tools..."
            />
          </label>
        </div>
        <div className="tp-tool-table" role="table" aria-label={`${provider.name} tools`}>
          <div className="tp-tool-row tp-tool-row--header" role="row">
            <span role="columnheader">Tool</span>
            <span role="columnheader">Description</span>
          </div>
          {filteredTools.map(([name, description]) => (
            <div className="tp-tool-row" role="row" key={name}>
              <span role="cell">{name}</span>
              <span role="cell">{description}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const ToolProviderBrowser = ({
  providers: fallbackProviders,
  ProviderLogo,
  apiUrl = PUBLIC_CATALOG_URL,
}) => {
  const [catalog, setCatalog] = useState(fallbackProviders);
  const [providerQuery, setProviderQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const loadCatalog = async () => {
      const items = [];
      let nextPageToken;
      do {
        const url = new URL(apiUrl);
        url.searchParams.set("page_size", "100");
        url.searchParams.set("deployment_alias", "latest");
        if (nextPageToken) url.searchParams.set("next_page_token", nextPageToken);
        const response = await fetch(url, {
          signal: controller.signal,
          credentials: "omit",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
        const page = await response.json();
        items.push(...(page.items || []));
        nextPageToken = page.next_page_token;
      } while (nextPageToken);
      const liveProviders = items.map(providerFromApi).sort((a, b) => a.name.localeCompare(b.name));
      if (liveProviders.length) setCatalog(liveProviders);
    };
    loadCatalog().catch((error) => {
      if (error.name !== "AbortError") console.warn("Using the bundled tool catalog fallback", error);
    });
    return () => controller.abort();
  }, [apiUrl]);

  const filteredProviders = useMemo(() => {
    const normalized = providerQuery.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((provider) =>
      [provider.name, provider.category, provider.summary, ...provider.auth]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [catalog, providerQuery]);

  return (
    <div className="tp-browser">
      <div className="tp-catalog-toolbar">
        <p><span>{filteredProviders.length}</span> providers available</p>
        <label className="tp-search">
          <span className="sr-only">Search providers</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.6-3.6" />
          </svg>
          <input
            type="search"
            value={providerQuery}
            onChange={(event) => setProviderQuery(event.target.value)}
            placeholder="Search providers..."
          />
        </label>
      </div>
      <div className="tp-provider-grid">
        {filteredProviders.map((provider) => (
          <a
            className="tp-provider-card"
            href={`/tool-providers/${providerRoute(provider.slug)}`}
            key={provider.slug}
          >
            <ProviderLogo provider={provider} />
            <span className="tp-provider-copy">
              <span className="tp-provider-name">{provider.name}</span>
              <span className="tp-provider-summary">{provider.summary}</span>
              <span className="tp-tool-count">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.7 6.3a4 4 0 0 0-5-5L8 3l3 3 1.7-1.7a4 4 0 0 0 2 2Z" />
                  <path d="m10 7-8.4 8.4a2 2 0 0 0 0 2.8l4.2 4.2a2 2 0 0 0 2.8 0L17 14" />
                </svg>
                <span>{provider.toolCount}</span> tools
              </span>
              <span className="tp-badges">
                {provider.auth.map((method) => (
                  <span className="tp-badge" key={method}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    {method}
                  </span>
                ))}
              </span>
            </span>
          </a>
        ))}
      </div>
      {filteredProviders.length === 0 && (
        <div className="tp-empty">No providers match “{providerQuery}”.</div>
      )}
    </div>
  );
}
