import { BookOpen, Clock3, Layers3, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene1() {
  return (
    <motion.section
      className="film-scene scene-cream"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.16, filter: 'blur(10px)' }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      <div className="film-noise" />
      <motion.div
        className="scene-kicker"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
      >
        APP MOBILE PER STUDENTI
      </motion.div>
      <motion.div
        className="scene-wordmark"
        initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
        animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
        transition={{ duration: 0.8, delay: 0.32, ease: EASE }}
      >
        FUORICLASSE
      </motion.div>
      <motion.p
        className="scene-lede"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
      >
        Il tuo percorso,
        <br />
        oltre i banchi.
      </motion.p>

      <motion.div
        className="orbit-ring ring-coral"
        initial={{ scale: 0.15, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 0.8, rotate: 0 }}
        transition={{ duration: 1, delay: 0.18, ease: EASE }}
      />
      <motion.div
        className="mock-phone phone-hero"
        initial={{ opacity: 0, scale: 0.68, rotate: -8, y: 70 }}
        animate={{ opacity: 1, scale: 1, rotate: -2, y: 0 }}
        transition={{ duration: 1.05, delay: 0.18, ease: EASE }}
      >
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="phone-topline">
            <span>Ciao, Luca.</span>
            <span className="phone-mark"><BookOpen size={14} strokeWidth={2.4} /></span>
          </div>
          <div className="phone-hero-card">
            <span>IL TUO PERCORSO</span>
            <strong>12h</strong>
            <small>ore totali</small>
          </div>
          <div className="phone-mini-row">
            <span className="phone-mini-icon"><Clock3 size={12} /></span>
            <span>Attività recenti</span>
          </div>
          <div className="phone-list-line" />
          <div className="phone-list-line short" />
        </div>
      </motion.div>

      <motion.div
        className="floating-card floating-card-one"
        initial={{ opacity: 0, x: -50, y: 20, rotate: -12 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: -8 }}
        transition={{ duration: 0.7, delay: 1.35, ease: EASE }}
      >
        <span className="floating-icon"><Layers3 size={17} /></span>
        <span>attività</span>
      </motion.div>
      <motion.div
        className="floating-card floating-card-two"
        initial={{ opacity: 0, x: 46, y: -15, rotate: 11 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 8 }}
        transition={{ duration: 0.7, delay: 1.65, ease: EASE }}
      >
        <span className="floating-icon"><MapPin size={17} /></span>
        <span>esperienze</span>
      </motion.div>
      <motion.div
        className="scene-footer-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.8 }}
      >
        ORE <i /> ATTIVITÀ <i /> CRESCITA
      </motion.div>
    </motion.section>
  );
}

export default Scene1;