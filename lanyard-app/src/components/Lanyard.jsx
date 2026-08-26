import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const CARD_WIDTH = 2.1;
const CARD_HEIGHT = 3.3;
const CARD_DEPTH = 0.04;

export default function Lanyard({
  position = [0, 0, 0],
  gravity = [0, -40, 0],
  frontImage,
  backImage,
  imageFit = 'cover',
  lanyardImage,
  lanyardWidth = 0.5,
}) {
  const groupRef = useRef();
  const cardRef = useRef();
  const bandRef = useRef();

  const frontTexture = useMemo(() => {
    if (!frontImage) return null;
    const tex = new THREE.TextureLoader().load(frontImage);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [frontImage]);

  const backTexture = useMemo(() => {
    if (!backImage) return null;
    const tex = new THREE.TextureLoader().load(backImage);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [backImage]);

  const bandTexture = useMemo(() => {
    if (!lanyardImage) return null;
    const tex = new THREE.TextureLoader().load(lanyardImage);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
  }, [lanyardImage]);

  const cardMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#1a1a1a',
    metalness: 0.1,
    roughness: 0.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
  }), []);

  const frontMaterial = useMemo(() => {
    if (frontTexture) return new THREE.MeshBasicMaterial({ map: frontTexture });
    return new THREE.MeshBasicMaterial({ color: '#2a2a2a' });
  }, [frontTexture]);

  const backMaterial = useMemo(() => {
    if (backTexture) return new THREE.MeshBasicMaterial({ map: backTexture });
    return new THREE.MeshBasicMaterial({ color: '#1e1e1e' });
  }, [backTexture]);

  const sideMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c9a962',
    metalness: 0.9,
    roughness: 0.1,
  }), []);

  const bandMaterial = useMemo(() => {
    if (bandTexture) {
      return new THREE.MeshBasicMaterial({ map: bandTexture, side: THREE.DoubleSide });
    }
    return new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      metalness: 0.3,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
  }, [bandTexture]);

  useFrame((state) => {
    if (!cardRef.current || !groupRef.current || !bandRef.current) return;

    const time = state.clock.elapsedTime;
    const bobY = Math.sin(time * 1.2) * 0.08;
    const bobZ = Math.cos(time * 0.8) * 0.06;

    const swingX = Math.sin(time * 0.9) * 0.04;
    const swingZ = Math.cos(time * 1.1) * 0.04;
    const swingY = Math.sin(time * 0.7) * 0.015;

    groupRef.current.position.y = position[1] + bobY;
    groupRef.current.position.x = position[0] + bobZ * 0.3;

    cardRef.current.rotation.x = swingX;
    cardRef.current.rotation.z = swingZ;
    cardRef.current.rotation.y = swingY;

    cardRef.current.position.y = -CARD_HEIGHT * 0.45 + bobY * 0.5;

    bandRef.current.rotation.x = swingX * 0.5;
    bandRef.current.rotation.z = swingZ * 0.5;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Clip / badge holder */}
      <group position={[0, 0.15, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
          <meshStandardMaterial color="#c9a962" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.25]}>
          <boxGeometry args={[0.12, 0.2, 0.06]} />
          <meshStandardMaterial color="#c9a962" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Lanyard band */}
      <LanyardBand
        bandRef={bandRef}
        bandMaterial={bandMaterial}
        lanyardWidth={lanyardWidth}
      />

      {/* Card */}
      <group ref={cardRef}>
        {/* Card body with rounded corners */}
        <RoundedBox
          args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]}
          radius={0.12}
          smoothness={4}
          material={cardMaterial}
        />

        {/* Front face */}
        <mesh position={[0, 0, CARD_DEPTH / 2 + 0.0002]} material={frontMaterial}>
          <planeGeometry args={[CARD_WIDTH - 0.02, CARD_HEIGHT - 0.02]} />
        </mesh>

        {/* Back face */}
        <mesh position={[0, 0, -(CARD_DEPTH / 2 + 0.0002)]} rotation={[0, Math.PI, 0]} material={backMaterial}>
          <planeGeometry args={[CARD_WIDTH - 0.02, CARD_HEIGHT - 0.02]} />
        </mesh>

        {/* Gold edges */}
        <mesh position={[CARD_WIDTH / 2 - 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={sideMaterial}>
          <planeGeometry args={[CARD_HEIGHT, CARD_DEPTH + 0.005]} />
        </mesh>
        <mesh position={[-CARD_WIDTH / 2 + 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={sideMaterial}>
          <planeGeometry args={[CARD_HEIGHT, CARD_DEPTH + 0.005]} />
        </mesh>
        <mesh position={[0, CARD_HEIGHT / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} material={sideMaterial}>
          <planeGeometry args={[CARD_WIDTH, CARD_DEPTH + 0.005]} />
        </mesh>
        <mesh position={[0, -CARD_HEIGHT / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sideMaterial}>
          <planeGeometry args={[CARD_WIDTH, CARD_DEPTH + 0.005]} />
        </mesh>

        {/* Corner rivets */}
        {[
          [CARD_WIDTH / 2 - 0.15, CARD_HEIGHT / 2 - 0.15],
          [-CARD_WIDTH / 2 + 0.15, CARD_HEIGHT / 2 - 0.15],
          [CARD_WIDTH / 2 - 0.15, -CARD_HEIGHT / 2 + 0.15],
          [-CARD_WIDTH / 2 + 0.15, -CARD_HEIGHT / 2 + 0.15],
        ].map(([x, y], i) => (
          <mesh key={`rivet-${i}`} position={[x, y, CARD_DEPTH / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.015, 12]} />
            <meshStandardMaterial color="#a88840" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function LanyardBand({ bandRef, bandMaterial, lanyardWidth }) {
  const { geometry, curveLength } = useMemo(() => {
    const points = [];
    const segments = 60;
    const topY = 0.05;
    const bottomY = -CARD_HEIGHT * 0.5;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = topY + (bottomY - topY) * t;
      const x = Math.sin(t * Math.PI * 0.7) * 0.15;
      const z = Math.cos(t * Math.PI * 0.5) * 0.05;
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const length = curve.getLength();
    const geo = new THREE.TubeGeometry(curve, 64, lanyardWidth * 0.15, 8, false);
    return { geometry: geo, curveLength: length };
  }, [lanyardWidth]);

  return <mesh ref={bandRef} geometry={geometry} material={bandMaterial} />;
}
