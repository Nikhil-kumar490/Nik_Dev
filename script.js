/**
 * KOMAL KUMARI - Cinematic Experience
 * State & Scene Manager
 */

document.addEventListener('DOMContentLoaded', initializeApp);

// =========================================
// STATE MANAGEMENT
// =========================================
const state = {
  currentSceneId: 'scene-1',
  currentPhotoIndex: 1,
  totalPhotos: 5,
  musicPlaying: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

const scenes = [
  'scene-1',
  'scene-2',
  'scene-3',
  'scene-4',
  'photo-experience',
  'scene-ending'
];

// =========================================
// INITIALIZATION
// =========================================
function initializeApp() {
  initializeScenes();
  initializeInteractions();
  initializeMusic();
  initializePhotoExperience();
  initializeAccessibility();
}

function initializeScenes() {
  // Ensure only scene 1 is active
  scenes.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === state.currentSceneId) {
        el.classList.add('scene-active');
        el.setAttribute('aria-hidden', 'false');
      } else {
        el.classList.remove('scene-active');
        el.setAttribute('aria-hidden', 'true');
      }
    }
  });
  
  updateProgressIndicator();
}

// =========================================
// SCENE TRANSITIONS
// =========================================
function goToNextScene() {
  const currentIndex = scenes.indexOf(state.currentSceneId);
  if (currentIndex < scenes.length - 1) {
    const nextSceneId = scenes[currentIndex + 1];
    transitionToScene(nextSceneId);
  }
}

function transitionToScene(targetSceneId) {
  const currentEl = document.getElementById(state.currentSceneId);
  const targetEl = document.getElementById(targetSceneId);
  
  if (!currentEl || !targetEl) return;
  
  // Fade out current
  currentEl.classList.remove('scene-active');
  currentEl.setAttribute('aria-hidden', 'true');
  
  // Wait for fade out, then fade in target
  // We don't strictly wait in CSS, the opacity handles it gracefully
  setTimeout(() => {
    state.currentSceneId = targetSceneId;
    targetEl.classList.add('scene-active');
    targetEl.setAttribute('aria-hidden', 'false');
    
    updateProgressIndicator();
    
    if (targetSceneId === 'photo-experience') {
      startPhotoExperience();
    }
  }, state.reducedMotion ? 50 : 600); // Wait for transition if not reduced motion
}

// =========================================
// SCENE 1: THE NO BUTTON GAME
// =========================================
function initializeInteractions() {
  const btnYes = document.getElementById('btnYes');
  const btnNo = document.getElementById('btnNo');
  const questionCard = document.getElementById('questionCard');
  
  if (!btnYes || !btnNo || !questionCard) return;

  // Setup mobile game layout if needed
  if (window.innerWidth <= 768) {
    questionCard.classList.add('mobile-game');
    // Set initial absolute positions for mobile
    btnYes.style.top = '50%';
    btnYes.style.left = '50%';
    
    btnNo.style.top = '80%';
    btnNo.style.left = '50%';
  }

  // YES Button
  btnYes.addEventListener('click', () => {
    btnYes.classList.add('clicked');
    
    // Start music on first interaction if possible
    attemptPlayMusic();
    
    // Transition after a slight delay
    setTimeout(() => {
      goToNextScene();
    }, 500);
  });
  
  // NO Button Evasion
  const evadeCursor = (e) => {
    if (state.reducedMotion) return; // Let it be clickable/hoverable on reduced motion
    
    const cardRect = questionCard.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();
    
    // We want the button to stay safely within the card
    // Padding of 10px from edges
    const safePadding = 10;
    const maxX = cardRect.width - btnRect.width - safePadding;
    const maxY = cardRect.height - btnRect.height - safePadding;
    
    // Generate random position within safe bounds
    let randomX = safePadding + Math.random() * (maxX - safePadding);
    let randomY = safePadding + Math.random() * (maxY - safePadding);
    
    // Check if the random position is too close to the YES button
    // (We don't want them to overlap)
    const yesRect = btnYes.getBoundingClientRect();
    // Convert yes rect to local coordinates of questionCard
    const yesLocalX = yesRect.left - cardRect.left;
    const yesLocalY = yesRect.top - cardRect.top;
    
    const dist = Math.hypot(randomX - yesLocalX, randomY - yesLocalY);
    if (dist < 100) { // If too close, invert the position
      randomX = maxX - randomX;
      randomY = maxY - randomY;
    }
    
    // Apply new position
    // Since CSS has btn-no position: absolute, we can just set left/top percentages
    const percX = (randomX / cardRect.width) * 100;
    const percY = (randomY / cardRect.height) * 100;
    
    btnNo.style.left = `${percX}%`;
    btnNo.style.top = `${percY}%`;
    // Reset margins/transform translation if needed
    btnNo.style.transform = `translate(-50%, -50%)`;
  };
  
  // Trigger on pointerenter (hover) and pointerdown (touch)
  btnNo.addEventListener('pointerenter', evadeCursor);
  btnNo.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // Prevent accidental click
    evadeCursor();
  });
  
  // Just in case they somehow click it
  btnNo.addEventListener('click', (e) => {
    if (!state.reducedMotion) {
      e.preventDefault();
      evadeCursor();
    }
  });

  // Continue buttons for scenes 2, 3, 4
  const btnC2 = document.getElementById('btnContinue2');
  if (btnC2) btnC2.addEventListener('click', goToNextScene);
  
  const btnC3 = document.getElementById('btnContinue3');
  if (btnC3) btnC3.addEventListener('click', goToNextScene);
  
  const btnC4 = document.getElementById('btnContinue4');
  if (btnC4) btnC4.addEventListener('click', goToNextScene);
}

