export const percentageToGrade = (percentage: number): number => {
  return Math.max(1, Math.min(10, Math.round(percentage / 10)));
};
