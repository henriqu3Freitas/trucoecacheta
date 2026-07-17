const SUPABASE_URL = "https://avambaxyojtesfqjcjph.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ggidVInxePrXo0vAufg5YQ_aHwM9Rq7";
const DESTINATION_URL = "https://cacheta.app.link/WI4K0q";
const META_CAPI_ENDPOINT = "/api/meta-capi";
const META_TEST_EVENT_CODE = "TEST5368";

const openTrigger = document.getElementById("openLeadForm");
const modal = document.getElementById("leadModal");
const form = document.getElementById("leadForm");
const status = document.getElementById("leadStatus");
const nameInput = document.getElementById("leadName");
const emailInput = document.getElementById("leadEmail");
const phoneInput = document.getElementById("leadPhone");

// Handle video autoplay and controls
function initializeVideo() {
  const video = document.getElementById("videoPlayer");
  const soundToggle = document.getElementById("soundToggle");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const playPauseIcon = document.getElementById("playPauseIcon");
  const rewindBtn = document.getElementById("rewindBtn");
  const forwardBtn = document.getElementById("forwardBtn");
  const progressBar = document.querySelector(".progress-bar");
  const progressFill = document.getElementById("progressFill");
  const currentTimeDisplay = document.getElementById("currentTime");
  const durationDisplay = document.getElementById("duration");
  const overlay = document.querySelector(".phone__overlay");
  
  if (!video) return;

  // Start unmuted
  video.muted = false;

  // Format time helper
  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Update duration when metadata loads
  video.addEventListener("loadedmetadata", () => {
    durationDisplay.textContent = formatTime(video.duration);
  });

  // Update progress bar and time display
  video.addEventListener("timeupdate", () => {
    const percentage = (video.currentTime / video.duration) * 100;
    progressFill.style.width = `${percentage}%`;
    currentTimeDisplay.textContent = formatTime(video.currentTime);
  });

  // Update play/pause button based on video state
  const updatePlayPauseIcon = () => {
    playPauseIcon.textContent = video.paused ? "▶️" : "⏸";
  };

  // Handle play/pause toggle
  playPauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    updatePlayPauseIcon();
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 3000);
  });

  // Handle rewind (10 seconds back)
  rewindBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    video.currentTime = Math.max(0, video.currentTime - 10);
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 3000);
  });

  // Handle forward (10 seconds forward)
  forwardBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 3000);
  });

  // Handle progress bar click
  progressBar.addEventListener("click", (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    video.currentTime = percentage * video.duration;
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 3000);
  });

  // Handle sound toggle button
  soundToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    soundToggle.classList.toggle("muted", video.muted);
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 3000);
  });

  // Update icon when video plays/pauses
  video.addEventListener("play", updatePlayPauseIcon);
  video.addEventListener("pause", updatePlayPauseIcon);

  // Show overlay on video interaction
  video.addEventListener("click", () => {
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), 3000);
  });

  // Force video to play on load
  const tryToPlay = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Video playing automatically");
          updatePlayPauseIcon();
        })
        .catch((error) => {
          console.log("Autoplay prevented:", error);
          // Try again on first user interaction
          const playOnInteraction = () => {
            video.play().catch((err) => console.log("Play error:", err));
            updatePlayPauseIcon();
            overlay.classList.add("active");
            setTimeout(() => overlay.classList.remove("active"), 3000);
            document.removeEventListener("click", playOnInteraction);
            document.removeEventListener("touchstart", playOnInteraction);
          };
          document.addEventListener("click", playOnInteraction, { once: true });
          document.addEventListener("touchstart", playOnInteraction, { once: true });
        });
    }
  };

  // Try to play immediately if video is ready
  if (video.readyState >= 2) {
    tryToPlay();
  } else {
    video.addEventListener("canplay", tryToPlay, { once: true });
  }

  // Also try after a short delay
  setTimeout(tryToPlay, 500);
}

// Initialize video when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeVideo);
} else {
  initializeVideo();
}

// ...existing code...

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => nameInput.focus(), 50);
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  openTrigger.focus();
}

function normalizePhone(value) {
  let digits = value.replace(/\D+/g, "");

  // If user includes Brazil country code (55), keep the national number only.
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 11);
}

function normalizeEmail(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function formatPhone(value) {
  const digits = normalizePhone(value).slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function setStatus(message, type) {
  status.textContent = message;
  status.dataset.state = type;
}

function setSubmitting(isSubmitting) {
  form.classList.toggle("is-submitting", isSubmitting);
  form.querySelector(".lead-form__submit").disabled = isSubmitting;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatEmail(value) {
  return normalizeEmail(value);
}

function createEventId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openDestination() {
  const destination = window.open(DESTINATION_URL, "_blank", "noopener,noreferrer");

  if (!destination) {
    window.location.href = DESTINATION_URL;
  }
}

async function saveLeadToSupabase(payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Não foi possível salvar o lead.");
  }
}

async function trackLeadConversion(payload) {
  const eventId = createEventId();

  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", { content_name: "Formulário Cacheta" }, { eventID: eventId });
  }

  try {
    const response = await fetch(META_CAPI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        eventId,
        testEventCode: META_TEST_EVENT_CODE,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Não foi possível enviar a conversão para a Meta.");
    }
  } catch (error) {
    console.error(error);
  }
}

openTrigger.addEventListener("click", (event) => {
  event.preventDefault();
  openModal();
});

phoneInput.addEventListener("input", () => {
  const previousLength = phoneInput.value.length;
  phoneInput.value = formatPhone(phoneInput.value);

  if (phoneInput.value.length > previousLength) {
    phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
  }
});

emailInput.addEventListener("input", () => {
  emailInput.value = formatEmail(emailInput.value);
});

modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const email = normalizeEmail(emailInput.value);
  const phone = normalizePhone(phoneInput.value);

  emailInput.value = email;

  if (!name || !isValidEmail(email) || phone.length < 10) {
    setStatus("Preencha nome, e-mail e telefone válidos.", "error");
    return;
  }

  setStatus("Enviando...", "loading");
  setSubmitting(true);

  try {
    await saveLeadToSupabase({
      name,
      email,
      phone,
    });

    await trackLeadConversion({
      name,
      email,
      phone,
    });

    setStatus("Tudo certo. Abrindo a Play Store...", "success");
    window.setTimeout(() => {
      openDestination();
    }, 700);
  } catch (error) {
    setStatus("Não foi possível salvar agora. Tente novamente.", "error");
    console.error(error);
  } finally {
    setSubmitting(false);
  }
});
