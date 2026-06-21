const imagePath = (file) => `/assets/images/${file}`;
const audioPath = (file) => `/assets/audio/${file}`;

const plantStage = {
  normal1: "1a.png",
  normal2: "2a.png",
  normal3: "3a.png",
  normal4: "4a.png",
  normal5: "5a.png",
  normal6: "6a.png",
  normal7: "7a.png",
  normal8: "8a.png",
  normal9: "9a.png",
  horror1: "1h.png",
  horror2: "2h.png",
  horror3: "3h.png",
  horror4: "4h.png",
};

const NORMAL_STAGE_8_SCORE = 620;
const NORMAL_STAGE_9_SCORE = 760;
const SOIL_READY_SCORE = NORMAL_STAGE_9_SCORE;
const soilProgressPoints = [
  { score: 0, percent: 0 },
  { score: 19, percent: 5 },
  { score: 39, percent: 11 },
  { score: 49, percent: 16 },
  { score: 71, percent: 24 },
  { score: 91, percent: 32 },
  { score: 201, percent: 50 },
  { score: 295, percent: 65 },
  { score: 394, percent: 78 },
  { score: 501, percent: 88 },
  { score: NORMAL_STAGE_8_SCORE, percent: 96 },
  { score: SOIL_READY_SCORE, percent: 100 },
];

const rankProgression = {
  "Tiny Sprout": { level: 1, start: 1, next: 15 },
  "First Leaf": { level: 2, start: 15, next: 30 },
  "Young One": { level: 3, start: 30, next: 60 },
  Teen: { level: 4, start: 60, next: 111 },
  "Serious One": { level: 5, start: 111, next: 295 },
  Broadleaf: { level: 6, start: 295, next: 501 },
  "Giant!": { level: 7, start: 501, next: NORMAL_STAGE_8_SCORE },
  "Grand Monstera": {
    level: 8,
    start: NORMAL_STAGE_8_SCORE,
    next: NORMAL_STAGE_9_SCORE,
  },
  "Monstera Prime": { level: 9, start: NORMAL_STAGE_9_SCORE, next: null },
  "Wizard!": { level: 10, start: SOIL_READY_SCORE, next: 1051 },
  Archmage: { level: 11, start: 1051, next: 2015 },
  Necromancer: { level: 12, start: 2015, next: 3000 },
  "Farmer's Helper": { level: 12, start: 2015, next: 3000 },
  "Dark Lord": { level: 13, start: 3000, next: null },
  Farmer: { level: 13, start: 3000, next: null },
};

const byId = (id) => document.getElementById(id);

const dom = {
  wrap: byId("wrap"),
  block: byId("block"),
  plant: byId("plant"),
  label: byId("label"),
  score: byId("scoreD"),
  rank: byId("name"),
  multiplier: byId("currentApp"),
  soil: byId("soil"),
  refresh: byId("refresh"),
  showStats: byId("show_stat"),
  showDevlog: byId("showDevlog"),

  isolation: byId("isolation"),
  progress: byId("progress"),
  coin: byId("money"),
  coinText: byId("money_txt"),
  storeButton: byId("btnStore"),

  spider: byId("spider"),
  sections: document.getElementsByClassName("section"),
};

const state = {
  current: 0,
  clicks: 0,
  money: 0,
  startTime: null,
  soilText: "",
  currentRank: null,

  cheater: false,
  isSoiled: false,
  storeEnabled: false,
  multi3Potion: false,
  secondBought: false,
  autumnTheme: false,

  animationFlag: 0,
  divider: 0.89,
  confirmationStep: 0,
  isolationTicks: 0,
  soilReady: false,

  drop2Flag: 0,
  drop5Flag: 0,
  soilFlag: 0,
  potion2Flag: 0,
  boughtMultiplierFlag: 0,
};

dom.coinText.innerHTML = 1;

function playAudio(file) {
  const audio = new Audio();
  audio.src = audioPath(file);
  audio.play();
}

