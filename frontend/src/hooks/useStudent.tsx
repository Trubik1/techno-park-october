import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Student {
  id: string;
  display_name: string;
  class_name: string;
  created_at: string;
}

interface StudentContextType {
  student: Student | null;
  registerStudent: (display_name: string, class_name: string) => Promise<Student | null>;
  loadStudent: () => Promise<void>;
  clearStudent: () => void;
  isRegistered: boolean;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType | null>(null);

export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка студента из localStorage при монтировании компонента
  const loadStudent = useCallback(async () => {
    try {
      const studentData = localStorage.getItem('classquiz_student');
      if (studentData) {
        const parsedStudent = JSON.parse(studentData);
        setStudent(parsedStudent);
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('Error loading student from localStorage:', error);
      setStudent(null);
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Регистрация нового студента через API
  const registerStudent = useCallback(async (display_name: string, class_name: string): Promise<Student | null> => {
    try {
      if (!display_name.trim() || !class_name.trim()) {
        throw new Error('Имя и класс обязательны для заполнения');
      }

      const response = await fetch('/api/students/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display_name: display_name.trim(), class_name: class_name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка регистрации');
      }

      const newStudent: Student = await response.json();
      
      // Сохраняем в localStorage
      localStorage.setItem('classquiz_student', JSON.stringify(newStudent));
      
      // Обновляем состояние
      setStudent(newStudent);
      setIsRegistered(true);
      
      return newStudent;
    } catch (error) {
      console.error('Error registering student:', error);
      return null;
    }
  }, []);

  // Очистка данных студента (выход из системы)
  const clearStudent = useCallback(() => {
    localStorage.removeItem('classquiz_student');
    setStudent(null);
    setIsRegistered(false);
  }, []);

  // Загружаем студент при монтировании хука
  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const value: StudentContextType = {
    student,
    registerStudent,
    loadStudent,
    clearStudent,
    isRegistered,
    isLoading,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};