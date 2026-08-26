import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'

extend({ MeshLineGeometry, MeshLineMaterial })

const CARD_W = 3.2
const CARD_H = 4.8
const CARD_D = 0.06
const SEG_COUNT = 40
const BAND_POINTS = 200

export default function Lanyard({
  position = [0, 0, 0],
  frontImage,
  backImage,
  lanyardImage,
  lanyardWidth = 1,
}) {
  const pivotRef = useRef()
  const cardRef = useRef()
  const bandRef = useRef()
  const groupRef = useRef()

  const angleXRef = useRef(0.12)
  const angleZRef = useRef(0.15)
  const angVelXRef = useRef(0)
  const angVelZRef = useRef(0)
  const bobRef = useRef(0)
  const bobVelRef = useRef(0)
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })

  const tempVec1 = useRef(new THREE.Vector3()).current
  const tempVec2 = useRef(new THREE.Vector3()).current
  const tempVec3 = useRef(new THREE.Vector3()).current

  const bandPointsRef = useRef(
    Array.from({ length: SEG_COUNT + 2 }, () => new THREE.Vector3())
  )
  const curveDataRef = useRef(new Float32Array(BAND_POINTS * 3))

  const frontTex = useMemo(() => {
    if (!frontImage) return null
    const t = new THREE.TextureLoader().load(frontImage)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [frontImage])

  const backTex = useMemo(() => {
    if (!backImage) return null
    const t = new THREE.TextureLoader().load(backImage)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [backImage])

  const bandTex = useMemo(() => {
    if (!lanyardImage) return null
    const t = new THREE.TextureLoader().load(lanyardImage)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1, 3)
    return t
  }, [lanyardImage])

  const cardMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f5e6c8',
    metalness: 0.05,
    roughness: 0.35,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    sheen: 0.3,
    sheenColor: new THREE.Color('#c9a962'),
  }), [])

  const bandMatProps = useMemo(() => {
    if (bandTex) {
      return { map: bandTex, transparent: true, side: THREE.DoubleSide }
    }
    return {
      color: '#c9a962',
      metalness: 0.6,
      roughness: 0.3,
      side: THREE.DoubleSide,
      transparent: true,
    }
  }, [bandTex])

  const initialBandGeo = useMemo(() => {
    const pts = []
    for (let i = 0; i <= SEG_COUNT; i++) {
      const t = i / SEG_COUNT
      pts.push(new THREE.Vector3(0, 2.0 - t * 4.0, 0))
    }
    pts.push(new THREE.Vector3(0, -2.0, 0))
    const curve = new THREE.CatmullRomCurve3(pts)
    const curvePts = curve.getPoints(BAND_POINTS)
    const data = curveDataRef.current
    for (let i = 0; i < curvePts.length; i++) {
      data[i * 3] = curvePts[i].x
      data[i * 3 + 1] = curvePts[i].y
      data[i * 3 + 2] = curvePts[i].z
    }
    return new MeshLineGeometry(data)
  }, [])

  const onPointerDown = (e) => {
    e.stopPropagation()
    draggingRef.current = true
    lastPointerRef.current = { x: e.point.x, y: e.point.y }
  }

  const onPointerUp = () => {
    draggingRef.current = false
  }

  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    const dx = e.point.x - lastPointerRef.current.x
    const dy = e.point.y - lastPointerRef.current.y
    angVelZRef.current += dx * 0.8
    angVelXRef.current -= dy * 0.8
    lastPointerRef.current = { x: e.point.x, y: e.point.y }
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const dt = Math.min(delta, 0.05)
    const time = state.clock.elapsedTime

    if (!draggingRef.current) {
      const gravityAccel = -9.81 * 0.4
      const len = 3.8

      angVelZRef.current += -gravityAccel / len * Math.sin(angleZRef.current) * dt
      angVelXRef.current += -gravityAccel / len * Math.sin(angleXRef.current) * dt

      angVelZRef.current *= 0.992
      angVelXRef.current *= 0.992

      angleZRef.current += angVelZRef.current * dt
      angleXRef.current += angVelXRef.current * dt

      angVelZRef.current += Math.sin(time * 0.5) * 0.004
      angVelXRef.current += Math.cos(time * 0.35) * 0.003
    }

    bobVelRef.current += (Math.sin(time * 0.8) * 0.15 - bobRef.current * 2.5) * dt
    bobRef.current += bobVelRef.current * dt
    bobRef.current = Math.max(-0.1, Math.min(0.1, bobRef.current))

    const pivotPos = pivotRef.current ? pivotRef.current.position : tempVec1.set(0, 2.0, 0)

    tempVec2.set(
      Math.sin(angleZRef.current) * 3.8,
      bobRef.current - 3.8,
      Math.sin(angleXRef.current) * 3.8
    )
    const cardCenter = tempVec3.copy(pivotPos).add(tempVec2)

    if (cardRef.current) {
      cardRef.current.position.copy(cardCenter)
      cardRef.current.rotation.set(angleXRef.current * 0.5, angleZRef.current * 0.4, 0)
    }

    if (bandRef.current) {
      const pts = bandPointsRef.current
      const numSeg = SEG_COUNT

      pts[0].copy(pivotPos)

      for (let i = 1; i < numSeg; i++) {
        const t = i / numSeg
        const dampFactor = t
        const swayX = Math.sin(angleZRef.current * (1 - dampFactor)) * 3.8 * dampFactor
        const swayZ = Math.sin(angleXRef.current * (1 - dampFactor)) * 3.8 * dampFactor
        const swayY = -3.8 * dampFactor + bobRef.current * (1 - dampFactor) * 0.5

        pts[i].set(
          pivotPos.x + swayX,
          pivotPos.y + swayY,
          pivotPos.z + swayZ
        )
      }

      pts[numSeg].copy(cardCenter)

      const curve = new THREE.CatmullRomCurve3(pts)
      const curvePts = curve.getPoints(BAND_POINTS)
      const data = curveDataRef.current
      for (let i = 0; i < curvePts.length; i++) {
        data[i * 3] = curvePts[i].x
        data[i * 3 + 1] = curvePts[i].y
        data[i * 3 + 2] = curvePts[i].z
      }
      bandRef.current.geometry.setPoints(data)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <group ref={pivotRef} position={[0, 2.0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 20]} />
          <meshStandardMaterial color="#c9a962" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.05, 0.4]}>
          <boxGeometry args={[0.15, 0.25, 0.08]} />
          <meshStandardMaterial color="#c9a962" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>

      <mesh ref={bandRef} geometry={initialBandGeo}>
        <meshLineMaterial
          {...bandMatProps}
          lineWidth={lanyardWidth * 0.15}
          sizeAttenuation={false}
          depthWrite={false}
        />
      </mesh>

      <group
        ref={cardRef}
        position={[0, -3.8, 0]}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerUp}
        onPointerMove={onPointerMove}
      >
        <RoundedBox
          args={[CARD_W, CARD_H, CARD_D]}
          radius={0.18}
          smoothness={4}
          material={cardMat}
        />

        <mesh position={[0, 0, CARD_D / 2 + 0.0005]}>
          <planeGeometry args={[CARD_W - 0.04, CARD_H - 0.04]} />
          <meshBasicMaterial
            map={frontTex}
            color={frontTex ? '#ffffff' : '#f5e6c8'}
          />
        </mesh>

        <mesh
          position={[0, 0, -(CARD_D / 2 + 0.0005)]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[CARD_W - 0.04, CARD_H - 0.04]} />
          <meshBasicMaterial
            map={backTex}
            color={backTex ? '#ffffff' : '#e8d5b0'}
          />
        </mesh>

        {[
          [CARD_W / 2 - 0.015, 0, 0],
          [-CARD_W / 2 + 0.015, 0, 0],
        ].map((pos, i) => (
          <mesh
            key={`edge-${i}`}
            position={pos}
            rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <planeGeometry args={[CARD_H, CARD_D + 0.01]} />
            <meshStandardMaterial
              color="#c9a962"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        ))}

        {[
          [CARD_W / 2 - 0.2, CARD_H / 2 - 0.2],
          [-CARD_W / 2 + 0.2, CARD_H / 2 - 0.2],
          [CARD_W / 2 - 0.2, -CARD_H / 2 + 0.2],
          [-CARD_W / 2 + 0.2, -CARD_H / 2 + 0.2],
        ].map(([x, y], i) => (
          <mesh
            key={`rivet-${i}`}
            position={[x, y, CARD_D / 2 + 0.008]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.05, 0.05, 0.02, 14]} />
            <meshStandardMaterial
              color="#b8953d"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