// =========================================
// MUSIC PLAYER
// =========================================
function initializeMusic() {
  const audio = document.getElementById('audioPlayer');
  const controller = document.getElementById('musicController');
  const status = document.getElementById('musicStatus');
  
  if (!audio || !controller) return;
  
  controller.addEventListener('click', () => {
    if (state.musicPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.warn("Audio play failed on toggle:", err);
        status.textContent = "Error loading";
      });
    }
  });
  
  audio.addEventListener('play', () => {
    state.musicPlaying = true;
    controller.classList.add('playing');
    status.textContent = "Playing";
  });
  
  audio.addEventListener('pause', () => {
    state.musicPlaying = false;
    controller.classList.remove('playing');
    status.textContent = "Paused";
  });
  
  audio.addEventListener('error', () => {
    console.error("Audio file failed to load.");
    status.textContent = "Unavailable";
    controller.style.opacity = '0.5';
  });
}

function attemptPlayMusic() {
  const audio = document.getElementById('audioPlayer');
  if (!audio || state.musicPlaying) return;
  
  audio.play().then(() => {
    // Played successfully
  }).catch(err => {
    console.log("Autoplay prevented:", err);
    // Silent fail, user can tap the music icon
  });
}

// =========================================
// PHOTO EXPERIENCE
// =========================================
function initializePhotoExperience() {
  const photoContainer = document.getElementById('photoContainer');
  if (!photoContainer) return;
  
  photoContainer.addEventListener('click', () => {
    if (state.currentSceneId !== 'photo-experience') return;
    
    // Hide hint
    const hint = document.getElementById('photoHint');
    if (hint) hint.classList.remove('visible');
    
    if (state.currentPhotoIndex < state.totalPhotos) {
      // Go to next photo
      const currentPhoto = document.getElementById(`photo-${state.currentPhotoIndex}`);
      const nextPhoto = document.getElementById(`photo-${state.currentPhotoIndex + 1}`);
      
      if (currentPhoto) currentPhoto.classList.remove('photo-active');
      if (nextPhoto) nextPhoto.classList.add('photo-active');
      
      state.currentPhotoIndex++;
      updateProgressIndicator();
    } else {
      // Finished photos, go to ending
      goToNextScene();
    }
  });
}

function startPhotoExperience() {
  // Show hint after a delay
  setTimeout(() => {
    const hint = document.getElementById('photoHint');
    if (hint && state.currentPhotoIndex === 1) {
      hint.classList.add('visible');
    }
  }, 2000);
}

// =========================================
// PROGRESS INDICATOR
// =========================================
function updateProgressIndicator() {
  const indicator = document.getElementById('progressIndicator');
  const text = document.getElementById('progressText');
  
  if (!indicator || !text) return;
  
  if (state.currentSceneId === 'photo-experience') {
    indicator.classList.add('visible');
    text.textContent = `0${state.currentPhotoIndex} / 0${state.totalPhotos}`;
  } else if (state.currentSceneId === 'scene-ending' || state.currentSceneId === 'scene-1') {
    indicator.classList.remove('visible');
  } else {
    // Scene 2, 3, 4
    indicator.classList.add('visible');
    const sceneIndex = scenes.indexOf(state.currentSceneId); // 1, 2, 3
    // We can map scene 2->1, scene 3->2, scene 4->3
    text.textContent = `0${sceneIndex} / 03`;
  }
}

// =========================================
// ACCESSIBILITY & KEYBOARD NAV
// =========================================
function initializeAccessibility() {
  // Listen for reduced motion changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
    state.reducedMotion = e.matches;
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Allow space/enter to trigger YES on scene 1 if no button is focused
    if (state.currentSceneId === 'scene-1' && (e.key === 'Enter' || e.key === ' ')) {
      if (document.activeElement.tagName !== 'BUTTON') {
        const btnYes = document.getElementById('btnYes');
        if (btnYes) btnYes.click();
      }
    }
    
    // Right arrow to advance scenes (except scene 1 which requires the button)
    if (e.key === 'ArrowRight') {
      if (state.currentSceneId === 'scene-1') return;
      
      if (state.currentSceneId === 'photo-experience') {
        const photoContainer = document.getElementById('photoContainer');
        if (photoContainer) photoContainer.click();
      } else if (state.currentSceneId !== 'scene-ending') {
        goToNextScene();
      }
    }
  });
}
