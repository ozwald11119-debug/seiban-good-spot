const SUPABASE_URL = "https://jtsllyiuwdjpoulcwvqx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZcYjFbZ5f7WhH0D7j1CX0Q_C3EwN6VU";

const AREAS = [
  "姫路市",
  "宍粟市",
  "たつの市",
  "太子町",
  "上郡町",
  "相生市",
  "赤穂市"
];

const FALLBACK_SPOTS = [
  {
    id: "fallback-coneru",
    slug: "bakery-coneru",
    name: "bakery coneru",
    area: "上郡町",
    genre: "パン",
    lead: "上郡駅から徒歩3分。添加物不使用の小さなパン屋さん。",
    description:
      "上郡駅近くにある、添加物不使用にこだわるベーカリー。小麦の香りを楽しめるパンが並び、駅から歩いて立ち寄りやすい一軒です。",
    website_url: "https://coneru.jimdofree.com",
    instagram_url: "https://www.instagram.com/bakery_coneru_2018",
    post_url: "https://www.instagram.com/p/Dc5OnmcE5DJ/",
    maps_url:
      "https://www.google.com/maps/search/?api=1&query=bakery%20coneru%20上郡町",
    image_url: "coneru-1.jpg",
    tags: ["パン屋", "駅近", "添加物不使用"],
    featured: true,
    published: true,
    sort_order: 10
  },
  {
    id: "fallback-merrywidow",
    slug: "merry-widow",
    name: "MERRY WIDOW patisserie&coffee roastery",
    area: "上郡町",
    genre: "カフェ",
    lead: "上郡駅から徒歩6分。ケーキとコーヒーを楽しむ寄り道。",
    description:
      "ケーキや焼菓子、クロワッサンサンド、パフェ、コーヒーを楽しめる上郡の一軒。散策途中の寄り道にも。",
    website_url: "https://www.merrywidow.net/",
    instagram_url: "https://www.instagram.com/merrywidow",
    post_url: "https://www.instagram.com/p/DchgnKHkyAs/",
    maps_url:
      "https://www.google.com/maps/search/?api=1&query=MERRY%20WIDOW%20上郡町",
    image_url: "",
    tags: ["カフェ", "ケーキ", "コーヒー", "駅近"],
    featured: true,
    published: true,
    sort_order: 20
  }
];

const state = {
  spots: [],
  area: "",
  genre: "",
  query: "",
  tab: "discover",
  favorites: loadFavorites()
};

const el = {
  search: document.getElementById("search"),
  areas: document.getElementById("areas"),
  genres: document.getElementById("genres"),
  featured: document.getElementById("featured"),
  spotList: document.getElementById("spotList"),
  listTitle: document.getElementById("listTitle"),
  resultCount: document.getElementById("resultCount"),
  emptyState: document.getElementById("emptyState"),
  modal: document.getElementById("modal"),
  modalContent: document.getElementById("modalContent"),
  clearArea: document.getElementById("clearArea"),
  selectedAreaMessage: document.getElementById("selectedAreaMessage"),
  spotSection: document.getElementById("spotSection")
};

