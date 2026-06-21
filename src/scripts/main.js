const imagePath = (file) => `/assets/images/${file}`;
const audioPath = (file) => `/assets/audio/${file}`;

const plantStage = {
  normal1: '1.png',
  normal2: '2.png',
  normal3: '3.png',
  normal4: '4.png',
  normal5: '5.png',
  normal6: '6.png',
  normal7: '7.png',
  horror1: '8.png',
  horror2: '9.png',
  horror3: '10.png',
};

const SOIL_READY_SCORE = 544;
const soilProgressPoints = [
  { score: 0, percent: 0 },
  { score: 19, percent: 10 },
  { score: 39, percent: 25 },
  { score: 49, percent: 35 },
  { score: 71, percent: 50 },
  { score: 91, percent: 65 },
  { score: 201, percent: 75 },
  { score: 295, percent: 95 },
  { score: 394, percent: 99 },
  { score: SOIL_READY_SCORE, percent: 100 },
];

const dom = {
  wrap: document.getElementById('wrap'),
  block: document.getElementById('block'),
  plant: document.getElementById('plant'),
  label: document.getElementById('label'),
  score: document.getElementById('scoreD'),
  rank: document.getElementById('name'),
  multiplier: document.getElementById('currentApp'),
  soil: document.getElementById('soil'),
  refresh: document.getElementById('refresh'),
  showStats: document.getElementById('show_stat'),

  cheatButton: document.getElementById('cheat_modal_open'),
  cheatClose: document.getElementById('close_cheat'),
  cheatModal: document.getElementById('modal_cheat'),
  cheatInput: document.getElementById('cheatInp'),
  cheatApply: document.getElementById('cheatApp'),

  devlog: document.getElementById('devlog'),
  showDevlog: document.getElementById('showDevlog'),
  closeDevlog: document.getElementById('close_devlog'),

  statsModal: document.getElementById('stats'),
  closeStats: document.getElementById('close_modal'),
  resetFromStats: document.getElementById('refresh_modal'),
  statsClicks: document.getElementById('stat1'),
  statsTime: document.getElementById('stat2'),
  statsScore: document.getElementById('stat3'),
  statsGold: document.getElementById('stat4'),

  isolation: document.getElementById('isolation'),
  progress: document.getElementById('progress'),
  coin: document.getElementById('money'),
  coinText: document.getElementById('money_txt'),
  storeButton: document.getElementById('btnStore'),

  storeModal: document.getElementById('modal_store'),
  closeStore: document.getElementById('close_store'),
  storeBody: document.getElementById('modal_store_body'),
  storeAvailableGold: document.getElementById('nest'),
  firstStoreCell: document.getElementById('first_store_cell'),
  secondStoreCell: document.getElementById('second_store_cell'),
  thirdStoreCell: document.getElementById('third_store_cell'),
  firstStoreImage: document.getElementById('pic1'),
  firstStoreName: document.getElementById('name1'),

  spider: document.getElementById('spider'),
  sections: document.getElementsByClassName('section'),
  statHeaders: document.getElementsByClassName('stats_header'),
};

