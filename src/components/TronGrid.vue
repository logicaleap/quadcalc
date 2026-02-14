<template>
  <div class="tron-grid">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-small" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,240,255,0.04)" stroke-width="0.5" />
        </pattern>
        <pattern id="grid-large" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="url(#grid-small)" />
          <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(0,240,255,0.08)" stroke-width="1" />
        </pattern>
        <radialGradient id="grid-fade" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="rgba(0,240,255,0.06)" />
          <stop offset="100%" stop-color="rgba(0,240,255,0)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-large)" />
      <rect width="100%" height="100%" fill="url(#grid-fade)" />
    </svg>
  </div>
</template>

<style scoped>
.tron-grid {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
