(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};

  const els = {
    bloggerName: document.getElementById("bloggerName"),
    footerName: document.getElementById("footerName"),
    tagline: document.getElementById("tagline"),
    aboutText: document.getElementById("aboutText"),
    channelLink: document.getElementById("channelLink"),
    subscribers: document.getElementById("subscribers"),
    views: document.getElementById("views"),
    videosCount: document.getElementById("videosCount"),
    videoGrid: document.getElementById("videoGrid"),
    videosMeta: document.getElementById("videosMeta"),
    supportLinks: document.getElementById("supportLinks"),
    analyticsProvider: document.getElementById("analyticsProvider"),
    analyticsId: document.getElementById("analyticsId"),
    analyticsState: document.getElementById("analyticsState"),
    statusMessage: document.getElementById("statusMessage"),
    year: document.getElementById("year"),
  };

  function safeText(value, fallback = "—") {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }

  function safeNum(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatInt(num) {
    return new Intl.NumberFormat("ru-RU").format(safeNum(num));
  }

  function setStatus(msg) {
    if (els.statusMessage) {
      els.statusMessage.textContent = msg;
    }
  }

  function isValidGa4MeasurementId(value) {
    if (typeof value !== "string") return false;
    return /^G-[A-Z0-9]{6,}$/i.test(value.trim());
  }

  function initAnalytics() {
    const analyticsCfg = cfg?.analytics && typeof cfg.analytics === "object" ? cfg.analytics : {};
    const enabled = analyticsCfg.enabled === true;
    const provider = safeText(analyticsCfg.provider, "ga4").toUpperCase();
    const measurementId = safeText(analyticsCfg.measurementId, "");

    if (els.analyticsProvider) els.analyticsProvider.textContent = provider;
    if (els.analyticsId) els.analyticsId.textContent = measurementId || "—";

    if (!enabled) {
      if (els.analyticsState) els.analyticsState.textContent = "Выключено";
      return;
    }

    if (provider !== "GA4") {
      if (els.analyticsState) els.analyticsState.textContent = "Неизвестный провайдер";
      return;
    }

    if (!isValidGa4MeasurementId(measurementId) || measurementId === "PASTE_GA4_MEASUREMENT_ID_HERE") {
      if (els.analyticsState) els.analyticsState.textContent = "Нужен Measurement ID";
      return;
    }

    const existing = document.querySelector('script[data-analytics="ga4"]');
    if (!existing) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.setAttribute("data-analytics", "ga4");
      document.head.appendChild(script);
    }

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }

    gtag("js", new Date());
    gtag("config", measurementId, {
      anonymize_ip: true,
      transport_type: "beacon",
    });

    if (els.analyticsState) els.analyticsState.textContent = "Активно";
  }

  function initStatic() {
    if (els.bloggerName) els.bloggerName.textContent = safeText(cfg.bloggerName, "YouTube Blogger");
    if (els.footerName) els.footerName.textContent = safeText(cfg.bloggerName, "YouTube Blogger");
    if (els.tagline) els.tagline.textContent = safeText(cfg.tagline, "Авторский контент на YouTube");
    if (els.aboutText)
      els.aboutText.textContent = safeText(
        cfg.aboutText,
        "Добавьте информацию о себе в config.js (поле aboutText)."
      );

    if (els.channelLink) {
      const link = safeText(cfg.channelUrl, "#");
      els.channelLink.href = link;
      if (link === "#") {
        els.channelLink.setAttribute("aria-disabled", "true");
      }
    }

    if (els.year) {
      els.year.textContent = String(new Date().getFullYear());
    }

    renderSupportLinks();
  }

  function renderSupportLinks() {
    if (!els.supportLinks) return;
    els.supportLinks.innerHTML = "";

    const links = Array.isArray(cfg.supportLinks) ? cfg.supportLinks : [];
    if (!links.length) {
      els.supportLinks.innerHTML = '<p class="muted">Ссылки на поддержку пока не добавлены.</p>';
      return;
    }

    for (const item of links) {
      if (!item || typeof item !== "object") continue;
      const label = safeText(item.label, "Поддержать");
      const url = safeText(item.url, "#");
      const isExternal = /^https?:\/\//i.test(url);
      if (!isExternal) continue;

      const card = document.createElement("article");
      card.className = "card support-card";

      const qrSrc = safeText(item.qr, "");
      if (qrSrc && isSafeImageSrc(qrSrc)) {
        const img = document.createElement("img");
        img.className = "support-card__qr";
        img.src = qrSrc;
        img.alt = `QR-код для: ${label}`;
        img.loading = "lazy";
        card.appendChild(img);
      }

      const body = document.createElement("div");
      body.className = "support-card__body";

      const a = document.createElement("a");
      a.className = "chip-link";
      a.textContent = label;
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      body.appendChild(a);
      card.appendChild(body);
      els.supportLinks.appendChild(card);
    }
  }

  function isSafeImageSrc(src) {
    try {
      const url = new URL(src, window.location.origin);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function createVideoCard(item) {
    const title = safeText(item?.snippet?.title, "Без названия");
    const videoId = safeText(item?.snippet?.resourceId?.videoId, "");
    const publishedAt = safeText(item?.snippet?.publishedAt, "");
    const thumb =
      item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || "";

    const card = document.createElement("article");
    card.className = "card video-card";

    const link = document.createElement("a");
    link.href = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.ariaLabel = `Открыть видео: ${title}`;

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = `Превью видео: ${title}`;
    if (thumb) img.src = thumb;

    const body = document.createElement("div");
    body.className = "video-card__body";

    const h3 = document.createElement("p");
    h3.className = "video-card__title";
    h3.textContent = title;

    const meta = document.createElement("p");
    meta.className = "video-card__meta";
    if (publishedAt) {
      const date = new Date(publishedAt);
      meta.textContent = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ru-RU");
    }

    body.append(h3, meta);
    link.append(img, body);
    card.append(link);
    return card;
  }

  function renderVideos(items) {
    if (!els.videoGrid) return;
    els.videoGrid.innerHTML = "";

    const valid = Array.isArray(items) ? items : [];
    if (!valid.length) {
      els.videoGrid.innerHTML = '<p class="muted">Видео пока не найдены.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const item of valid) fragment.appendChild(createVideoCard(item));
    els.videoGrid.appendChild(fragment);
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadChannelData() {
    const apiKey = safeText(cfg.apiKey, "");
    const channelId = safeText(cfg.channelId, "");
    const maxVideos = Math.min(Math.max(safeNum(cfg.maxVideos), 1), 24);

    if (!apiKey || apiKey === "PASTE_YOUR_API_KEY_HERE" || !channelId || channelId === "PASTE_YOUR_CHANNEL_ID_HERE") {
      setStatus("Укажите apiKey и channelId в config.js, чтобы загрузить данные с YouTube API.");
      if (els.videosMeta) els.videosMeta.textContent = "Ожидание настройки API";
      return;
    }

    const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelsUrl.searchParams.set("part", "snippet,contentDetails,statistics");
    channelsUrl.searchParams.set("id", channelId);
    channelsUrl.searchParams.set("key", apiKey);

    try {
      const channelData = await fetchJSON(channelsUrl.toString());
      const channel = channelData?.items?.[0];
      if (!channel) throw new Error("Канал не найден");

      if (els.subscribers) els.subscribers.textContent = formatInt(channel?.statistics?.subscriberCount);
      if (els.views) els.views.textContent = formatInt(channel?.statistics?.viewCount);
      if (els.videosCount) els.videosCount.textContent = formatInt(channel?.statistics?.videoCount);

      const uploadsPlaylistId = safeText(
        channel?.contentDetails?.relatedPlaylists?.uploads,
        ""
      );
      if (!uploadsPlaylistId) throw new Error("Uploads playlist не найден");

      const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      playlistUrl.searchParams.set("part", "snippet");
      playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
      playlistUrl.searchParams.set("maxResults", String(maxVideos));
      playlistUrl.searchParams.set("key", apiKey);

      const videosData = await fetchJSON(playlistUrl.toString());
      const videos = videosData?.items || [];
      renderVideos(videos);

      if (els.videosMeta) {
        els.videosMeta.textContent = `Показано видео: ${videos.length}`;
      }

      setStatus("Данные YouTube успешно загружены.");
    } catch (error) {
      if (els.videosMeta) els.videosMeta.textContent = "Ошибка загрузки";
      setStatus(`Не удалось загрузить данные YouTube API: ${error?.message || "unknown error"}`);
    }
  }

  initStatic();
  initAnalytics();
  loadChannelData();
})();
