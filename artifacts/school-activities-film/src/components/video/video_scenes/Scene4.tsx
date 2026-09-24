import { Activity, ChevronRight, Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

const STUDENTS = [
  { name: 'Giulia Rossi', hours: '14h', color: 'coral' },
  { name: 'Luca Bianchi', hours: '12h', color: 'blue' },
  { name: 'Sara Conti', hours: '9h', color: 'cream' },
  { name: 'Matteo Esposito', hours: '18h', color: 'coral' },
];

export function Scene4() {
  return (
    <motion.section
      className="film-scene scene-cream scene-professor"
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80, scale: 1.04 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="professor-wash" />
      <motion.div
        className="scene-kicker"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
      >
        AREA PROFESSORE
      </motion.div>
      <motion.h2
        className="scene-title professor-title"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.35, ease: EASE }}
      >
        Una vista
        <br />
        per il gruppo.
      </motion.h2>
      <motion.div
        className="monitor-panel"
        initial={{ opacity: 0, scale: 0.82, y: 70 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.72, ease: EASE }}
      >
        <div className="monitor-header">
          <div>
            <small>MONITORAGGIO</small>
            <strong>Tutti gli alunni</strong>
          </div>
          <span className="monitor-users"><Users size={18} /></span>
        </div>
        <div className="student-stack">
          {STUDENTS.map((student, index) => (
            <motion.div
              key={student.name}
              className={`student-card student-${student.color}`}
              initial={{ opacity: 0, y: 35, rotate: index % 2 ? 3 : -3 }}
              animate={{ opacity: 1, y: 0, rotate: index === 0 ? -1 : 0 }}
              transition={{ duration: 0.58, delay: 1.15 + index * 0.2, ease: EASE }}
            >
              <span className="student-avatar">{student.name.slice(0, 1)}</span>
              <span className="student-name">{student.name}</span>
              <span className="student-hours">{student.hours}</span>
              <ChevronRight size={14} />
            </motion.div>
          ))}
        </div>
        <motion.div
          className="monitor-detail"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 2.35, ease: EASE }}
        >
          <span className="detail-check"><Check size={13} /></span>
          <span><b>Attività registrate</b><small> dettaglio per ogni alunno</small></span>
          <Activity size={17} />
        </motion.div>
      </motion.div>
      <motion.p
        className="scene-support dark professor-support"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.72 }}
        transition={{ duration: 0.55, delay: 3.05 }}
      >
        Tutti i percorsi, in un unico sguardo.
      </motion.p>
      <motion.div
        className="professor-ring"
        initial={{ scale: 0.35, opacity: 0, rotate: -50 }}
        animate={{ scale: 1, opacity: 0.9, rotate: 0 }}
        transition={{ duration: 1.2, delay: 3.55, ease: EASE }}
      />
    </motion.section>
  );
}

export default Scene4;