function loadFavorites() {
  try {
    const value = JSON.parse(
      localStorage.getItem("seiban-guide-favorites") || "[]"
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(
    "seiban-guide-favorites",
    JSON.stringify(state.favorites)
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value = "") {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {}

  return "";
}

function spotKey(spot) {
  return String(spot.id || spot.slug || spot.name);
}

function isFavorite(spot) {
  return state.favorites.includes(spotKey(spot));
}

function normalizeSpot(spot) {
  return {
    ...spot,
    tags: Array.isArray(spot.tags) ? spot.tags : [],
    featured: Boolean(spot.featured),
    published: spot.published !== false,
    sort_order: Number(spot.sort_order || 0)
  };
}

async function loadSpots() {
  try {
    const endpoint =
      `${SUPABASE_URL}/rest/v1/spots` +
      "?select=*" +
      "&published=eq.true" +
      "&order=sort_order.asc,created_at.desc";

    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid Supabase response");
    }

    state.spots = data.map(normalizeSpot);
  } catch (error) {
    console.warn(
      "Supabaseから取得できなかったためフォールバックを表示します。",
      error
    );

    state.spots = FALLBACK_SPOTS.map(normalizeSpot);
  }

  render();
}

function filteredSpots() {
  const query = state.query.trim().toLowerCase();

  return state.spots.filter((spot) => {
    if (state.tab === "favorites" && !isFavorite(spot)) {
      return false;
    }

    if (state.area && spot.area !== state.area) {
      return false;
    }

    if (state.genre && spot.genre !== state.genre) {
      return false;
    }

    if (query) {
      const haystack = [
        spot.name,
        spot.area,
        spot.genre,
        spot.lead,
        spot.description,
        ...(spot.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

function imageMarkup(spot) {
  const image = safeUrl(spot.image_url);

  if (image) {
    return `
      <img
        src="${escapeHtml(image)}"
        alt="${escapeHtml(spot.name)}"
        loading="lazy"
      >
    `;
  }

  if (
    spot.image_url &&
    !spot.image_url.startsWith("http") &&
    !spot.image_url.startsWith("//")
  ) {
    return `
      <img
        src="${escapeHtml(spot.image_url)}"
        alt="${escapeHtml(spot.name)}"
        loading="lazy"
        onerror="this.parentElement.innerHTML='<div class=&quot;spotImagePlaceholder&quot;>PHOTO</div>'"
      >
    `;
  }

  return `<div class="spotImagePlaceholder">PHOTO</div>`;
}

function cardMarkup(spot) {
  const key = spotKey(spot);
  const favorite = isFavorite(spot);

  const tags = (spot.tags || [])
    .slice(0, 4)
    .map(
      (tag) =>
        `<span class="spotTag">${escapeHtml(tag)}</span>`
    )
    .join("");

  return `
    <article class="spotCard" data-spot="${escapeHtml(key)}">

      <div class="spotImage">
        ${imageMarkup(spot)}

        <button
          class="favoriteButton ${favorite ? "active" : ""}"
          type="button"
          data-favorite="${escapeHtml(key)}"
          aria-label="お気に入り"
        >
          ${favorite ? "♥" : "♡"}
        </button>
      </div>

      <div class="spotBody">

        <div class="spotMeta">
          <span>${escapeHtml(spot.area || "")}</span>
          <span>・</span>
          <span>${escapeHtml(spot.genre || "")}</span>
        </div>

        <h3>${escapeHtml(spot.name || "")}</h3>

        ${
          spot.lead
            ? `<p>${escapeHtml(spot.lead)}</p>`
            : ""
        }

        ${
          tags
            ? `<div class="spotTags">${tags}</div>`
            : ""
        }

        <button
          class="cardOpen"
          type="button"
          data-open="${escapeHtml(key)}"
        >
          この場所を見る
        </button>

      </div>
    </article>
  `;
}

function renderFeatured() {
  if (!el.featured) return;

  if (state.tab === "favorites") {
    el.featured.closest("section")?.classList.add("hidden");
    return;
  }

  el.featured.closest("section")?.classList.remove("hidden");

  const spots = state.spots
    .filter((spot) => spot.featured)
    .slice(0, 4);

  if (!spots.length) {
    el.featured.innerHTML = "";
    el.featured.closest("section")?.classList.add("hidden");
    return;
  }

  el.featured.innerHTML = spots.map(cardMarkup).join("");
}

function renderList() {
  const spots = filteredSpots();

  if (state.tab === "favorites") {
    el.listTitle.textContent = "お気に入り";
  } else if (state.area) {
    el.listTitle.textContent = `${state.area}のおすすめ`;
  } else {
    el.listTitle.textContent = "おすすめスポット";
  }

  el.resultCount.textContent = `${spots.length}件`;

  if (!spots.length) {
    el.spotList.innerHTML = "";
    el.emptyState.classList.remove("hidden");

    if (state.tab === "favorites") {
      el.emptyState.innerHTML = `
        <strong>お気に入りはまだありません。</strong>
        <p>気になる場所の♡をタップしてね。</p>
      `;
    } else {
      el.emptyState.innerHTML = `
        <strong>まだスポットがありません。</strong>
        <p>条件を変えて探してみてね。</p>
      `;
    }

    return;
  }

  el.emptyState.classList.add("hidden");
  el.spotList.innerHTML = spots.map(cardMarkup).join("");
}

function updateAreaUI() {
  document.querySelectorAll("[data-area]").forEach((button) => {
    const area = button.dataset.area || "";

    button.classList.toggle(
      "active",
      area === state.area
    );
  });

  if (el.selectedAreaMessage) {
    el.selectedAreaMessage.textContent = state.area
      ? `${state.area}を表示中`
      : "すべてのエリアを表示中";
  }
}

function updateGenreUI() {
  document.querySelectorAll("[data-genre]").forEach((button) => {
    const genre = button.dataset.genre || "";

    button.classList.toggle(
      "active",
      genre === state.genre
    );
  });
}

function updateTabUI() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.tab === state.tab
    );
  });
}

function render() {
  updateAreaUI();
  updateGenreUI();
  updateTabUI();
  renderFeatured();
  renderList();
}

function chooseArea(area) {
  state.area = area || "";
  state.tab = "discover";

  render();

  window.setTimeout(() => {
    el.spotSection?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 80);
}

function toggleFavorite(key) {
  if (state.favorites.includes(key)) {
    state.favorites = state.favorites.filter(
      (item) => item !== key
    );
  } else {
    state.favorites.push(key);
  }

  saveFavorites();
  render();
}

function findSpot(key) {
  return state.spots.find(
    (spot) => spotKey(spot) === String(key)
  );
}

function modalImageMarkup(spot) {
  const image = safeUrl(spot.image_url);

  if (image) {
    return `
      <div class="modalHero">
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(spot.name)}"
        >
      </div>
    `;
  }

  if (
    spot.image_url &&
    !spot.image_url.startsWith("http") &&
    !spot.image_url.startsWith("//")
  ) {
    return `
      <div class="modalHero">
        <img
          src="${escapeHtml(spot.image_url)}"
          alt="${escapeHtml(spot.name)}"
        >
      </div>
    `;
  }

  return "";
}

function openSpot(key) {
  const spot = findSpot(key);

  if (!spot) return;

  const links = [
    {
      label: "Google Mapsで見る",
      url:
        safeUrl(spot.maps_url) ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${spot.name} ${spot.area}`
        )}`,
      primary: true
    },
    {
      label: "公式サイト",
      url: safeUrl(spot.website_url)
    },
    {
      label: "Instagram",
      url: safeUrl(spot.instagram_url)
    },
    {
      label: "紹介投稿を見る",
      url: safeUrl(spot.post_url)
    }
  ].filter((link) => link.url);

  el.modalContent.innerHTML = `
    <div class="modalContent">

      ${modalImageMarkup(spot)}

      <div class="spotMeta">
        <span>${escapeHtml(spot.area || "")}</span>
        <span>・</span>
        <span>${escapeHtml(spot.genre || "")}</span>
      </div>

      <h2>${escapeHtml(spot.name || "")}</h2>

      ${
        spot.lead
          ? `<p><strong>${escapeHtml(spot.lead)}</strong></p>`
          : ""
      }

      ${
        spot.description
          ? `<p>${escapeHtml(spot.description)}</p>`
          : ""
      }

      ${
        spot.address
          ? `<p>〒 ${escapeHtml(spot.address)}</p>`
          : ""
      }

      ${
        (spot.tags || []).length
          ? `
            <div class="spotTags">
              ${spot.tags
                .map(
                  (tag) =>
                    `<span class="spotTag">${escapeHtml(tag)}</span>`
                )
                .join("")}
            </div>
          `
          : ""
      }

      <div class="modalLinks">
        ${links
          .map(
            (link) => `
              <a
                href="${escapeHtml(link.url)}"
                target="_blank"
                rel="noopener noreferrer"
                class="${link.primary ? "primary" : ""}"
              >
                ${escapeHtml(link.label)}
              </a>
            `
          )
          .join("")}
      </div>

    </div>
  `;

  el.modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  el.modal.classList.add("hidden");
  document.body.style.overflow = "";
}

document.addEventListener("click", (event) => {
  const areaButton = event.target.closest("[data-area]");

  if (areaButton) {
    chooseArea(areaButton.dataset.area || "");
    return;
  }

  const genreButton = event.target.closest("[data-genre]");

  if (genreButton) {
    state.genre = genreButton.dataset.genre || "";
    state.tab = "discover";
    render();
    return;
  }

  const favoriteButton = event.target.closest("[data-favorite]");

  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }

  const openButton = event.target.closest("[data-open]");

  if (openButton) {
    openSpot(openButton.dataset.open);
    return;
  }

  const tabButton = event.target.closest("[data-tab]");

  if (tabButton) {
    state.tab = tabButton.dataset.tab;

    if (state.tab === "favorites") {
      state.area = "";
      state.genre = "";
    }

    render();

    el.spotSection?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  if (event.target.closest("[data-close-modal]")) {
    closeModal();
  }
});

el.search?.addEventListener("input", (event) => {
  state.query = event.target.value || "";
  state.tab = "discover";
  render();
});

el.clearArea?.addEventListener("click", () => {
  state.area = "";
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(() => {});
  });
}

loadSpots();