import { CalendarDays, MapPin, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Scene3() {
  return (
    <motion.section
      className="film-scene scene-coral"
      initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
      exit={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
      transition={{ duration: 0.72, ease: EASE }}
    >
      <div className="scene-stamp">NUOVA REGISTRAZIONE</div>
      <motion.div
        className="three-words"
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
      >
        <span>REGISTRA.</span>
        <span>RICORDA.</span>
        <span>CRESCI.</span>
      </motion.div>
      <motion.div
        className="activity-form-card"
        initial={{ opacity: 0, y: 85, rotate: -5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
      >
        <div className="form-card-top">
          <span>AGGIUNGI ATTIVITÀ</span>
          <span className="form-dot" />
        </div>
        <motion.div
          className="form-field featured"
          initial={{ opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 1.25, ease: EASE }}
        >
          <span className="field-icon"><LayersIcon /></span>
          <div><small>Tipologia attività</small><strong>Laboratorio di robotica</strong></div>
        </motion.div>
        <motion.div
          className="form-field"
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 1.58, ease: EASE }}
        >
          <span className="field-icon"><CalendarDays size={18} /></span>
          <div><small>Data</small><strong>23 settembre 2026</strong></div>
        </motion.div>
        <div className="form-pair">
          <motion.div
            className="form-field compact"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.9, ease: EASE }}
          >
            <span className="field-icon"><MapPin size={17} /></span>
            <div><small>Luogo</small><strong>Aula magna</strong></div>
          </motion.div>
          <motion.div
            className="form-field compact"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.05, ease: EASE }}
          >
            <span className="field-icon"><Timer size={17} /></span>
            <div><small>Ore</small><strong>2,5h</strong></div>
          </motion.div>
        </div>
        <motion.div
          className="form-save"
          initial={{ opacity: 0, scaleX: 0.45 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 2.45, ease: EASE }}
        >
          Attività registrata
        </motion.div>
      </motion.div>
      <motion.div
        className="form-trace"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.75, delay: 3.2, ease: EASE }}
      />
      <motion.p
        className="scene-support dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.5, delay: 3.55 }}
      >
        Pochi dati. Un ricordo che resta.
      </motion.p>
    </motion.section>
  );
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

export default Scene3;