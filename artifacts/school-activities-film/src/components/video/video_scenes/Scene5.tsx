import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene5() {
  return (
    <motion.section
      className="film-scene scene-navy scene-outro"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 70%)' }}
      animate={{ opacity: 1, clipPath: 'circle(120% at 50% 70%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.86, ease: EASE }}
    >
      <div className="scene-grid" />
      <motion.div
        className="outro-ring"
        initial={{ scale: 0.18, opacity: 0, rotate: -25 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.12, ease: EASE }}
      />
      <motion.div
        className="outro-lockup"
        initial={{ opacity: 0, scale: 0.8, filter: 'blur(12px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
      >
        <div className="outro-wordmark"><span>FUORI</span><span>CLASSE</span></div>
        <div className="outro-rule" />
        <p>Il tuo percorso, tutto in un posto.</p>
      </motion.div>
      <div className="outro-orbit orbit-left" />
      <div className="outro-orbit orbit-right" />
      <motion.div
        className="outro-stars"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 1.7 }}
      >
        <i /><i /><i />
      </motion.div>
      <motion.p
        className="outro-tagline"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 0.76, y: 0 }}
        transition={{ duration: 0.55, delay: 2.25, ease: EASE }}
      >
        CRESCI OLTRE I BANCHI.
      </motion.p>
      <motion.div
        className="outro-loop-dot"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.15, 0.2], opacity: [0, 1, 1, 0.9] }}
        transition={{ duration: 1.1, delay: 3.5, ease: EASE }}
      />
    </motion.section>
  );
}

export default Scene5;