import { motion } from "motion/react";

export const ease = [0.22, 1, 0.36, 1];

export const fadeUp = (delay = 0, { y = 20, margin = "-40px" } = {}) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin },
  transition: { duration: 0.7, delay, ease },
});

/* Same effect as a wrapper component: <Reveal delay={0.2}>...</Reveal> */
export const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    className={className}
    {...fadeUp(delay, { y: 28, margin: "-80px" })}
  >
    {children}
  </motion.div>
);
