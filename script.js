const birthdayConfig = {
  // Nama yang dipakai pada ucapan penutup.
  recipientName: "Nafaaa",
  // Foto kenangan yang disimpan bersama halaman.
  photos: Array.from({ length: 14 }, (_, index) => `assets/kenangan/foto-${String(index + 1).padStart(2, "0")}.jpeg`)
};

const intro = document.querySelector("#intro");
const continueButton = document.querySelector("#continueButton");
const photoCards = Array.from(document.querySelectorAll("[data-photo]"));
const backgroundMusic = document.querySelector("#backgroundMusic");
const musicToggle = document.querySelector("#musicToggle");
const pageParts = [
  document.querySelector(".site-header"),
  document.querySelector("main"),
  document.querySelector(".site-footer")
];
const skipLink = document.querySelector(".skip-link");
const closingSign = document.querySelector(".closing-sign");
const loveScene = document.querySelector("#loveScene");
const roseScene = document.querySelector("#roseScene");
const birthdayScene = document.querySelector("#birthdayScene");
const revealElements = document.querySelectorAll([
  ".site-header",
  ".hero-copy > *",
  ".hero-art",
  ".hero-bottom",
  ".section-heading > *",
  ".wish-layout > *",
  ".wish-footer",
  ".memories-intro > *",
  ".polaroid",
  ".gallery-note",
  ".video-layout > *",
  ".closing-section > .eyebrow",
  ".closing-section > h2",
  ".closing-sign",
  ".back-top",
  ".site-footer"
].join(","));
const motionTriggers = document.querySelectorAll(".wish-section, .closing-section");
const observedElements = new Set([...revealElements, ...motionTriggers]);
const motionEnabled = true;
let revealObserver = null;
let stopHeartArt = () => {};
let stopRoseArt = () => {};
let stopBirthdayArt = () => {};
let transitionTimer = 0;
let artStartTimer = 0;
let heartWatchdog = 0;
let roseWatchdog = 0;
let introFinished = false;
let roseStarted = false;
let transitionStarted = false;
let musicStartPending = false;

function updateMusicToggle() {
  const isPlaying = !backgroundMusic.paused;
  musicToggle.hidden = false;
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", isPlaying ? "Jeda musik" : "Putar musik");
}

function startBackgroundMusic() {
  if (!backgroundMusic.paused || musicStartPending) return;
  const playback = backgroundMusic.play();
  if (!playback || typeof playback.then !== "function") return;
  musicStartPending = true;
  playback.then(() => {
    musicStartPending = false;
    document.removeEventListener("pointerdown", handleMusicGesture, true);
    document.removeEventListener("keydown", handleMusicGesture, true);
    updateMusicToggle();
  }).catch(() => {
    musicStartPending = false;
    updateMusicToggle();
  });
}

function handleMusicGesture(event) {
  if (event.target.closest?.("#musicToggle")) return;
  startBackgroundMusic();
}

backgroundMusic.addEventListener("playing", updateMusicToggle);
backgroundMusic.addEventListener("pause", updateMusicToggle);
backgroundMusic.addEventListener("error", updateMusicToggle);
musicToggle.addEventListener("click", () => {
  if (musicStartPending) return;
  if (backgroundMusic.paused) startBackgroundMusic();
  else backgroundMusic.pause();
});
document.addEventListener("pointerdown", handleMusicGesture, true);
document.addEventListener("keydown", handleMusicGesture, true);
startBackgroundMusic();

function clearScrollReveals() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = null;
  document.documentElement.classList.remove("motion-ready");
  observedElements.forEach((element) => element.classList.remove("scroll-reveal", "is-in-view"));
}

function startScrollReveals() {
  clearScrollReveals();
  if (!("IntersectionObserver" in window)) {
    observedElements.forEach((element) => element.classList.add("is-in-view"));
    return;
  }
  revealElements.forEach((element) => element.classList.add("scroll-reveal"));
  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in-view");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -42px 0px" });
  observedElements.forEach((element) => revealObserver.observe(element));
  document.documentElement.classList.add("motion-ready");
}

function transitionToRose() {
  if (introFinished || roseStarted || transitionStarted) return;
  roseStarted = true;
  window.clearTimeout(heartWatchdog);
  stopHeartArt();
  roseScene.hidden = false;
  roseScene.classList.add("is-visible");
  loveScene.classList.add("is-leaving");
  transitionTimer = window.setTimeout(() => {
    if (introFinished) return;
    loveScene.hidden = true;
  }, 750);
  artStartTimer = window.setTimeout(() => {
    if (introFinished || transitionStarted) return;
    stopRoseArt = window.startRoseAnimation
      ? window.startRoseAnimation(transitionToBirthday)
      : () => {};
  }, 100);
  roseWatchdog = window.setTimeout(transitionToBirthday, 21200);
}

function transitionToBirthday() {
  if (introFinished || transitionStarted) return;
  transitionStarted = true;
  window.clearTimeout(heartWatchdog);
  window.clearTimeout(roseWatchdog);
  window.clearTimeout(artStartTimer);
  stopRoseArt();
  birthdayScene.hidden = false;
  birthdayScene.style.display = "flex";
  birthdayScene.style.opacity = "1";
  birthdayScene.style.visibility = "visible";
  birthdayScene.classList.add("is-visible");
  roseScene.classList.add("is-leaving");
  loveScene.classList.add("is-leaving");
  const fadeDuration = motionEnabled ? 750 : 0;
  window.setTimeout(() => {
    if (introFinished) return;
    stopBirthdayArt = window.startBirthdayCake
      ? window.startBirthdayCake(continueButton)
      : () => { continueButton.hidden = false; };
  }, 100);
  transitionTimer = window.setTimeout(() => {
    if (introFinished) return;
    loveScene.hidden = true;
    roseScene.hidden = true;
  }, fadeDuration);
}

stopHeartArt = window.startOriginalHeart
  ? window.startOriginalHeart(transitionToRose)
  : () => transitionToRose();
heartWatchdog = window.setTimeout(transitionToRose, 10500);

document.body.classList.add("intro-open");
pageParts.forEach((part) => { part.inert = true; });
const recipientName = document.querySelector("#recipientName");
if (recipientName) recipientName.textContent = birthdayConfig.recipientName;
closingSign.firstChild.nodeValue = "selamat ulang tahun, " + birthdayConfig.recipientName + " ";

photoCards.forEach((card, index) => {
  const imagePath = birthdayConfig.photos[Number(card.dataset.photo)];
  if (!imagePath) return;
  const image = document.createElement("img");
  image.src = imagePath;
  image.alt = card.querySelector("figcaption span").textContent;
  image.loading = "lazy";
  card.querySelector(".photo-window").prepend(image);
  card.querySelector(".photo-placeholder").remove();
});

function finishIntro() {
  introFinished = true;
  window.clearTimeout(transitionTimer);
  window.clearTimeout(artStartTimer);
  window.clearTimeout(heartWatchdog);
  window.clearTimeout(roseWatchdog);
  stopHeartArt();
  stopRoseArt();
  stopBirthdayArt();
  intro.classList.add("is-finished");
  document.body.classList.remove("intro-open");
  pageParts.forEach((part) => { part.inert = false; });
  if (motionEnabled) startScrollReveals();
  skipLink.removeAttribute("tabindex");
  const story = document.querySelector("#cerita");
  story.setAttribute("tabindex", "-1");
  story.focus({ preventScroll: true });
}

continueButton.addEventListener("click", finishIntro);
