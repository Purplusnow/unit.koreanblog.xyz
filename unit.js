// Unit Converter v1.0.0

const $ = (id) => document.getElementById(id);

const categoryEl = $("category");
const fromUnitEl = $("fromUnit");
const toUnitEl = $("toUnit");
const fromValueEl = $("fromValue");
const toValueEl = $("toValue");
const swapBtn = $("swapBtn");
const precisionEl = $("precision");
const noteEl = $("note");
const updatedAtEl = $("updatedAt");
const shareBtn = $("shareBtn");

const FAVORITES = {
  length: ["m", "cm", "mm", "km", "in", "ft"],
  mass: ["kg", "g", "lb", "oz"],
  temperature: ["C", "F", "K"],
  area: ["m2", "cm2", "km2", "ha", "acre"],
  volume: ["L", "mL", "m3", "gal_us", "qt_us"],
  speed: ["kmh", "ms", "mph", "knot"],
  data: ["B", "KB", "MB", "GB", "TB"]
};

// 선형 변환(기준 단위로의 배율)
const UNITS = {
  length: {
    label: "길이",
    base: "m",
    units: {
      mm: { name: "밀리미터 (mm)", k: 0.001 },
      cm: { name: "센티미터 (cm)", k: 0.01 },
      m:  { name: "미터 (m)", k: 1 },
      km: { name: "킬로미터 (km)", k: 1000 },
      in: { name: "인치 (in)", k: 0.0254 },
      ft: { name: "피트 (ft)", k: 0.3048 },
      yd: { name: "야드 (yd)", k: 0.9144 },
      mi: { name: "마일 (mi)", k: 1609.344 }
    }
  },

  mass: {
    label: "무게",
    base: "kg",
    units: {
      mg: { name: "밀리그램 (mg)", k: 0.000001 },
      g:  { name: "그램 (g)", k: 0.001 },
      kg: { name: "킬로그램 (kg)", k: 1 },
      t:  { name: "톤 (t)", k: 1000 },
      oz: { name: "온스 (oz)", k: 0.028349523125 },
      lb: { name: "파운드 (lb)", k: 0.45359237 }
    }
  },

  area: {
    label: "면적",
    base: "m2",
    units: {
      mm2: { name: "제곱밀리미터 (mm²)", k: 1e-6 },
      cm2: { name: "제곱센티미터 (cm²)", k: 1e-4 },
      m2:  { name: "제곱미터 (m²)", k: 1 },
      km2: { name: "제곱킬로미터 (km²)", k: 1e6 },
      a:   { name: "아르 (a)", k: 100 },
      ha:  { name: "헥타르 (ha)", k: 10000 },
      acre:{ name: "에이커 (acre)", k: 4046.8564224 }
    }
  },

  volume: {
    label: "부피",
    base: "L",
    units: {
      mL:     { name: "밀리리터 (mL)", k: 0.001 },
      L:      { name: "리터 (L)", k: 1 },
      m3:     { name: "세제곱미터 (m³)", k: 1000 },
      tsp_us: { name: "티스푼(US) (tsp)", k: 0.00492892159375 },
      tbsp_us:{ name: "테이블스푼(US) (tbsp)", k: 0.01478676478125 },
      cup_us: { name: "컵(US) (cup)", k: 0.2365882365 },
      pt_us:  { name: "파인트(US) (pt)", k: 0.473176473 },
      qt_us:  { name: "쿼트(US) (qt)", k: 0.946352946 },
      gal_us: { name: "갤런(US) (gal)", k: 3.785411784 }
    }
  },

  speed: {
    label: "속도",
    base: "ms",
    units: {
      ms:   { name: "미터/초 (m/s)", k: 1 },
      kmh:  { name: "킬로미터/시 (km/h)", k: 0.2777777777777778 },
      mph:  { name: "마일/시 (mph)", k: 0.44704 },
      knot: { name: "노트 (knot)", k: 0.5144444444444445 }
    }
  },

  data: {
    label: "데이터",
    base: "B",
    units: {
      B:  { name: "바이트 (B)", k: 1 },
      KB: { name: "킬로바이트 (KB)", k: 1024 },
      MB: { name: "메가바이트 (MB)", k: 1024 ** 2 },
      GB: { name: "기가바이트 (GB)", k: 1024 ** 3 },
      TB: { name: "테라바이트 (TB)", k: 1024 ** 4 }
    }
  },

  temperature: {
    label: "온도",
    // 온도는 선형 배율만으로 안 되어서 별도 처리
    units: {
      C: { name: "섭씨 (°C)" },
      F: { name: "화씨 (°F)" },
      K: { name: "켈빈 (K)" }
    }
  }
};

