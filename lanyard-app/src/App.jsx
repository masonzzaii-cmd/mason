import LanyardCard from './components/Lanyard.jsx'

export default function App() {
  return (
    <div className="w-full min-h-screen bg-transparent flex items-center justify-center overflow-auto py-8">
      <LanyardCard
        initialPhotoUrl="/mason-portrait.jpg"
        initialQrUrl="/wechat-qr.png"
      />
    </div>
  )
}
