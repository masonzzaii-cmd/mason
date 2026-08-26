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
    <div style={{ width: '100%', height: '100vh', background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />
        <directionalLight position={[-5, 3, -5]} intensity={0.8} color="#c9a962" />
        <pointLight position={[0, -1, 3]} intensity={1.2} color="#e5c884" />
        <pointLight position={[0, 2, 3]} intensity={0.6} color="#ffffff" />

        <Suspense fallback={null}>
          <Lanyard
            position={[0, 0, 0]}
            frontImage={front}
            backImage={back}
            lanyardImage={band}
            lanyardWidth={1}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
