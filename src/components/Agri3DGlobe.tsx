import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Agri3DGlobeProps {
  className?: string;
  activeFeature?: string;
}

export const Agri3DGlobe: React.FC<Agri3DGlobeProps> = ({ className, activeFeature }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 500;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Group for globe and rings
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Core Emerald Agri-Globe
    const globeGeometry = new THREE.SphereGeometry(70, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x071e12,
      emissive: 0x03130a,
      specular: 0x10b981,
      shininess: 40,
      wireframe: false,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    worldGroup.add(globe);

    // 2. Wireframe / Latitude Longitude Field Grid
    const wireGeometry = new THREE.SphereGeometry(70.8, 32, 24);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireGlobe = new THREE.Mesh(wireGeometry, wireMaterial);
    worldGroup.add(wireGlobe);

    // 3. Atmosphere Outer Glow Shell
    const glowGeo = new THREE.SphereGeometry(74, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    worldGroup.add(glowMesh);

    // 4. Agricultural Field Data Points (Pins on coordinates)
    const pointsData = [
      { lat: 28.6139, lon: 77.2090, label: "Punjab/Haryana Breadbasket", status: "Wheat / High Yield", color: 0x34d399 },
      { lat: 19.0760, lon: 72.8777, label: "Maharashtra Cotton Belt", status: "Cotton / Drip Irrigation", color: 0x10b981 },
      { lat: 12.9716, lon: 77.5946, label: "Karnataka Horticulture", status: "Tomato / Optimal Soil", color: 0xa3e635 },
      { lat: 16.3067, lon: 80.4365, label: "Andhra Guntur Spice Hub", status: "Chilli / Active Harvest", color: 0xf59e0b },
      { lat: 23.0225, lon: 72.5714, label: "Gujarat Groundnut Cluster", status: "Groundnut / Soil Sensor", color: 0x38bdf8 },
      { lat: 25.5941, lon: 85.1376, label: "Bihar Gangetic Plain", status: "Basmati Paddy / High Moisture", color: 0x4ade80 }
    ];

    const pinGeometry = new THREE.SphereGeometry(1.6, 16, 16);
    pointsData.forEach((pt) => {
      const phi = (90 - pt.lat) * (Math.PI / 180);
      const theta = (pt.lon + 180) * (Math.PI / 180);
      const r = 71.5;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      const pinMat = new THREE.MeshBasicMaterial({ color: pt.color });
      const pin = new THREE.Mesh(pinGeometry, pinMat);
      pin.position.set(x, y, z);
      worldGroup.add(pin);

      // Pulse ring around pin
      const ringGeo = new THREE.RingGeometry(2.2, 2.9, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pt.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      ring.lookAt(x * 2, y * 2, z * 2);
      worldGroup.add(ring);
    });

    // 5. Orbiting Satellite Track
    const orbitCurve = new THREE.EllipseCurve(0, 0, 95, 95, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(100);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
    );
    const orbitMat = new THREE.LineDashedMaterial({
      color: 0x10b981,
      dashSize: 3,
      gapSize: 2,
      transparent: true,
      opacity: 0.35,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.computeLineDistances();
    orbitLine.rotation.x = Math.PI / 3.5;
    orbitLine.rotation.y = Math.PI / 6;
    worldGroup.add(orbitLine);

    // Satellite model (small craft)
    const satGeo = new THREE.BoxGeometry(3.5, 1.8, 1.8);
    const satMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const satellite = new THREE.Mesh(satGeo, satMat);
    worldGroup.add(satellite);

    // 6. Agricultural Moisture/Pollen Atmospheric Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 100 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 1.5,
      transparent: true,
      opacity: 0.45,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x34d399, 2.5);
    dirLight1.position.set(150, 100, 150);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 1.2);
    dirLight2.position.set(-150, -80, -100);
    scene.add(dirLight2);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0.4;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.006;
        targetRotationX += deltaY * 0.006;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
      const rect = mount.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - width / 2) * 0.0008;
      mouseY = (e.clientY - rect.top - height / 2) * 0.0008;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let satAngle = 0;
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation + damping
      if (!isDragging) {
        targetRotationY += 0.0025;
      }
      worldGroup.rotation.y += (targetRotationY - worldGroup.rotation.y) * 0.06;
      worldGroup.rotation.x += (targetRotationX - worldGroup.rotation.x) * 0.06;

      // Move satellite along orbit
      satAngle += 0.012;
      const satR = 95;
      const sx = satR * Math.cos(satAngle);
      const sy = (satR * Math.sin(satAngle)) * Math.sin(Math.PI / 3.5);
      const sz = (satR * Math.sin(satAngle)) * Math.cos(Math.PI / 3.5);
      satellite.position.set(sx, sy, sz);
      satellite.rotation.y = satAngle + Math.PI / 2;

      // Gentle particle float
      particles.rotation.y += 0.0008;
      particles.rotation.x += 0.0004;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing select-none ${className || ''}`}>
      <div ref={mountRef} className="w-full h-full flex items-center justify-center" />
      {/* 3D Holographic HUD overlay */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-emerald-500/20 text-xs font-mono text-emerald-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300">SENTINEL-2B ORBITAL LINK</span>
        </div>
        <div className="text-[10px] text-emerald-500/80">LAT 28.61° N | LON 77.20° E | ALT 786 KM</div>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-none flex items-center gap-2 bg-emerald-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 text-xs text-emerald-300 font-mono">
        <span className="text-emerald-400 text-sm">✦</span>
        <span>Drag to rotate 3D Agriculture Globe</span>
      </div>
    </div>
  );
};