const state = {
  current: 0,
  clicks: 0,
  money: 0,
  startTime: null,
  soilText: '',

  cheater: false,
  isSoiled: false,
  storeEnabled: false,
  multi3Potion: false,

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

function initWow() {
  if (window.WOW) {
    new window.WOW().init();
  }
}

function playAudio(file) {
  const audio = new Audio();
  audio.src = audioPath(file);
  audio.play();
}

function setScore(style = '') {
  const styleAttribute = style ? ` style="${style}"` : '';
  dom.score.innerHTML = `
    <div class="section_panel">
      <div class="section_label">Your current score</div>
      <div class="section_value" id="time"${styleAttribute}>${state.current}</div>
    </div>
  `;
}

function animateScore() {
  const timer = document.getElementById('time');
  if (!timer) return;
  timer.classList.toggle('wow');
  timer.classList.toggle('tada');
}

function setMultiplier(image, alt, compact = false) {
  dom.multiplier.innerHTML = `
    <div class="section_panel section_panel--multiplier">
      <div class="section_label">Your current multiplier</div>
      <img class="section_media" src="${imagePath(image)}" alt="${alt}" id="drop">
    </div>
  `;
}

function getDrop() {
  return document.getElementById('drop');
}

function animateDrop(drop) {
  if (!drop) return;
  drop.classList.add('wow');
  drop.classList.add('tada');
  drop.setAttribute('data-wow-duration', '2s');
}

function stopDropAnimation(drop) {
  if (!drop) return;
  drop.classList.remove('wow');
  drop.classList.remove('tada');
  drop.removeAttribute('data-wow-duration');
}

function setRank(rank, style = '') {
  const styleAttribute = style ? ` style="${style}"` : '';
  dom.rank.innerHTML = `
    <div class="section_panel">
      <div class="section_label">Your rank</div>
      <div class="section_value section_value--rank"${styleAttribute}>${rank}</div>
    </div>
  `;
}

function setProgressRank(rank, style = '') {
  setRank(state.cheater ? 'Cheater' : rank, style);
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
      return Math.min(100, Math.round(previous.percent + (scoreProgress / scoreRange) * percentRange));
    }
  }

  return 100;
}

function activateSoilButton() {
  if (state.soilReady) return;

  state.soilReady = true;
  dom.soil.style.background = 'red';
  dom.soil.style.width = '115px';
  dom.soil.style.height = '115px';
  dom.soil.style.borderRadius = '50px';
  dom.soil.classList.add('getSoil');
  dom.soil.addEventListener('click', getSoil);
  dom.refresh.style.marginLeft = '56px';
}

function updateSoilProgress() {
  if (state.isSoiled) return;

  const percent = getSoilPercent(state.current);
  if (percent >= 100) {
    setSoil('<span class="soil_percent">100%</span><span class="soil_cta">tap me!</span>');
    activateSoilButton();
    return;
  }

  setSoil(`${percent}%`);
}

function setPlant(stage) {
  dom.plant.src = imagePath(stage);
}

function addClickHandler(handler) {
  dom.block.addEventListener('click', handler);
}

function removeClickHandler(handler) {
  dom.block.removeEventListener('click', handler);
}

function replaceClickHandler(from, to) {
  removeClickHandler(from);
  addClickHandler(to);
}

function revealGameUi() {
  dom.label.style.display = 'none';
  dom.showStats.style.display = 'block';

  dom.score.classList.add('wow', 'fadeInLeft');
  dom.refresh.classList.add('wow', 'slideInUp');
  dom.showStats.classList.add('wow', 'slideInDown');
  dom.multiplier.classList.add('wow', 'fadeInRight');
  dom.rank.classList.add('wow', 'fadeInDown');

  dom.score.style.display = 'flex';
  dom.refresh.style.display = 'block';
  dom.multiplier.style.display = 'flex';
  dom.rank.style.display = 'flex';
}

function clearIntroAnimations() {
  dom.score.classList.remove('wow', 'fadeInLeft');
  dom.refresh.classList.remove('wow', 'slideInUp');
  dom.showStats.classList.remove('wow', 'slideInDown');
  dom.multiplier.classList.remove('wow', 'fadeInRight');
  dom.rank.classList.remove('wow', 'fadeInDown');
}

function recordClick(amount) {
  state.current += amount;
  state.clicks++;
  playAudio('08368.mp3');
}

function startTimerOnce() {
  state.startTime = new Date();
  removeClickHandler(startTimerOnce);
}

function openCheatModal() {
  dom.cheatModal.style.display = 'flex';
  dom.wrap.style.filter = 'blur(10px) grayscale(3)';
  closeStatsModal();
  dom.cheatInput.value = '';
}

