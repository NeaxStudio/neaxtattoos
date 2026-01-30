import { motion, useReducedMotion } from 'framer-motion';

const easeOutExpo = [0.22, 1, 0.36, 1];

export default function PageTransition({ children }) {
  const reduceMotion = useReducedMotion();

  const variants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  );
}
