import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { StarCanvas } from './components/StarCanvas';
import { Navbar } from './components/Navbar';
import { StaggeredMenu } from './components/StaggeredMenu';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Experience } from './components/Experience';
import { Honors } from './components/Honors';
import { Projects } from './components/Projects';
import { BrandPartners } from './components/BrandPartners';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminQuickDock } from './components/AdminQuickDock';
import { AdminPdfManagerModal } from './components/AdminPdfManagerModal';
import { AdminCodeSyncModal } from './components/AdminCodeSyncModal';
import { ShieldCheck } from 'lucide-react';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toastMessage } = useAdmin();

  return (
    <div className="min-h-screen bg-[#050608] text-[#eee7db] relative overflow-x-hidden selection:bg-[#b4935d] selection:text-[#050608]">
      {/* Particle Stars Canvas */}
      <StarCanvas />

      {/* Noise Texture Background */}
      <div className="noise-overlay" />

      {/* Navbar */}
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />

      {/* Staggered Drawer Menu */}
      <StaggeredMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Admin Login & Permission Modal */}
      <AdminLoginModal />

      {/* Admin PDF Document Manager Modal */}
      <AdminPdfManagerModal />

      {/* Admin Code Sync & Persistence Modal */}
      <AdminCodeSyncModal />

      {/* Admin Quick Action Floating Dock */}
      <AdminQuickDock />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#0c0f16]/95 backdrop-blur-md border border-[#b4935d]/60 text-[#eee7db] shadow-2xl shadow-black/80 animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-[#b4935d] shrink-0" />
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Sections */}
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Honors />
        <Projects />
        <BrandPartners />
        <Contact />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}