function applyCheatCode() {
  if (dom.cheatInput.value == 'truegamer') {
    const answer = prompt('Set score', state.current);
    if (isNaN(answer)) {
      alert('numbers only');
    } else {
      state.current = +answer;
      alert('Your new score: ' + answer);
      dom.cheatInput.value = '';
      setScore();
      state.cheater = true;
      playAudio('buuu.mp3');
    }
  } if (dom.cheatInput.value == 'moneymaker') {
    const answer = prompt('Set coin amount', state.money);
    if (isNaN(answer)) {
      alert('numbers only');
    } else {
      state.money = +answer;
      alert('In your wallet: ' + answer);
      dom.cheatInput.value = '';
      dom.coin.style.display = 'flex';
      dom.coinText.innerHTML = state.money;
      state.cheater = true;
      playAudio('buuu.mp3');
    }
  } else {
    dom.cheatInput.value = '';
  }
}

function closeCheatModal() {
  dom.cheatModal.style.display = 'none';
  dom.wrap.style.filter = 'none';
  showStatsModal();
}

function click1() {
  recordClick(1);

  if (state.animationFlag == 0 && state.current == 1) {
    revealGameUi();
  } else {
    clearIntroAnimations();
  }

  state.animationFlag++;
  initWow();
  dom.soil.style.display = 'flex';
  dom.soil.classList.toggle('wow');

  setScore();
  animateScore();
  setMultiplier('drop.png', 'drop', true);

  const drop = getDrop();
  if (state.current >= 1) {
    setPlant(plantStage.normal1);
    initWow();
    animateDrop(drop);
    drop.setAttribute('data-wow-iteration', '2');
    setProgressRank('Tiny Sprout');
    dom.showStats.style.display = 'block';
  }
  if (state.current >= 6) {
    stopDropAnimation(drop);
  }
  if (state.current >= 15) {
    setPlant(plantStage.normal2);
    setProgressRank('First Leaf');
  }
  if (state.current > 29) {
    setProgressRank('Young One');
    setPlant(plantStage.normal3);
  }
  if (state.current > 59) {
    replaceClickHandler(click1, click2);
    setPlant(plantStage.normal4);
    setProgressRank('Teen');
  }

  updateSoilProgress();
}

function click2() {
  recordClick(2);
  state.animationFlag = '';
  dom.soil.classList.toggle('wow');

  setScore();
  animateScore();
  setMultiplier('drop2.png', 'drop2');

  if (state.drop2Flag >= 0) {
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
    dom.block.style.borderRadius = '20px';
    setProgressRank('Serious One');
    replaceClickHandler(click2, click3);
  }

  updateSoilProgress();
}

function click3() {
  recordClick(5);
  dom.soil.classList.toggle('wow');

  setScore();
  animateScore();
  setMultiplier('drop5.png', 'drop5');

  if (state.drop5Flag == 0) {
    animateDrop(getDrop());
  }
  if (state.drop5Flag > 8) {
    stopDropAnimation(getDrop());
  }
  state.drop5Flag++;

  if (state.current >= 295) {
    setPlant(plantStage.normal6);
    setProgressRank('Broadleaf');
  }
  if (state.current >= 394) {
    state.current += 7;
  }
  updateSoilProgress();
  if (state.current > 500) {
    setPlant(plantStage.normal7);
    setScore('color:green');
    dom.block.style.borderRadius = '30px';
    setProgressRank('Giant!');
  }
  if (state.current > 993 && state.confirmationStep == 0) {
    state.confirmationStep = 1;
    if (confirm('Use the potion?')) {
      getSoil();
    }
  }
  if (state.current >= 2355 && state.confirmationStep == 1) {
    state.confirmationStep = 2;
    if (confirm('Careful! This is your last chance to use the potion and join the dark side. There will not be another one..')) {
      getSoil(2366);
    } else {
      dom.soil.style.display = 'none';
    }
  }
  if (state.current >= 2889) {
    dom.isolation.style.opacity = '1';
    state.isolationTicks++;
    startIsolation(state.isolationTicks, state.divider);
    state.storeEnabled = true;
  }
}

