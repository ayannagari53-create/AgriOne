import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Agri3DFieldTerrainProps {
  className?: string;
  moistureLevel?: number; // 0-100%
  activeIrrigation?: boolean;
}

export const Agri3DFieldTerrain: React.FC<Agri3DFieldTerrainProps> = ({
  className,
  moistureLevel = 52,
  activeIrrigation = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 500;
    const height = mount.clientHeight || 350;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 45, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    // 1. Terraced Field Terrain Geometry with Sinusoidal Elevation
    const gridX = 40;
    const gridY = 40;
    const planeGeo = new THREE.PlaneGeometry(60, 50, gridX, gridY);
    planeGeo.rotateX(-Math.PI / 2);

    const pos = planeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle rolling agricultural contours & ridges
      const y = Math.sin(x * 0.15) * 1.5 + Math.cos(z * 0.15) * 1.2 + Math.sin(x * 0.4 + z * 0.3) * 0.5;
      pos.setY(i, y);
    }
    planeGeo.computeVertexNormals();

    // Material with agricultural soil gradient
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0f2d1e,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: false,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(planeGeo, terrainMat);
    terrainGroup.add(terrainMesh);

    // Contour wire grid
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireMesh = new THREE.Mesh(planeGeo, wireMat);
    wireMesh.position.y += 0.05;
    terrainGroup.add(wireMesh);

    // 2. Crop Plant rows (instanced little stems / crops across field)
    const cropCount = 120;
    const cropGeo = new THREE.ConeGeometry(0.6, 2.2, 5);
    const cropMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const crops = new THREE.InstancedMesh(cropGeo, cropMat, cropCount);

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let r = -20; r <= 20; r += 4) {
      for (let c = -18; c <= 18; c += 4) {
        if (idx < cropCount) {
          const x = c + (Math.random() - 0.5) * 0.5;
          const z = r + (Math.random() - 0.5) * 0.5;
          const y = Math.sin(x * 0.15) * 1.5 + Math.cos(z * 0.15) * 1.2 + 1.1;
          dummy.position.set(x, y, z);
          dummy.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.5, 0.8 + Math.random() * 0.4);
          dummy.updateMatrix();
          crops.setMatrixAt(idx, dummy.matrix);
          idx++;
        }
      }
    }
    crops.instanceMatrix.needsUpdate = true;
    terrainGroup.add(crops);

    // 3. IoT Sensor Towers (Soil Tensiometer & Weather Node)
    const sensorGeo = new THREE.CylinderGeometry(0.3, 0.3, 7, 8);
    const sensorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
    const sensorTower = new THREE.Mesh(sensorGeo, sensorMat);
    sensorTower.position.set(-8, 4.5, -5);
    terrainGroup.add(sensorTower);

    // Pulsing sensor LED
    const ledGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(-8, 8, -5);
    terrainGroup.add(ledMesh);

    // 4. Sprinkler Water Droplets (if irrigation is active)
    const dropletCount = 150;
    const dropGeo = new THREE.BufferGeometry();
    const dropPositions = new Float32Array(dropletCount * 3);
    for (let i = 0; i < dropletCount * 3; i += 3) {
      dropPositions[i] = (Math.random() - 0.5) * 30;
      dropPositions[i + 1] = 5 + Math.random() * 12;
      dropPositions[i + 2] = (Math.random() - 0.5) * 30;
    }
    dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3));
    const dropMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.8,
      transparent: true,
      opacity: activeIrrigation ? 0.7 : 0.15,
    });
    const rainPoints = new THREE.Points(dropGeo, dropMat);
    terrainGroup.add(rainPoints);

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    const sun = new THREE.DirectionalLight(0xa3e635, 1.8);
    sun.position.set(30, 50, 40);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x0284c7, 0.8);
    fill.position.set(-30, -20, -20);
    scene.add(fill);

    // Mouse rotation
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotY = -0.4;
    let rotX = 0.3;

    const onDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onUp = () => (isDragging = false);

    mount.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    let frameId: number;
    let tick = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      tick += 0.03;

      if (!isDragging) {
        rotY += 0.0015;
      }

      terrainGroup.rotation.y += (rotY - terrainGroup.rotation.y) * 0.05;
      terrainGroup.rotation.x += (rotX - terrainGroup.rotation.x) * 0.05;

      // Animate LED pulse
      ledMesh.scale.setScalar(1 + Math.sin(tick * 3) * 0.25);

      // Animate water droplets falling
      const positions = dropGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < dropletCount * 3; i += 3) {
        positions[i] -= 0.25;
        if (positions[i] < 0) {
          positions[i] = 12 + Math.random() * 4;
        }
      }
      dropGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeIrrigation, moistureLevel]);

  return (
    <div className={`relative w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing select-none ${className || ''}`}>
      <div ref={mountRef} className="w-full h-full flex items-center justify-center" />
      <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-mono text-emerald-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>SECTOR-B DIGITAL TWIN TERRAIN</span>
      </div>
      <div className="absolute bottom-3 left-3 bg-emerald-950/70 backdrop-blur-md px-3 py-1 rounded-md border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
        Soil Volumetric Moisture: {moistureLevel}% | Drip Grid Active
      </div>
    </div>
  );
};
