/**
 * Purposeful workbench motion: short travel, strong damping and no decorative hover lift.
 */
export const pageEnter = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -2 },
  transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const },
};

export const cardHover = {
  whileHover: { y: 0, scale: 1 },
  whileTap: { scale: 0.995 },
  transition: { duration: 0.14, ease: "easeOut" as const },
};

export const dialogOpen = {
  initial: { opacity: 0, scale: 0.985, y: 3 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.99, y: 2 },
  transition: { type: "spring" as const, stiffness: 480, damping: 40, mass: 0.72 },
};

export const sheetOpen = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { type: "spring" as const, stiffness: 480, damping: 42, mass: 0.76 },
};
