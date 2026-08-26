import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import {
  RigidBody,
  BallCollider,
  useRopeJoint,
  useSphericalJoint,
} from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'

extend({ MeshLineGeometry, MeshLineMaterial })

const SEG = 10
const CARD_W = 2.1
const CARD_H = 3.3
const CARD_D = 0.04
const CURVE_POINTS = 150

function Band({
  frontImage,
  backImage,
  lanyardImage,
  lanyardWidth = 1,
}) {
  const fixed = useRef()
  const card = useRef()
  const seg0 = useRef()
  const seg1 = useRef()
  const seg2 = useRef()
  const seg3 = useRef()
  const seg4 = useRef()
  const seg5 = useRef()
  const seg6 = useRef()
  const seg7 = useRef()
  const seg8 = useRef()
  const seg9 = useRef()
  const bandMesh = useRef()

  const segRefs = [seg0, seg1, seg2, seg3, seg4, seg5, seg6, seg7, seg8, seg9]
  const curveDataRef = useRef(new Float32Array(CURVE_POINTS * 3))
  const tempPointsRef = useRef(new Array(SEG + 2))

  const segProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  }

  useRopeJoint(fixed, seg0, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(fixed, seg0, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg0, seg1, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg0, seg1, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg1, seg2, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg1, seg2, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg2, seg3, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg2, seg3, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg3, seg4, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg3, seg4, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg4, seg5, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg4, seg5, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg5, seg6, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg5, seg6, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg6, seg7, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg6, seg7, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg7, seg8, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg7, seg8, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg8, seg9, [[0, 0, 0], [0, 0, 0], 2.5])
  useSphericalJoint(seg8, seg9, [[0, 0, 0], [0, 0, 0]])

  useRopeJoint(seg9, card, [[0, 0, 0], [0, 0, 0], 2.0])
  useSphericalJoint(seg9, card, [[0, 0, 0], [0, 0, 0]])

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
    color: '#1a1a1a',
    metalness: 0.1,
    roughness: 0.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
  }), [])

  const bandMatProps = useMemo(() => {
    if (bandTex) {
      return { map: bandTex, transparent: true, side: THREE.DoubleSide }
    }
    return {
      color: '#3a3a3a',
      metalness: 0.3,
      roughness: 0.6,
      side: THREE.DoubleSide,
      transparent: true,
    }
  }, [bandTex])

  const segmentPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < SEG; i++) {
      const t = i / (SEG - 1)
      positions.push([0, 1.2 - t * 2.4, Math.sin(t * Math.PI) * 0.15])
    }
    return positions
  }, [])

  const initialCurve = useMemo(() => {
    const pts = []
    pts.push(new THREE.Vector3(0, 1.35, 0))
    for (let i = 0; i < SEG; i++) {
      pts.push(new THREE.Vector3(...segmentPositions[i]))
    }
    pts.push(new THREE.Vector3(0, -1.35, 0))
    const curve = new THREE.CatmullRomCurve3(pts)
    const curvePts = curve.getPoints(CURVE_POINTS)
    const data = curveDataRef.current
    for (let i = 0; i < curvePts.length; i++) {
      data[i * 3] = curvePts[i].x
      data[i * 3 + 1] = curvePts[i].y
      data[i * 3 + 2] = curvePts[i].z
    }
    return new MeshLineGeometry(data)
  }, [segmentPositions])

  useFrame((state) => {
    if (!fixed.current || !card.current) return

    const time = state.clock.elapsedTime

    card.current.applyImpulse({
      x: Math.sin(time * 0.7) * 0.02,
      y: Math.cos(time * 0.5) * 0.01,
      z: Math.sin(time * 0.4) * 0.015,
    })

    const lv = card.current.linvel()
    const av = card.current.angvel()
    card.current.setLinvel({ x: lv.x * 0.985, y: lv.y * 0.985, z: lv.z * 0.985 })
    card.current.setAngvel({ x: av.x * 0.985, y: av.y * 0.985, z: av.z * 0.985 })

    const pts = tempPointsRef.current
    pts[0] = fixed.current.translation()
    for (let i = 0; i < SEG; i++) {
      pts[i + 1] = segRefs[i].current ? segRefs[i].current.translation() : new THREE.Vector3()
    }
    pts[SEG + 1] = card.current.translation()

    if (bandMesh.current) {
      const curve = new THREE.CatmullRomCurve3(pts)
      const curvePts = curve.getPoints(CURVE_POINTS)
      const data = curveDataRef.current
      for (let i = 0; i < curvePts.length; i++) {
        data[i * 3] = curvePts[i].x
        data[i * 3 + 1] = curvePts[i].y
        data[i * 3 + 2] = curvePts[i].z
      }
      bandMesh.current.geometry.setPoints(data)
    }
  })

  return (
    <>
      <RigidBody ref={fixed} type="fixed" position={[0, 1.35, 0]}>
        <BallCollider args={[0.08]} />
      </RigidBody>

      <RigidBody ref={seg0} {...segProps} position={segmentPositions[0]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg1} {...segProps} position={segmentPositions[1]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg2} {...segProps} position={segmentPositions[2]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg3} {...segProps} position={segmentPositions[3]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg4} {...segProps} position={segmentPositions[4]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg5} {...segProps} position={segmentPositions[5]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg6} {...segProps} position={segmentPositions[6]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg7} {...segProps} position={segmentPositions[7]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg8} {...segProps} position={segmentPositions[8]}>
        <BallCollider args={[0.08]} />
      </RigidBody>
      <RigidBody ref={seg9} {...segProps} position={segmentPositions[9]}>
        <BallCollider args={[0.08]} />
      </RigidBody>

      <mesh ref={bandMesh} geometry={initialCurve}>
        <meshLineMaterial
          {...bandMatProps}
          lineWidth={lanyardWidth * 0.12}
          sizeAttenuation={false}
          depthWrite={false}
        />
      </mesh>

      <RigidBody
        ref={card}
        type="dynamic"
        position={[0, -1.35, 0]}
        colliders={false}
        linearDamping={0.5}
        angularDamping={0.5}
      >
        <BallCollider args={[CARD_W / 1.8]} />
        <group>
          <RoundedBox
            args={[CARD_W, CARD_H, CARD_D]}
            radius={0.12}
            smoothness={4}
            material={cardMat}
          />

          <mesh position={[0, 0, CARD_D / 2 + 0.0003]}>
            <planeGeometry args={[CARD_W - 0.02, CARD_H - 0.02]} />
            <meshBasicMaterial
              map={frontTex}
              color={frontTex ? '#ffffff' : '#2a2a2a'}
            />
          </mesh>

          <mesh
            position={[0, 0, -(CARD_D / 2 + 0.0003)]}
            rotation={[0, Math.PI, 0]}
          >
            <planeGeometry args={[CARD_W - 0.02, CARD_H - 0.02]} />
            <meshBasicMaterial
              map={backTex}
              color={backTex ? '#ffffff' : '#1e1e1e'}
            />
          </mesh>

          {[
            [CARD_W / 2 - 0.01, 0, 0],
            [-CARD_W / 2 + 0.01, 0, 0],
          ].map((pos, i) => (
            <mesh
              key={`edge-${i}`}
              position={pos}
              rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            >
              <planeGeometry args={[CARD_H, CARD_D + 0.008]} />
              <meshStandardMaterial
                color="#c9a962"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          ))}

          {[
            [CARD_W / 2 - 0.15, CARD_H / 2 - 0.15],
            [-CARD_W / 2 + 0.15, CARD_H / 2 - 0.15],
            [CARD_W / 2 - 0.15, -CARD_H / 2 + 0.15],
            [-CARD_W / 2 + 0.15, -CARD_H / 2 + 0.15],
          ].map(([x, y], i) => (
            <mesh
              key={`rivet-${i}`}
              position={[x, y, CARD_D / 2 + 0.006]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.035, 0.035, 0.015, 12]} />
              <meshStandardMaterial
                color="#a88840"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          ))}
        </group>
      </RigidBody>
    </>
  )
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  frontImage,
  backImage,
  imageFit = 'cover',
  lanyardImage,
  lanyardWidth = 1,
}) {
  return (
    <group position={position}>
      <Band
        frontImage={frontImage}
        backImage={backImage}
        lanyardImage={lanyardImage}
        lanyardWidth={lanyardWidth}
      />
    </group>
  )
}