function getSoil(score) {
  removeClickHandler(click3);
  setScore('color:red;font-size:25px;');
  setProgressRank('Wizard!', 'color:red;');
  setMultiplier('potion.png', 'pot');

  dom.block.style.borderRadius = '45px';
  dom.block.style.boxShadow = '0 0 50px red';
  setPlant(plantStage.horror1);

  setSoil('0%');
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

  dom.soil.removeEventListener('click', getSoil);
  dom.soil.style.textDecoration = 'line-through';
  dom.soil.classList.remove('getSoil');
  dom.soil.classList.toggle('wow');
  dom.soil.classList.toggle('pulse');
  state.isSoiled = true;
}

function click4() {
  recordClick(11);
  dom.soil.style.display = 'none';

  setScore('color:red;font-size:25px;');
  animateScore();
  setMultiplier('potion.png', 'pot');

  if (state.current >= 1051) {
    replaceClickHandler(click4, click5);
  }
}

function click5() {
  recordClick(13);
  dom.score.style.width = '28%';
  dom.multiplier.style.width = '28%';
  dom.rank.style.width = '68%';

  setProgressRank('Archmage', 'color:blue;');
  setScore('color:blue;font-size:25px;');
  animateScore();

  if (state.current > 1549) {
    replaceClickHandler(click5, click6);
  }
}

function click6() {
  recordClick(17);
  setScore('color:blue;font-size:25.2px;text-shadow:0 0 1px red;');
  animateScore();
  setMultiplier('potion2.png', 'pot');

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
  dom.soil.style.display = 'none';

  if (state.isSoiled) {
    setProgressRank('Necromancer', 'color:blue;text-shadow:0 0 2px black;');
    setPlant(plantStage.horror2);
  }
  if (!state.isSoiled) {
    setPlant(plantStage.normal7);
  }
  if (!state.isSoiled && !state.multi3Potion) {
    setProgressRank(`Farmer's Helper`, 'color:green;text-shadow:0 0 2px black;');
  }

  setScore('color:blue;font-size:25.3px;text-shadow:0 0 2px red;');
  animateScore();
  const timer = document.getElementById('time');
  timer.setAttribute('data-wow-duration', '2s');

  if (state.current >= 3000) {
    dom.isolation.style.opacity = '1';
    state.isolationTicks++;
    startIsolation(state.isolationTicks, state.divider);
    state.storeEnabled = true;
  }
}

function showDevlog() {
  dom.devlog.style.display = 'flex';
  dom.wrap.style.filter = 'blur(10px) grayscale(3)';
}

function closeDevlog() {
  dom.devlog.style.display = 'none';
  dom.wrap.style.filter = 'none';
}

function resetPage() {
  window.location.reload(false);
}

function resetWithStatsPrompt() {
  const answer = confirm('Show stats?');
  if (answer) {
    showStatsModal();
  } else {
    resetPage();
  }
}

function startIsolation(num, divider) {
  const currentNum = Math.floor(num * divider);
  dom.storeButton.style.display = 'flex';

  if (currentNum <= 99) {
    dom.progress.style.height = currentNum + '%';
    dom.progress.style.transform = 'scale(1)';
    return;
  }

  initWow();
  dom.progress.style.height = '100%';
  dom.progress.style.transform = 'scale(1.1)';
  dom.coin.style.display = 'flex';
  dom.coin.classList.add('wow', 'rubberBand');
  dom.coin.setAttribute('data-wow-duration', '2s');

  state.money++;
  state.divider += 0.13;
  dom.coinText.innerHTML = state.money;
  state.isolationTicks = 0;

  if (state.money == 999) {
    alert('you are sick, buddy!');
    resetPage();
  }
}

