/**
 * Motion variants for the workbench UI.
 * Short travel, low bounce and quick settling create a quiet native-app feel.
 */
export const pageEnter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -3 },
  transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
};

export const cardHover = {
  whileHover: { y: -2, scale: 1.005 },
  whileTap: { scale: 0.99 },
  transition: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.7 },
};

export const dialogOpen = {
  initial: { opacity: 0, scale: 0.97, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 4 },
  transition: { type: "spring" as const, stiffness: 430, damping: 34, mass: 0.72 },
};

export const sheetOpen = {
  initial: { opacity: 0, x: 34 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 28 },
  transition: { type: "spring" as const, stiffness: 430, damping: 36, mass: 0.78 },
};