function nowKSTString() {
  // 페이지 하단 표시용(브라우저 로컬 기준)
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function isValidNumberText(s) {
  if (s === null || s === undefined) return false;
  const t = String(s).trim();
  if (t.length === 0) return false;
  // 쉼표 허용
  const normalized = t.replaceAll(",", "");
  return /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(normalized);
}

function parseNumberText(s) {
  return Number(String(s).trim().replaceAll(",", ""));
}

function formatNumber(n, decimals) {
  if (!Number.isFinite(n)) return "";
  const fixed = n.toFixed(decimals);
  // 소수점 뒤 불필요한 0 제거는 사용자가 싫어할 수 있어 고정 유지
  // 대신 천단위 콤마만 적용
  const parts = fixed.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function setNote(msg) {
  noteEl.textContent = msg || "";
}

function buildCategoryOptions() {
  const keys = Object.keys(UNITS);
  categoryEl.innerHTML = keys
    .map((k) => `<option value="${k}">${UNITS[k].label}</option>`)
    .join("");
}

function sortUnitKeys(catKey) {
  const fav = FAVORITES[catKey] || [];
  const all = Object.keys(UNITS[catKey].units);
  const favSet = new Set(fav);
  const favFirst = fav.filter((x) => all.includes(x));
  const rest = all.filter((x) => !favSet.has(x)).sort((a, b) => {
    const an = UNITS[catKey].units[a].name;
    const bn = UNITS[catKey].units[b].name;
    return an.localeCompare(bn, "ko");
  });
  return [...favFirst, ...rest];
}

function buildUnitSelect(catKey) {
  const keys = sortUnitKeys(catKey);
  const options = keys
    .map((u) => `<option value="${u}">${UNITS[catKey].units[u].name}</option>`)
    .join("");

  fromUnitEl.innerHTML = options;
  toUnitEl.innerHTML = options;

  // 기본값 세팅
  const fav = FAVORITES[catKey] || [];
  if (fav.length >= 2) {
    fromUnitEl.value = fav[0];
    toUnitEl.value = fav[1];
  } else {
    fromUnitEl.value = keys[0];
    toUnitEl.value = keys[1] || keys[0];
  }
}

function convertTemperature(value, fromU, toU) {
  let c;

  if (fromU === "C") c = value;
  else if (fromU === "F") c = (value - 32) * (5 / 9);
  else if (fromU === "K") c = value - 273.15;
  else c = value;

  if (toU === "C") return c;
  if (toU === "F") return (c * (9 / 5)) + 32;
  if (toU === "K") return c + 273.15;
  return c;
}

function convertLinear(catKey, value, fromU, toU) {
  const fromK = UNITS[catKey].units[fromU].k;
  const toK = UNITS[catKey].units[toU].k;
  // base로 변환 후 target
  const baseValue = value * fromK;
  return baseValue / toK;
}

function recalc() {
  const catKey = categoryEl.value;
  const fromU = fromUnitEl.value;
  const toU = toUnitEl.value;
  const dec = Number(precisionEl.value);

  const inputText = fromValueEl.value;

  if (!isValidNumberText(inputText)) {
    toValueEl.value = "";
    if (String(inputText).trim().length === 0) setNote("");
    else setNote("숫자만 입력해줘. 쉼표(,)는 가능.");
    return;
  }

  const v = parseNumberText(inputText);

  let out;
  if (catKey === "temperature") {
    out = convertTemperature(v, fromU, toU);
  } else {
    out = convertLinear(catKey, v, fromU, toU);
  }

  toValueEl.value = formatNumber(out, dec);

  const fromName = UNITS[catKey].units[fromU].name;
  const toName = UNITS[catKey].units[toU].name;
  setNote(`${formatNumber(v, dec)} ${fromName} = ${formatNumber(out, dec)} ${toName}`);
}

function swapUnits() {
  const a = fromUnitEl.value;
  const b = toUnitEl.value;
  fromUnitEl.value = b;
  toUnitEl.value = a;
  recalc();
}

function wireQuickButtons() {
  document.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-set");
      if (v === "0") fromValueEl.value = "";
      else fromValueEl.value = v;
      recalc();
      fromValueEl.focus();
    });
  });
}

function wireShare() {
  shareBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNote("주소를 클립보드에 복사했어.");
        setTimeout(() => setNote(""), 1500);
      }
    } catch {
      // 무시
    }
  });
}

function init() {
  updatedAtEl.textContent = nowKSTString();

  buildCategoryOptions();
  categoryEl.value = "length";
  buildUnitSelect("length");

  categoryEl.addEventListener("change", () => {
    buildUnitSelect(categoryEl.value);
    recalc();
  });

  fromUnitEl.addEventListener("change", recalc);
  toUnitEl.addEventListener("change", recalc);
  fromValueEl.addEventListener("input", recalc);
  precisionEl.addEventListener("change", recalc);
  swapBtn.addEventListener("click", swapUnits);

  wireQuickButtons();
  wireShare();

  // 초기 표시
  fromValueEl.value = "1";
  recalc();
}

init();