function formatPlayTime() {
  const endTime = new Date();
  const totalTime = state.startTime ? endTime - state.startTime : 0;
  const totalSeconds = Math.round(totalTime / 1000);

  if (totalSeconds >= 3600) {
    return Math.round(totalSeconds / 3600) + ' hr';
  }
  if (totalSeconds >= 60) {
    return Math.round(totalSeconds / 60) + ' min';
  }
  return totalSeconds + ' sec';
}

function showStatsModal() {
  dom.statsModal.style.display = 'flex';
  dom.wrap.style.filter = 'blur(10px) grayscale(3)';

  dom.statsClicks.innerHTML = state.clicks;
  dom.statsTime.innerHTML = formatPlayTime();
  dom.statsScore.innerHTML = state.current;
  dom.statsGold.innerHTML = state.money + '<br> gold';

  dom.refresh.style.display = 'none';
  dom.storeButton.style.display = 'none';
  dom.isolation.style.opacity = '0';
}

function closeStatsModal() {
  dom.statsModal.style.display = 'none';
  dom.wrap.style.filter = 'none';
  dom.refresh.style.display = 'block';

  if (state.storeEnabled) {
    dom.storeButton.style.display = 'flex';
    dom.isolation.style.opacity = '1';
  }
}

function showStore() {
  if (state.isSoiled) {
    dom.firstStoreImage.src = imagePath('potion3_fullsize.png');
    dom.firstStoreName.innerHTML = 'Potion x3';
  }
  if (!state.isSoiled) {
    dom.firstStoreImage.src = imagePath('can2_fullsize.png');
    dom.firstStoreName.innerHTML = 'Watering Can x2';
  }

  dom.storeModal.style.display = 'flex';
  dom.storeModal.style.opacity = '0.95';
  dom.wrap.style.filter = 'blur(10px) grayscale(3)';
  dom.isolation.style.opacity = '0';
  dom.storeButton.style.display = 'none';
  dom.coin.style.display = 'none';
  dom.storeAvailableGold.innerHTML = state.money;
  dom.storeAvailableGold.style.color = state.money == 0 ? 'red' : 'green';
}

function hideStore() {
  dom.storeModal.style.opacity = '0';
  dom.storeModal.style.display = 'none';
  dom.wrap.style.filter = 'none';
  dom.isolation.style.opacity = '1';
  dom.storeButton.style.display = 'flex';
  dom.coin.style.display = state.money == 0 ? 'none' : 'flex';
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
    alert('You are too broke for this, earn some gold and come back');
  } if (state.money >= 2) {
    if (state.isSoiled) {
      setMultiplier('potion3.png', 'pot3');
      setPlant(plantStage.horror3);
      setProgressRank('Dark Lord', 'color:blue;text-shadow:0 0 2px black;');
    } if (!state.isSoiled) {
      setMultiplier('can2.png', 'pot3');
      setProgressRank('Farmer', 'color:green;text-shadow:0 0 2px black;');
    }

    state.multi3Potion = true;
    playAudio('buy.mp3');
    removeLateGameClickHandlers();
    addClickHandler(click8);
    dom.firstStoreCell.removeEventListener('click', buyFirstStoreItem);
    dom.firstStoreCell.classList.add('unactive');
    hideStore();
    state.money -= 2;
    dom.coinText.innerHTML = state.money;
  }
}

function buySecondStoreItem() {
  if (state.money < 7 && state.isSoiled) {
    alert('You are too broke for this, earn some gold and come back');
  }
  if (!state.isSoiled) {
    alert('Looks like you do not need this!');
  } if (state.money >= 7 && state.isSoiled) {
    setPlant(plantStage.normal7);
    playAudio('buy.mp3');
    state.isSoiled = false;
    dom.secondStoreCell.removeEventListener('click', buySecondStoreItem);
    dom.secondStoreCell.classList.add('unactive');
    hideStore();
    state.money -= 7;
    dom.coinText.innerHTML = state.money;

    setMultiplier('can2.png', 'pot3');
    if (state.multi3Potion) {
      setProgressRank('Farmer', 'color:green;text-shadow:0 0 2px black;');
      setMultiplier('can2.png', 'can2');
    } else {
      setMultiplier('can1.png', 'pot3');
      setProgressRank(`Farmer's Helper`, 'color:green;text-shadow:0 0 2px black;');
    }
  }
}