function animateElement(element, keyframes, options) {
  if (
    !element ||
    !element.animate ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return null;
  }

  return element.animate(keyframes, {
    duration: 240,
    easing: "cubic-bezier(.2,.8,.2,1)",
    fill: "none",
    ...options,
  });
}

function animateEntrance(element, x = 0, y = 0) {
  return animateElement(
    element,
    [
      { opacity: 0, transform: `translate3d(${x}px, ${y}px, 0) scale(0.96)` },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" },
  );
}

function animatePop(element, intensity = 1) {
  return animateElement(
    element,
    [
      { transform: "scale(1)" },
      { transform: `scale(${1 + 0.08 * intensity})` },
      { transform: "scale(1)" },
    ],
    { duration: 220 },
  );
}

function animateSoil() {
  return animateElement(
    dom.soil,
    [
      { transform: "translate3d(0, 0, 0) scale(1)" },
      { transform: "translate3d(0, -2px, 0) scale(1.025)" },
      { transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    { duration: 260, easing: "cubic-bezier(.25,.9,.25,1)" },
  );
}

function animateCoin() {
  return animateElement(
    dom.coin,
    [
      { transform: "scale(0.86) rotate(-4deg)" },
      { transform: "scale(1.08) rotate(3deg)" },
      { transform: "scale(1) rotate(0deg)" },
    ],
    { duration: 480, easing: "cubic-bezier(.16,1,.3,1)" },
  );
}

function setScore(style = "") {
  const styleAttribute = style ? ` style="${style}"` : "";
  dom.score.innerHTML = `
    <div class="section_panel">
      <div class="section_label">Your current score</div>
      <div class="section_value" id="time"${styleAttribute}>${state.current}</div>
    </div>
  `;
  renderRankDisplay();
}

function animateScore() {
  const timer = document.getElementById("time");
  if (!timer) return;
  animatePop(timer, 0.75);
}

function renderDropImages(count) {
  return Array.from(
    { length: count },
    (_, index) => `
    <img class="section_media multiplier_drop" src="${imagePath("drop.png")}" alt="drop ${index + 1}"${index == 0 ? ' id="drop"' : ""}>
  `,
  ).join("");
}

function setWaterMultiplier(count) {
  dom.multiplier.innerHTML = `
    <div class="section_panel section_panel--multiplier">
      <div class="section_label">Your current multiplier</div>
      <div class="multiplier_drops" aria-label="Water multiplier x${count}">
        ${renderDropImages(count)}
      </div>
    </div>
  `;
}

function setMultiplier(image, alt) {
  dom.multiplier.innerHTML = `
    <div class="section_panel section_panel--multiplier">
      <div class="section_label">Your current multiplier</div>
      <img class="section_media" src="${imagePath(image)}" alt="${alt}" id="drop">
    </div>
  `;
}

function getDrop() {
  return document.getElementById("drop");
}

function animateDrop(drop) {
  if (!drop) return;
  animateElement(
    drop,
    [
      { transform: "scale(1) rotate(0deg)" },
      { transform: "scale(1.16) rotate(-4deg)" },
      { transform: "scale(1) rotate(0deg)" },
    ],
    { duration: 360, easing: "cubic-bezier(.16,1,.3,1)" },
  );
}

function stopDropAnimation(drop) {
  if (!drop) return;
  drop.getAnimations().forEach((animation) => animation.cancel());
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRankProgress(rank) {
  const meta = rankProgression[rank] ?? {
    level: "?",
    start: state.currentRank?.startScore ?? state.current,
    next: null,
  };

  if (!meta.next || meta.next <= meta.start) {
    return { meta, percent: 100, label: "Max level" };
  }

  const rawPercent =
    ((state.current - meta.start) / (meta.next - meta.start)) * 100;
  const percent = clamp(Math.round(rawPercent), 0, 100);
  return { meta, percent, label: `${percent}% to ${meta.next}` };
}

function renderRankDisplay() {
  if (!state.currentRank) return;

  const { name, style } = state.currentRank;
  const styleAttribute = style ? ` style="${style}"` : "";
  const displayName = state.cheater ? "Cheater" : name;
  const { meta, percent, label } = getRankProgress(name);

  dom.rank.innerHTML = `
    <div class="section_panel section_panel--rank">
      <div class="section_label">Your rank</div>
      <div class="rank_header">
        <span class="rank_level">Lvl ${meta.level}</span>
        <span class="section_value section_value--rank"${styleAttribute}>${displayName}</span>
      </div>
      <div class="rank_progress" aria-label="Rank progress">
        <div class="rank_progress_bar" style="width:${percent}%"></div>
      </div>
      <div class="rank_progress_label">${label}</div>
    </div>
  `;
}

function setRank(rank, style = "") {
  const knownStart = rankProgression[rank]?.start ?? state.current;
  state.currentRank = {
    name: rank,
    style,
    startScore: knownStart,
  };
  renderRankDisplay();
}

function setProgressRank(rank, style = "") {
  setRank(rank, style);
}

function setSoil(text) {
  state.soilText = text;
  dom.soil.innerHTML = state.soilText;
}

function getSoilPercent(score) {
  if (score <= 0) return 0;

  for (let i = 1; i < soilProgressPoints.length; i++) {
    const previous = soilProgressPoints[i - 1];
    const next = soilProgressPoints[i];

    if (score <= next.score) {
      const scoreRange = next.score - previous.score;
      const percentRange = next.percent - previous.percent;
      const scoreProgress = score - previous.score;
      return Math.min(
        100,
        Math.round(
          previous.percent + (scoreProgress / scoreRange) * percentRange,
        ),
      );
    }
  }

  return 100;
}

function activateSoilButton() {
  if (state.soilReady) return;

  state.soilReady = true;
  dom.soil.style.background = "red";
  dom.soil.style.width = "115px";
  dom.soil.style.height = "115px";
  dom.soil.style.borderRadius = "50px";
  dom.soil.classList.add("getSoil");
  dom.soil.addEventListener("click", getSoil);
  dom.refresh.style.marginLeft = "56px";
}

function updateSoilProgress() {
  if (state.isSoiled) return;

  const percent = getSoilPercent(state.current);
  if (percent >= 100) {
    setSoil(
      '<span class="soil_percent">100%</span><span class="soil_cta">tap me!</span>',
    );
    activateSoilButton();
    return;
  }

  setSoil(`${percent}%`);
}

function setPlant(stage) {
  dom.plant.src = imagePath(stage);
}

function addClickHandler(handler) {
  dom.block.addEventListener("click", handler);
}

function removeClickHandler(handler) {
  dom.block.removeEventListener("click", handler);
}

function replaceClickHandler(from, to) {
  removeClickHandler(from);
  addClickHandler(to);
}

function revealGameUi() {
  dom.label.style.display = "none";
  dom.showStats.style.display = "block";

  dom.score.style.display = "flex";
  dom.refresh.style.display = "block";
  dom.multiplier.style.display = "flex";
  dom.rank.style.display = "flex";

  animateEntrance(dom.score, -20, 0);
  animateEntrance(dom.refresh, 0, 18);
  animateEntrance(dom.showStats, 0, -18);
  animateEntrance(dom.multiplier, 20, 0);
  animateEntrance(dom.rank, 0, -18);
}

function recordClick(amount) {
  state.current += amount;
  state.clicks++;
  playAudio("08368.mp3");
}

function startTimerOnce() {
  state.startTime = new Date();
  removeClickHandler(startTimerOnce);
}

function applyCheatCode() {
  const input = byId("cheatInp");
  if (!input) return;

  if (input.value == "truegamer") {
    const answer = prompt("Set score", state.current);
    if (isNaN(answer)) {
      alert("numbers only");
    } else {
      state.current = +answer;
      alert("Your new score: " + answer);
      input.value = "";
      setScore();
      state.cheater = true;
      renderRankDisplay();
      playAudio("buuu.mp3");
    }
  }
  if (input.value == "moneymaker") {
    const answer = prompt("Set coin amount", state.money);
    if (isNaN(answer)) {
      alert("numbers only");
    } else {
      state.money = +answer;
      alert("In your wallet: " + answer);
      input.value = "";
      dom.coin.style.display = "flex";
      dom.coinText.innerHTML = state.money;
      state.cheater = true;
      renderRankDisplay();
      playAudio("buuu.mp3");
    }
  } else {
    input.value = "";
  }
}

function click1() {
  recordClick(1);

  if (state.animationFlag == 0 && state.current == 1) {
    revealGameUi();
  }

  state.animationFlag++;
  dom.soil.style.display = "flex";
  animateSoil();

  setScore();
  animateScore();
  setWaterMultiplier(1);

  const drop = getDrop();
  if (state.current >= 1) {
    setPlant(plantStage.normal1);
    animateDrop(drop);
    setProgressRank("Tiny Sprout");
    dom.showStats.style.display = "block";
  }
  if (state.current >= 6) {
    stopDropAnimation(drop);
  }
  if (state.current >= 15) {
    setPlant(plantStage.normal2);
    setProgressRank("First Leaf");
  }
  if (state.current > 29) {
    setProgressRank("Young One");
    setPlant(plantStage.normal3);
  }
  if (state.current > 59) {
    replaceClickHandler(click1, click2);
    setPlant(plantStage.normal4);
    setProgressRank("Teen");
  }

  updateSoilProgress();
}

function click2() {
  recordClick(2);
  state.animationFlag = "";
  animateSoil();

  setScore();
  animateScore();
  setWaterMultiplier(2);

  if (state.drop2Flag < 3) {
    animateDrop(getDrop());
  }
  state.drop2Flag++;
  if (state.drop2Flag >= 3) {
    stopDropAnimation(getDrop());
  }

  if (state.current >= 91) {
    setPlant(plantStage.normal5);
  }
  if (state.current > 110) {
    setPlant(plantStage.normal5);
    dom.block.style.borderRadius = "20px";
    setProgressRank("Serious One");
    replaceClickHandler(click2, click3);
  }

  updateSoilProgress();
}

function click3() {
  recordClick(5);
  animateSoil();

  setScore();
  animateScore();
  setWaterMultiplier(3);

  if (state.drop5Flag == 0) {
    animateDrop(getDrop());
  }
  if (state.drop5Flag > 8) {
    stopDropAnimation(getDrop());
  }
  state.drop5Flag++;

  if (state.current >= 295) {
    setWaterMultiplier(4);
    setPlant(plantStage.normal6);
    setProgressRank("Broadleaf");
  }
  if (state.current >= 394) {
    state.current += 7;
  }
  updateSoilProgress();
  if (state.current > 500) {
    setWaterMultiplier(5);
    setPlant(plantStage.normal7);
    setScore("color:green");
    dom.block.style.borderRadius = "30px";
    setProgressRank("Giant!");
  }
  if (state.current >= NORMAL_STAGE_8_SCORE) {
    setPlant(plantStage.normal8);
    setProgressRank("Grand Monstera");
  }
  if (state.current >= NORMAL_STAGE_9_SCORE) {
    setWaterMultiplier(6);
    setPlant(plantStage.normal9);
    setProgressRank("Monstera Prime");
  }
  if (state.current > 993 && state.confirmationStep == 0) {
    state.confirmationStep = 1;
    if (confirm("Use the potion?")) {
      getSoil();
    }
  }
  if (state.current >= 2355 && state.confirmationStep == 1) {
    state.confirmationStep = 2;
    if (
      confirm(
        "Careful! This is your last chance to use the potion and join the dark side. There will not be another one..",
      )
    ) {
      getSoil(2366);
    } else {
      dom.soil.style.display = "none";
    }
  }
  if (state.current >= 2889) {
    dom.isolation.style.opacity = "1";
    state.isolationTicks++;
    startIsolation(state.isolationTicks, state.divider);
    state.storeEnabled = true;
  }
}

function getSoil(score) {
  removeClickHandler(click3);
  setScore("color:red;font-size:25px;");
  setProgressRank("Wizard!", "color:red;");
  setMultiplier("potion.png", "pot");

  dom.block.style.borderRadius = "45px";
  dom.block.style.boxShadow = "0 0 50px red";
  setPlant(plantStage.horror1);

  setSoil("0%");
  if (state.soilFlag == 0) {
    animateDrop(getDrop());
  }
  if (state.soilFlag > 5) {
    stopDropAnimation(getDrop());
  }
  state.soilFlag++;

  if (score >= 2015) {
    addClickHandler(click7);
  } else {
    addClickHandler(click4);
  }

  dom.soil.removeEventListener("click", getSoil);
  dom.soil.style.textDecoration = "line-through";
  dom.soil.classList.remove("getSoil");
  animateSoil();
  state.isSoiled = true;
}

function click4() {
  recordClick(11);
  dom.soil.style.display = "none";

  setScore("color:red;font-size:25px;");
  animateScore();
  setMultiplier("potion.png", "pot");

  if (state.current >= 1051) {
    replaceClickHandler(click4, click5);
  }
}

function click5() {
  recordClick(13);
  dom.score.style.width = "28%";
  dom.multiplier.style.width = "28%";
  dom.rank.style.width = "68%";

  setProgressRank("Archmage", "color:blue;");
  if (state.isSoiled) {
    setPlant(plantStage.horror2);
  }
  setScore("color:blue;font-size:25px;");
  animateScore();

  if (state.current > 1549) {
    replaceClickHandler(click5, click6);
  }
}

function click6() {
  recordClick(17);
  setScore("color:blue;font-size:25.2px;text-shadow:0 0 1px red;");
  animateScore();
  setMultiplier("potion2.png", "pot");

  if (state.potion2Flag == 0) {
    animateDrop(getDrop());
  }
  if (state.potion2Flag > 7) {
    stopDropAnimation(getDrop());
  }
  state.potion2Flag++;

  if (state.current > 2014) {
    replaceClickHandler(click6, click7);
  }
}

function click7() {
  recordClick(18);
  dom.soil.style.display = "none";

  if (state.isSoiled) {
    setProgressRank("Necromancer", "color:blue;text-shadow:0 0 2px black;");
    setPlant(plantStage.horror3);
  }
  if (!state.isSoiled) {
    setPlant(plantStage.normal9);
  }
  if (!state.isSoiled && !state.multi3Potion) {
    setProgressRank(
      `Farmer's Helper`,
      "color:green;text-shadow:0 0 2px black;",
    );
  }

  setScore("color:blue;font-size:25.3px;text-shadow:0 0 2px red;");
  animateScore();

  if (state.current >= 3000) {
    dom.isolation.style.opacity = "1";
    state.isolationTicks++;
    startIsolation(state.isolationTicks, state.divider);
    state.storeEnabled = true;
  }
}

function resetPage() {
  window.location.reload(false);
}

function resetWithStatsPrompt() {
  if (confirm("Show stats?")) {
    openModal("stats");
  } else {
    resetPage();
  }
}

function startIsolation(num, divider) {
  const currentNum = Math.floor(num * divider);
  dom.storeButton.style.display = "flex";

  if (currentNum <= 99) {
    dom.progress.style.height = currentNum + "%";
    dom.progress.style.transform = "scale(1)";
    return;
  }

  dom.progress.style.height = "100%";
  dom.progress.style.transform = "scale(1.1)";
  dom.coin.style.display = "flex";
  animateCoin();

  state.money++;
  state.divider += 0.13;
  dom.coinText.innerHTML = state.money;
  state.isolationTicks = 0;

  if (state.money == 999) {
    alert("you are sick, buddy!");
    resetPage();
  }
}

function formatPlayTime() {
  const endTime = new Date();
  const totalTime = state.startTime ? endTime - state.startTime : 0;
  const totalSeconds = Math.round(totalTime / 1000);

  if (totalSeconds >= 3600) {
    return Math.round(totalSeconds / 3600) + " hr";
  }
  if (totalSeconds >= 60) {
    return Math.round(totalSeconds / 60) + " min";
  }
  return totalSeconds + " sec";
}

const modal = {
  root: byId("modal"),
  panel: byId("modal_panel"),
  title: byId("modal_title"),
  body: byId("modal_body"),
  footer: byId("modal_footer"),
  close: byId("modal_close"),
  active: null,
};

function bindStoreCell(cell, bought, handler) {
  if (!cell) return;
  if (bought) {
    cell.classList.add("unactive");
    return;
  }
  cell.addEventListener("click", handler);
}

// Re-applied on every open while owned, since modal bodies are re-rendered.
function applyAutumnTheme() {
  modal.panel.style.background = `url(${imagePath("modalStoreBody.png")})`;
  modal.close.style.background = "orange";

  if (modal.active === "stats") {
    const resetBtn = byId("refresh_modal");
    const cheatBtn = byId("cheat_modal_open");
    if (resetBtn) resetBtn.style.background = "orange";
    if (cheatBtn) cheatBtn.style.background = "orange";
    modal.body.querySelectorAll(".stats_header").forEach((header) => {
      header.style.background = "orange";
    });
  }

  if (modal.active === "store") {
    modal.body.querySelectorAll(".cardstore").forEach((card) => {
      card.style.border = "1px solid grey";
    });
  }
}

const modals = {
  devlog: {
    title: "Monstera 2026 refresh",
    render: () => `
      <div class="devlog_body">
        <p class="dev_h1">Grow it. Feed it. See what happens.</p>
        <div class="devlog_sections">
          <section class="devlog_card">
            <h2>How to play</h2>
            <p>Click the plant to grow your monstera, raise your score, and unlock stronger watering power.</p>
            <p>Watch the soil meter. When it is ready, you can choose whether to push the plant further.</p>
          </section>
          <section class="devlog_card">
            <h2>Updates</h2>
            <ul>
              <li>Fresh visual redesign with softer motion and cleaner panels.</li>
              <li>New normal growth levels from stage 0 to stage 9.</li>
              <li>Expanded horror path with four dedicated stages.</li>
              <li>Water multiplier now shows drops in a row instead of swapped icons.</li>
            </ul>
          </section>
        </div>
      </div>
    `,
  },

  stats: {
    title: "Your stats",
    render: () => `
      <div class="stats_body">
        <div class="stats_box"><p class="stats_header">Clicks</p><p id="stat1">0</p></div>
        <div class="stats_box"><p class="stats_header">Time</p><p id="stat2"></p></div>
        <div class="stats_box"><p class="stats_header">Score</p><p id="stat3">0</p></div>
        <div class="stats_box"><p class="stats_header">Gold</p><p id="stat4">0</p></div>
      </div>
    `,
    footer: () => `
      <div class="stats_btns">
        <div class="btn" id="refresh_modal">start over</div>
        <div class="btn" id="cheat_modal_open">enter code</div>
      </div>
    `,
    onOpen() {
      byId("stat1").innerHTML = state.clicks;
      byId("stat2").innerHTML = formatPlayTime();
      byId("stat3").innerHTML = state.current;
      byId("stat4").innerHTML = state.money + "<br> gold";
      byId("refresh_modal").addEventListener("click", resetPage);
      byId("cheat_modal_open").addEventListener("click", () =>
        openModal("cheat"),
      );

      dom.refresh.style.display = "none";
      dom.storeButton.style.display = "none";
      dom.isolation.style.opacity = "0";
    },
    onClose() {
      dom.refresh.style.display = "block";
      if (state.storeEnabled) {
        dom.storeButton.style.display = "flex";
        dom.isolation.style.opacity = "1";
      }
    },
  },

  cheat: {
    title: "Cheat code",
    closeTo: "stats",
    render: () => `
      <div class="forCheat">
        <p id="cheatP">enter cheat code</p>
        <input type="text" id="cheatInp">
        <button id="cheatApp">apply</button>
      </div>
    `,
    onOpen() {
      const input = byId("cheatInp");
      if (input) input.value = "";
      byId("cheatApp").addEventListener("click", applyCheatCode);
    },
  },

  store: {
    title: "Shop",
    render: () => `
      <div class="modal_store_body" id="modal_store_body">
        <div class="cardstore" id="first_store_cell">
          <div class="cardstore_img"><img src="#" alt="pic1" id="pic1"></div>
          <div class="cardstore_name" id="name1">Potion x3</div>
          <div class="cardstore_price">Price: 2 coins</div>
        </div>
        <div class="cardstore" id="second_store_cell">
          <div class="cardstore_img"><img src="/assets/images/hoe_fullsize.png" alt="pic2"></div>
          <div class="cardstore_name">Hoe</div>
          <div class="cardstore_price">Price: 7 coins</div>
        </div>
        <div class="cardstore" id="third_store_cell">
          <div class="cardstore_img"><img src="/assets/images/hl_fullsize.png" alt="pic3"></div>
          <div class="cardstore_price">Autumn theme</div>
          <div class="cardstore_name">Price: 9 coins</div>
        </div>
        <div class="cardstore">
          <div class="cardstore_img"><img src="/assets/images/soon_Store.png" alt="pic4"></div>
          <div class="cardstore_price"></div>
          <div class="cardstore_name">---</div>
        </div>
      </div>
    `,
    footer: () =>
      `<div class="modal_store_footer">Gold coins available: <span id="nest">0</span></div>`,
    onOpen() {
      const firstImage = byId("pic1");
      const firstName = byId("name1");
      if (state.isSoiled) {
        firstImage.src = imagePath("potion3_fullsize.png");
        firstName.innerHTML = "Potion x3";
      } else {
        firstImage.src = imagePath("can2_fullsize.png");
        firstName.innerHTML = "Watering Can x2";
      }

      bindStoreCell(
        byId("first_store_cell"),
        state.multi3Potion,
        buyFirstStoreItem,
      );
      bindStoreCell(
        byId("second_store_cell"),
        state.secondBought,
        buySecondStoreItem,
      );
      bindStoreCell(
        byId("third_store_cell"),
        state.autumnTheme,
        buyThirdStoreItem,
      );

      const gold = byId("nest");
      gold.innerHTML = state.money;
      gold.style.color = state.money == 0 ? "red" : "green";

      dom.isolation.style.opacity = "0";
      dom.storeButton.style.display = "none";
      dom.coin.style.display = "none";
    },
    onClose() {
      dom.isolation.style.opacity = "1";
      dom.storeButton.style.display = "flex";
      dom.coin.style.display = state.money == 0 ? "none" : "flex";
    },
  },
};

function openModal(name) {
  const def = modals[name];
  if (!def) return;

  if (modal.active && modal.active !== name) {
    modals[modal.active].onClose?.();
  }

  modal.active = name;
  modal.panel.dataset.kind = name;
  modal.title.innerHTML = def.title ?? "";
  modal.body.innerHTML = def.render ? def.render() : "";
  modal.footer.innerHTML = def.footer ? def.footer() : "";

  def.onOpen?.();
  if (state.autumnTheme) applyAutumnTheme();

  modal.root.hidden = false;
  dom.wrap.style.filter = "blur(10px) grayscale(3)";
}

function closeModal() {
  if (!modal.active) return;

  const def = modals[modal.active];
  if (def.closeTo) {
    openModal(def.closeTo);
    return;
  }

  def.onClose?.();
  modal.active = null;
  modal.root.hidden = true;
  modal.body.innerHTML = "";
  modal.footer.innerHTML = "";
  dom.wrap.style.filter = "none";
}

function removeLateGameClickHandlers() {
  removeClickHandler(click3);
  removeClickHandler(click4);
  removeClickHandler(click5);
  removeClickHandler(click6);
  removeClickHandler(click7);
}

function buyFirstStoreItem() {
  if (state.money < 2) {
    alert("You are too broke for this, earn some gold and come back");
  }
  if (state.money >= 2) {
    if (state.isSoiled) {
      setMultiplier("potion3.png", "pot3");
      setPlant(plantStage.horror4);
      setProgressRank("Dark Lord", "color:blue;text-shadow:0 0 2px black;");
    }
    if (!state.isSoiled) {
      setMultiplier("can2.png", "pot3");
      setProgressRank("Farmer", "color:green;text-shadow:0 0 2px black;");
    }

    state.multi3Potion = true;
    playAudio("buy.mp3");
    removeLateGameClickHandlers();
    addClickHandler(click8);
    closeModal();
    state.money -= 2;
    dom.coinText.innerHTML = state.money;
  }
}

function buySecondStoreItem() {
  if (state.money < 7 && state.isSoiled) {
    alert("You are too broke for this, earn some gold and come back");
  }
  if (!state.isSoiled) {
    alert("Looks like you do not need this!");
  }
  if (state.money >= 7 && state.isSoiled) {
    setPlant(plantStage.normal9);
    playAudio("buy.mp3");
    state.isSoiled = false;
    state.secondBought = true;
    closeModal();
    state.money -= 7;
    dom.coinText.innerHTML = state.money;

    setMultiplier("can2.png", "pot3");
    if (state.multi3Potion) {
      setProgressRank("Farmer", "color:green;text-shadow:0 0 2px black;");
      setMultiplier("can2.png", "can2");
    } else {
      setMultiplier("can1.png", "pot3");
      setProgressRank(
        `Farmer's Helper`,
        "color:green;text-shadow:0 0 2px black;",
      );
    }
  }
}

function buyThirdStoreItem() {
  if (state.money < 9) {
    alert("You are too broke for this, earn some gold and come back");
  }
  if (state.money >= 9) {
    // persistent game-board styling
    for (let i = 0; i < dom.sections.length; i++) {
      dom.sections[i].style.borderBottom = "17px solid white";
      dom.sections[i].style.borderImage =
        `url(${imagePath("hlbak.png")}) round round 50`;
    }

    playAudio("crown.wav");
    dom.block.removeAttribute("ink-color");
    dom.block.setAttribute("ink-color", "orange");
    dom.block.style.boxShadow = "0 0 23px orange";
    dom.block.style.background = "ivory";
    dom.refresh.style.background = "orange";
    dom.spider.style.display = "block";
    dom.showStats.style.background = "orange";

    state.autumnTheme = true;
    applyAutumnTheme();

    const third = byId("third_store_cell");
    if (third) {
      third.classList.add("unactive");
      third.removeEventListener("click", buyThirdStoreItem);
    }

    state.money -= 9;
    dom.coinText.innerHTML = state.money;
    const gold = byId("nest");
    if (gold) gold.innerHTML = state.money;
  }
}

function click8() {
  recordClick(27);

  if (state.isSoiled) {
    setPlant(plantStage.horror4);
    setProgressRank("Dark Lord", "color:blue;text-shadow:0 0 2px black;");
  }
  if (!state.isSoiled) {
    setProgressRank("Farmer", "color:green;text-shadow:0 0 2px black;");
  }
  if (state.multi3Potion && state.isSoiled) {
    setMultiplier("potion3.png", "pot3");
  }
  if (state.multi3Potion && !state.isSoiled) {
    setMultiplier("can2.png", "pot3");
  }

  setScore("color:blue;font-size:25.6px;text-shadow:0 0 2px royalblue;");
  animateScore();

  if (state.boughtMultiplierFlag == 0) {
    animateDrop(getDrop());
  }
  if (state.boughtMultiplierFlag > 7) {
    stopDropAnimation(getDrop());
  }
  state.boughtMultiplierFlag++;
  state.isolationTicks++;
  startIsolation(state.isolationTicks, state.divider);
}

function bindEvents() {
  addClickHandler(click1);
  addClickHandler(startTimerOnce);

  dom.showDevlog.addEventListener("click", () => openModal("devlog"));
  dom.showStats.addEventListener("click", () => openModal("stats"));
  dom.storeButton.addEventListener("click", () => openModal("store"));
  dom.refresh.addEventListener("click", resetWithStatsPrompt);

  // close on backdrop / close button
  modal.root.addEventListener("click", (event) => {
    if (event.target.closest("[data-modal-close]")) closeModal();
  });
  // close on Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.root.hidden) closeModal();
  });
}

bindEvents();
