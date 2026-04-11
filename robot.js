/* ============================================================
   robot.js — Three.js 3D robot in hero avatar circle
   Mouse movement over the hero section rotates the robot
   so it always faces the cursor.
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }   from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const canvas  = document.getElementById('robotCanvas');
const avatar  = document.getElementById('robotAvatar');
const hero    = document.getElementById('hero');

if (!canvas || !hero) throw new Error('Robot: required DOM elements missing.');

// Full portrait canvas — head to foot, centred on orbit-system
const W = 260, H = 420;

// ── Renderer ──────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha:            true,   // transparent background
  antialias:        true,
  powerPreference: 'high-performance',
});
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping      = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled   = false;
renderer.setClearColor(0x000000, 0); // fully transparent

// ── Scene & Camera ────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, 0.01, 100);
camera.position.set(0, 0, 3.0);
camera.lookAt(0, 0, 0);

// ── Lighting ──────────────────────────────────────────────
// Soft ambient so no face is pitch black
const ambient = new THREE.AmbientLight(0x8b5cf6, 0.7);
scene.add(ambient);

// Purple key light — upper right
const keyLight = new THREE.DirectionalLight(0xc084fc, 4);
keyLight.position.set(2.5, 4, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width  = 512;
keyLight.shadow.mapSize.height = 512;
scene.add(keyLight);

// Pink fill — left side
const fillLight = new THREE.PointLight(0xec4899, 3, 20);
fillLight.position.set(-3, 0.5, 2);
scene.add(fillLight);

// Cyan rim — back low (gives depth / separation from bg)
const rimLight = new THREE.PointLight(0x06b6d4, 2, 18);
rimLight.position.set(0.5, -2, -2.5);
scene.add(rimLight);

// Subtle warm top highlight
const topLight = new THREE.PointLight(0xffffff, 1.2, 10);
topLight.position.set(0, 5, 1);
scene.add(topLight);

// ── Model ─────────────────────────────────────────────────
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.setMeshoptDecoder(MeshoptDecoder); // needed for gltf-transform meshopt output

let model  = null;
let mixer  = null;
const clock = new THREE.Clock();

loader.load(
  './ninja_robot.glb',
  (gltf) => {
    model = gltf.scene;

    // ── Auto-fit: measure all 3 axes, log them so we can see orientation ──
    const box0  = new THREE.Box3().setFromObject(model);
    const size0 = box0.getSize(new THREE.Vector3());
    console.log('[robot] raw size x/y/z:', size0.x.toFixed(2), size0.y.toFixed(2), size0.z.toFixed(2));

    // Fill 78% of canvas height → full portrait with breathing room top & bottom
    const heightDim = Math.max(size0.y, size0.z);
    const scale = 2.2 / heightDim;
    model.scale.setScalar(scale);

    // Re-measure AFTER scaling for accurate world-space centre
    scene.add(model);
    const box1   = new THREE.Box3().setFromObject(model);
    const centre = box1.getCenter(new THREE.Vector3());
    model.position.sub(centre);  // bbox centre → world origin

    // ── Material tweaks — tinted to match theme ──
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow    = true;
        child.receiveShadow = true;
        const mat = child.material;
        // Boost metalness/roughness for a sleeker look
        if (mat.metalness !== undefined) mat.metalness = Math.max(mat.metalness, 0.4);
        if (mat.roughness !== undefined) mat.roughness = Math.min(mat.roughness, 0.6);
        mat.needsUpdate = true;
      }
    });

    // Play first animation clip if the model has any
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      const clip   = gltf.animations[0];
      const action = mixer.clipAction(clip);
      action.play();
    }

    // Signal CSS to remove shimmer placeholder
    avatar?.classList.add('model-loaded');
  },
  undefined,
  (err) => console.error('[robot.js] Load error:', err)
);

// ── Mouse Tracking ────────────────────────────────────────
let targetRotX  = 0;
let targetRotY  = 0;
let currentRotX = 0;
let currentRotY = 0;
let isOnHero    = false;
let idleT       = 0;

hero.addEventListener('mousemove', (e) => {
  const rect = hero.getBoundingClientRect();
  // Normalise to -0.5 … +0.5
  const nx =  (e.clientX - rect.left)  / rect.width  - 0.5;
  const ny =  (e.clientY - rect.top)   / rect.height - 0.5;

  targetRotY =  nx * Math.PI * 0.7;   // ±63° horizontal
  targetRotX = -ny * Math.PI * 0.35;  // ±31° vertical

  isOnHero = true;
}, { passive: true });

hero.addEventListener('mouseleave', () => {
  // Return to natural forward pose when cursor leaves
  targetRotX = 0;
  targetRotY = 0;
  isOnHero   = false;
});

// ── Render Loop ───────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  idleT += delta;

  // Advance any baked animations
  if (mixer) mixer.update(delta);

  if (model) {
    // Faster lerp when mouse is active, slower drift back when idle
    const lerpSpeed = isOnHero ? 0.08 : 0.04;

    currentRotX += (targetRotX - currentRotX) * lerpSpeed;
    currentRotY += (targetRotY - currentRotY) * lerpSpeed;

    // Gentle idle sway when cursor is off the hero
    const idleSwayY = isOnHero ? 0 : Math.sin(idleT * 0.45) * 0.18;
    const idleSwayX = isOnHero ? 0 : Math.sin(idleT * 0.28) * 0.06;

    model.rotation.x = currentRotX + idleSwayX;
    model.rotation.y = currentRotY + idleSwayY;
  }

  // Animate lights for a subtle colour pulse
  fillLight.intensity = 2.8 + Math.sin(idleT * 0.7) * 0.4;
  rimLight.intensity  = 1.8 + Math.sin(idleT * 0.5 + 1) * 0.3;

  renderer.render(scene, camera);
}

animate();
