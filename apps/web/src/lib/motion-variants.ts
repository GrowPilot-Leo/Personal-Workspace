/**
 * Motion variants for the workbench UI. Kept as plain data so they can be
 * unit-tested and shared between layout and dashboard components.
 */

export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
};

export const cardHover = {
  whileHover: { y: -2 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export const dialogOpen = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
};

export const sheetOpen = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};
