import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { verticalSceneAt, type Point3 } from '../../referee3dMotion';

export type CourtView = 'sideline' | 'side' | 'overhead';
type SceneFrame = ReturnType<typeof verticalSceneAt>;
const UP = new THREE.Vector3(0, 1, 0);

export function createVerticalCourt(host: HTMLDivElement, onContextLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', '可旋转的 3D 篮球场：A2 进攻球员与 B5 防守球员');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#E7EEE9');
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 70);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.35, 3.65);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false; // Wheel scrolling continues to scroll the course page.
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.minDistance = 4;
  controls.maxDistance = 16;
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#80937C', 2.3));
  const sun = new THREE.DirectionalLight('#FFF4DC', 3.2);
  sun.position.set(-5, 10, -2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -8;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];
  const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
    materials.push(result); return result;
  };
  const geometry = <T extends THREE.BufferGeometry>(value: T) => { geometries.push(value); return value; };
  const sphere = geometry(new THREE.SphereGeometry(1, 16, 12));
  const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 12));
  const box = geometry(new THREE.BoxGeometry(1, 1, 1));
  const mesh = (parent: THREE.Object3D, shape: THREE.BufferGeometry, material: THREE.Material, pos: Point3, scale: Point3) => {
    const object = new THREE.Mesh(shape, material);
    object.position.set(...pos); object.scale.set(...scale);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const skin = mat('#D8A47D');
  const skinLight = mat('#F0C3A0');
  const hair = mat('#28312D');
  const shoes = mat('#FAF8ED');
  const black = mat('#24322D');
  const trim = mat('#FFEDD0');

  // Half court in metres: 15 m wide, 14 m long; basket at 3.05 m.
  const floor = mesh(scene, box, mat('#DBB87E'), [0, -0.11, 0], [15.2, 0.2, 14.2]);
  floor.castShadow = false;
  const plankMat = mat('#D5AD72');
  for (let i = 0; i < 15; i++) {
    const plank = mesh(scene, box, plankMat, [-7 + i, -0.005, 0], [0.48, 0.005, 14]);
    plank.castShadow = false;
  }
  const paint = mesh(scene, box, mat('#91AC97'), [0, 0.003, 4.1], [4.9, 0.009, 5.8]);
  paint.castShadow = false;
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#FFF8E8' });
  materials.push(lineMaterial);
  const line = (points: Point3[]) => {
    const shape = geometry(new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p))));
    scene.add(new THREE.Line(shape, lineMaterial));
  };
  const arc = (x: number, z: number, radius: number, start: number, end: number) =>
    line(Array.from({ length: 65 }, (_, i) => { const angle = start + (end - start) * i / 64; return [x + Math.cos(angle) * radius, 0.018, z + Math.sin(angle) * radius] as Point3; }));
  line([[-7.5, 0.018, -7], [7.5, 0.018, -7], [7.5, 0.018, 7], [-7.5, 0.018, 7], [-7.5, 0.018, -7]]);
  line([[-2.45, 0.02, 7], [-2.45, 0.02, 1.2], [2.45, 0.02, 1.2], [2.45, 0.02, 7]]);
  arc(0, 1.2, 1.8, Math.PI, Math.PI * 2);
  arc(0, 5.425, 1.3, Math.PI, Math.PI * 2);
  const cornerAngle = Math.acos(6.6 / 6.75);
  arc(0, 5.425, 6.75, Math.PI + cornerAngle, Math.PI * 2 - cornerAngle);
  const cornerZ = 5.425 - Math.sqrt(6.75 ** 2 - 6.6 ** 2);
  for (const x of [-6.6, 6.6]) line([[x, 0.02, cornerZ], [x, 0.02, 7]]);
  arc(0, -7, 1.8, 0, Math.PI);

  const postMat = mat('#617769');
  mesh(scene, cylinder, postMat, [0, 1.65, 6.65], [0.075, 3.3, 0.075]);
  mesh(scene, box, postMat, [0, 3.3, 6.25], [0.09, 0.09, 0.9]);
  mesh(scene, box, mat('#E5F1ED', { transparent: true, opacity: 0.48 }), [0, 3.425, 5.8], [1.8, 1.05, 0.06]);
  const boardOutline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry(new THREE.BoxGeometry(1.8, 1.05, 0.06))), lineMaterial);
  geometries.push(boardOutline.geometry); boardOutline.position.set(0, 3.425, 5.8); scene.add(boardOutline);
  const square = new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.295, 3.05, 5.755), new THREE.Vector3(-0.295, 3.5, 5.755),
    new THREE.Vector3(0.295, 3.5, 5.755), new THREE.Vector3(0.295, 3.05, 5.755),
  ])), lineMaterial);
  scene.add(square);
  const rim = mesh(scene, geometry(new THREE.TorusGeometry(0.225, 0.02, 8, 32)), mat('#D67230'), [0, 3.05, 5.425], [1, 1, 1]);
  rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    line([[Math.cos(angle) * 0.225, 3.04, 5.425 + Math.sin(angle) * 0.225], [Math.cos(angle + 0.3) * 0.15, 2.64, 5.425 + Math.sin(angle + 0.3) * 0.15]]);
  }

  function limb(parent: THREE.Group, material: THREE.Material, radius: number) {
    const bone = mesh(parent, cylinder, material, [0, 0, 0], [radius, 1, radius]);
    const joint = mesh(parent, sphere, material, [0, 0, 0], [radius, radius, radius]);
    return (a: Point3, b: Point3) => {
      const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
      const direction = end.clone().sub(start);
      bone.position.copy(start).add(end).multiplyScalar(0.5);
      bone.scale.y = direction.length(); bone.quaternion.setFromUnitVectors(UP, direction.normalize());
      joint.position.copy(end);
    };
  }

  function player(color: string, number: string, complexion: THREE.Material, facing: number) {
    const root = new THREE.Group(); scene.add(root);
    root.rotation.y = facing;
    const jersey = mat(color);
    mesh(root, geometry(new THREE.CapsuleGeometry(0.235, 0.28, 4, 12)), jersey, [0, 1.19, 0], [1, 1, 0.8]);
    mesh(root, cylinder, trim, [0, 0.89, 0], [0.23, 0.045, 0.17]);
    mesh(root, cylinder, jersey, [0, 0.79, 0], [0.235, 0.18, 0.18]);
    mesh(root, cylinder, complexion, [0, 1.51, 0], [0.075, 0.12, 0.075]);
    mesh(root, sphere, complexion, [0, 1.76, 0], [0.21, 0.245, 0.205]);
    const hairCap = mesh(root, geometry(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.48)), hair, [0, 1.79, 0.02], [0.215, 0.23, 0.205]);
    hairCap.castShadow = false;
    for (const side of [-1, 1]) {
      mesh(root, sphere, black, [side * 0.073, 1.78, -0.186], [0.018, 0.025, 0.014]);
      mesh(root, sphere, complexion, [side * 0.21, 1.74, 0], [0.04, 0.065, 0.04]);
      mesh(root, box, shoes, [side * 0.135, 0.075, -0.065], [0.18, 0.13, 0.32]);
    }
    mesh(root, sphere, complexion, [0, 1.72, -0.202], [0.035, 0.037, 0.04]);
    const label = document.createElement('canvas'); label.width = 128; label.height = 128;
    const ctx = label.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#FFF8EB'; ctx.textAlign = 'center'; ctx.font = 'bold 78px sans-serif'; ctx.fillText(number, 64, 98);
      const texture = new THREE.CanvasTexture(label); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
      const numberMat = mat('#FFFFFF', { map: texture });
      for (const face of [-1, 1]) {
        const patch = mesh(root, geometry(new THREE.PlaneGeometry(0.24, 0.26)), numberMat, [0, 1.2, face * 0.189], [1, 1, 1]);
        if (face < 0) patch.rotation.y = Math.PI;
        patch.castShadow = false;
      }
    }
    const arms = [-1, 1].map(() => ({ upper: limb(root, complexion, 0.075), lower: limb(root, complexion, 0.06), hand: mesh(root, sphere, complexion, [0, 0, 0], [0.068, 0.085, 0.065]) }));
    const legs = [-1, 1].map(() => ({ thigh: limb(root, complexion, 0.09), shin: limb(root, complexion, 0.07) }));
    return {
      root,
      pose(position: Point3, raised: number, lean = 0) {
        root.position.set(...position); root.rotation.x = lean;
        [-1, 1].forEach((side, index) => {
          const elbow: Point3 = [side * (0.31 + raised * 0.04), 1.13 + raised * 0.75, facing === Math.PI ? -0.15 : -0.015];
          const wrist: Point3 = [side * (0.29 - raised * 0.08), 0.9 + raised * 1.38, facing === Math.PI ? -0.36 : -0.03];
          arms[index].upper([side * 0.25, 1.42, 0], elbow);
          arms[index].lower(elbow, wrist); arms[index].hand.position.set(...wrist);
          legs[index].thigh([side * 0.13, 0.79, 0], [side * 0.135, 0.44, -0.015]);
          legs[index].shin([side * 0.135, 0.44, -0.015], [side * 0.135, 0.14, 0]);
        });
      },
    };
  }
  const attacker = player('#2E6950', '2', skinLight, Math.PI);
  const defender = player('#B4594F', '5', skin, 0);
  const basketball = mesh(scene, sphere, mat('#D98434'), [0, 1, 0], [0.12, 0.12, 0.12]);
  const seamMat = mat('#573D28');
  const seamGeometry = geometry(new THREE.TorusGeometry(1.005, 0.025, 4, 32));
  for (const rotation of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]]) {
    const seam = new THREE.Mesh(seamGeometry, seamMat); seam.rotation.set(...rotation as Point3); basketball.add(seam);
  }
  const guide = new THREE.Group(); guide.position.set(0.15, 0, 3.72); scene.add(guide);
  const cylinderGuide = mesh(guide, geometry(new THREE.CylinderGeometry(0.44, 0.44, 3.3, 32, 1, true)), mat('#BF5F54', { transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }), [0, 1.65, 0], [1, 1, 1]);
  cylinderGuide.castShadow = false; cylinderGuide.receiveShadow = false;
  for (const height of [0.025, 3.3]) {
    const ring = mesh(guide, geometry(new THREE.TorusGeometry(0.44, 0.008, 4, 48)), mat('#A95149', { transparent: true, opacity: 0.55 }), [0, height, 0], [1, 1, 1]);
    ring.rotation.x = Math.PI / 2; ring.castShadow = false;
  }
  let dirty = true, lastTime = -1, disposed = false;
  function render() { if (!disposed) renderer.render(scene, camera); }
  function setView(view: CourtView) {
    const positions: Record<CourtView, Point3> = { sideline: [5.8, 4.2, -2.6], side: [8.8, 3.6, 3.6], overhead: [0.1, 10.5, 2.8] };
    camera.position.set(...positions[view]); controls.target.set(0, 1.35, 3.65); controls.update(); dirty = true;
  }
  function resize() {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); dirty = true; render();
  }
  function contextLost(event: Event) { event.preventDefault(); onContextLost(); }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  const observer = new ResizeObserver(resize); observer.observe(host);
  setView('sideline'); resize();
  return {
    setView,
    setCylinder(visible: boolean) { guide.visible = visible; dirty = true; },
    draw(frame: SceneFrame) {
      const moved = controls.update();
      if (frame.time !== lastTime) {
        attacker.pose(frame.attacker, 0.45 + frame.shooting * 0.55, frame.lean);
        defender.pose(frame.defender, frame.arms);
        basketball.position.set(...frame.ball); basketball.rotation.set(frame.time, 0, frame.time * 1.5);
        lastTime = frame.time; dirty = true;
      }
      if (dirty || moved) { render(); dirty = false; }
    },
    dispose() {
      disposed = true; observer.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      geometries.forEach((item) => item.dispose()); materials.forEach((item) => item.dispose()); textures.forEach((item) => item.dispose());
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
