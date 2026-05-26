/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert
 * @returns CSV string
 */
export const exportToCsv = <T extends Record<string, any>>(data: T[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from the first object's keys
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvRows = [
    headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',')
  ];
  
  // Create CSV data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] === null || row[header] === undefined ? '' : row[header];
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

/**
 * Exports session results to CSV format
 * @param results Array of student results
 * @param sessionInfo Session information (title, code, etc.)
 * @returns CSV string
 */
export const exportSessionResultsToCsv = (
  results: Array<{
    student_name: string;
    class_name: string;
    score: number;
    total_questions: number;
    completed_at: string;
    percentage: number;
  }>,
  sessionInfo: {
    title: string;
    code: string;
    subject: string;
    grade: string;
    started_at: string;
  }
): string => {
  // Prepare data for export
  const csvData = results.map(result => ({
    'Ученик': result.student_name,
    'Класс': result.class_name,
    'Балл': `${result.score}/${result.total_questions}`,
    'Процент': `${result.percentage}%`,
    'Дата завершения': result.completed_at ? new Date(result.completed_at).toLocaleString('ru-RU') : 'Не завершил',
    'Статус': result.completed_at ? 'Завершил' : 'В процессе'
  }));
  
  // Add session info as header comments
  const sessionHeader = [
    `# ClassQuiz - Результаты теста`,
    `# Название теста: ${sessionInfo.title}`,
    `# Код сессии: ${sessionInfo.code}`,
    `# Предмет: ${sessionInfo.subject}`,
    `# Класс: ${sessionInfo.grade}`,
    `# Дата начала: ${new Date(sessionInfo.started_at).toLocaleString('ru-RU')}`,
    `# Экспортировано: ${new Date().toLocaleString('ru-RU')}`,
    ``, // Empty line
    ``   // Another empty line before data
  ].join('\n');
  
  return sessionHeader + exportToCsv(csvData);
};

/**
 * Triggers a file download with the given content and filename
 * @param content Content to download
 * @param filename Name of the file
 */
export const downloadCsv = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};