import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Lanyard from './components/Lanyard';

export default function App() {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [bandImage, setBandImage] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'setFront') setFrontImage(data.image);
      if (data.type === 'setBack') setBackImage(data.image);
      if (data.type === 'setBand') setBandImage(data.image);
      if (data.type === 'clear') {
        setFrontImage(null);
        setBackImage(null);
        setBandImage(null);
      }
    };

    window.addEventListener('message', handler);
    window.parent?.postMessage({ type: 'ready' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 30 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#c9a962" />
        <pointLight position={[0, 0, 5]} intensity={0.8} color="#e5c884" />

        <Suspense fallback={null}>
          <Lanyard
            position={[0, 0, 24]}
            gravity={[0, -40, 0]}
            frontImage={frontImage}
            backImage={backImage}
            imageFit="cover"
            lanyardImage={bandImage}
            lanyardWidth={0.6}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.8}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