function buyThirdStoreItem() {
  if (state.money < 9) {
    alert('You are too broke for this, earn some gold and come back');
  }
  if (state.money >= 9) {
    for (let i = 0; i < dom.sections.length; i++) {
      dom.sections[i].style.borderBottom = '17px solid white';
      dom.sections[i].style.borderImage = `url(${imagePath('hlbak.png')}) round round 50`;
    }

    playAudio('crown.wav');
    dom.block.removeAttribute('ink-color');
    dom.block.setAttribute('ink-color', 'orange');
    dom.block.style.boxShadow = '0 0 23px orange';
    dom.block.style.background = 'ivory';
    dom.cheatButton.style.background = 'orange';
    dom.refresh.style.background = 'orange';
    dom.spider.style.display = 'block';
    dom.showStats.style.background = 'orange';
    dom.closeStore.style.background = 'orange';
    dom.statsModal.style.background = `url(${imagePath('modalStoreBody.png')})`;
    dom.storeModal.style.background = `url(${imagePath('modalStoreBody.png')})`;

    for (let i = 0; i < dom.storeBody.children.length; i++) {
      dom.storeBody.children[i].style.border = '1px solid grey';
    }
    for (let i = 0; i < dom.statHeaders.length; i++) {
      dom.statHeaders[i].style.background = 'orange';
    }

    dom.resetFromStats.style.background = 'orange';
    dom.thirdStoreCell.removeEventListener('click', buyThirdStoreItem);
    dom.thirdStoreCell.classList.add('unactive');
    state.money -= 9;
    dom.coinText.innerHTML = state.money;
    dom.storeAvailableGold.innerHTML = state.money;
  }
}

function click8() {
  recordClick(27);

  if (state.isSoiled) {
    setPlant(plantStage.horror3);
    setProgressRank('Dark Lord', 'color:blue;text-shadow:0 0 2px black;');
  }
  if (!state.isSoiled) {
    setProgressRank('Farmer', 'color:green;text-shadow:0 0 2px black;');
  }
  if (state.multi3Potion && state.isSoiled) {
    setMultiplier('potion3.png', 'pot3');
  }
  if (state.multi3Potion && !state.isSoiled) {
    setMultiplier('can2.png', 'pot3');
  }

  setScore('color:blue;font-size:25.6px;text-shadow:0 0 2px royalblue;');
  animateScore();
  const timer = document.getElementById('time');
  timer.setAttribute('data-wow-duration', '2s');

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

  dom.cheatButton.addEventListener('click', openCheatModal);
  dom.cheatApply.addEventListener('click', applyCheatCode);
  dom.cheatClose.addEventListener('click', closeCheatModal);

  dom.showDevlog.addEventListener('click', showDevlog);
  dom.closeDevlog.addEventListener('click', closeDevlog);
  dom.refresh.addEventListener('click', resetWithStatsPrompt);
  dom.resetFromStats.addEventListener('click', resetPage);

  dom.showStats.addEventListener('click', showStatsModal);
  dom.closeStats.addEventListener('click', closeStatsModal);

  dom.storeButton.addEventListener('click', showStore);
  dom.closeStore.addEventListener('click', hideStore);
  dom.firstStoreCell.addEventListener('click', buyFirstStoreItem);
  dom.secondStoreCell.addEventListener('click', buySecondStoreItem);
  dom.thirdStoreCell.addEventListener('click', buyThirdStoreItem);
}

bindEvents();
