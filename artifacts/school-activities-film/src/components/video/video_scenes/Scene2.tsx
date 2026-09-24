import { Clock3, Layers3, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSceneTimer } from '@/lib/video';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene2() {
  const [hours, setHours] = useState(0);
  useSceneTimer([
    { time: 350, callback: () => setHours(3) },
    { time: 1050, callback: () => setHours(7) },
    { time: 1750, callback: () => setHours(12) },
  ]);

  return (
    <motion.section
      className="film-scene scene-navy"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 52%)' }}
      animate={{ opacity: 1, clipPath: 'circle(110% at 50% 52%)' }}
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="scene-grid" />
      <motion.div
        className="scene-kicker light"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
      >
        IL TUO RIEPILOGO
      </motion.div>
      <motion.h2
        className="scene-title light align-left"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.38, ease: EASE }}
      >
        Ogni ora
        <br />
        <em>conta.</em>
      </motion.h2>
      <motion.div
        className="hours-card"
        initial={{ opacity: 0, scale: 0.72, rotate: 4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.72, ease: EASE }}
      >
        <motion.div
          className="hours-arc"
          animate={{ rotate: [0, 180, 360] }}
          transition={{ duration: 3.6, delay: 0.25, ease: 'easeInOut' }}
        />
        <div className="hours-icon"><Clock3 size={22} /></div>
        <motion.strong
          key={hours}
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {hours}h
        </motion.strong>
        <span>di attività registrate</span>
      </motion.div>
      <motion.div
        className="mini-activity mini-activity-a"
        initial={{ opacity: 0, x: -45, rotate: -11 }}
        animate={{ opacity: 1, x: 0, rotate: -8 }}
        transition={{ duration: 0.6, delay: 1.8, ease: EASE }}
      >
        <Layers3 size={15} />
        <span>Laboratorio</span>
        <b>4h</b>
      </motion.div>
      <motion.div
        className="mini-activity mini-activity-b"
        initial={{ opacity: 0, x: 45, rotate: 10 }}
        animate={{ opacity: 1, x: 0, rotate: 7 }}
        transition={{ duration: 0.6, delay: 2.1, ease: EASE }}
      >
        <MapPin size={15} />
        <span>Volontariato</span>
        <b>3h</b>
      </motion.div>
      <motion.p
        className="scene-support light"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ duration: 0.6, delay: 2.7, ease: EASE }}
      >
        Il tuo riepilogo cresce con te.
      </motion.p>
      <motion.div
        className="transition-line"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.65, delay: 3.55, ease: EASE }}
      />
    </motion.section>
  );
}

export default Scene2;