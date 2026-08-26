import { useEffect, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Lanyard from './components/Lanyard'

export default function App({ frontImage, backImage, lanyardImage }) {
  const [front, setFront] = useState(frontImage)
  const [back, setBack] = useState(backImage)
  const [band, setBand] = useState(lanyardImage)

  useEffect(() => {
    const handler = (event) => {
      const data = event.data
      if (!data || !data.type) return

      switch (data.type) {
        case 'setFront':
          setFront(data.image)
          break
        case 'setBack':
          setBack(data.image)
          break
        case 'setBand':
          setBand(data.image)
          break
        case 'clear':
          setFront(null)
          setBack(null)
          setBand(null)
          break
      }
    }

    window.addEventListener('message', handler)
    window.parent?.postMessage({ type: 'ready' }, '*')
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1a1612' }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{ background: '#1a1612' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={2.0} />
        <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#c9a962" />
        <pointLight position={[0, -2, 4]} intensity={1.5} color="#ffe4a0" />
        <pointLight position={[0, 3, 4]} intensity={1.0} color="#ffffff" />
        <pointLight position={[3, -1, 2]} intensity={0.8} color="#c9a962" />
        <pointLight position={[-3, 1, 2]} intensity={0.8} color="#c9a962" />

        <Suspense fallback={null}>
          <Lanyard
            position={[0, 2, 0]}
            frontImage={front}
            backImage={back}
            lanyardImage={band}
            lanyardWidth={1.2}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
