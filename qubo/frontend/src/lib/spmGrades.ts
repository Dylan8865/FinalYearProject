export const VALID_SPM_TARGET_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'E'] as const;

export const normalizeSpmTargetGrade = (value?: string | null) => {
  const normalized = value?.trim().toUpperCase() || '';
  return VALID_SPM_TARGET_GRADES.some((grade) => grade === normalized) ? normalized : '';
};
