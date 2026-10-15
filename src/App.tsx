import { useState } from 'react';
import { Layout, type Page } from '@/components/Layout';
import { ToastProvider } from '@/components/ui/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { StudentsList } from '@/pages/StudentsList';
import { StudentProfile } from '@/pages/StudentProfile';
import { CoursesPage } from '@/pages/Courses';
import { SubjectsPage } from '@/pages/Subjects';

type View =
  | { type: 'page'; page: Page }
  | { type: 'student'; studentId: string };

function App() {
  const [view, setView] = useState<View>({ type: 'page', page: 'dashboard' });

  const navigate = (page: Page) => setView({ type: 'page', page });
  const viewStudent = (studentId: string) => setView({ type: 'student', studentId });

  const currentPage: Page = view.type === 'student' ? 'students' : view.page;

  const breadcrumbs =
    view.type === 'student'
      ? [
          { label: 'Students', onClick: () => navigate('students') },
          { label: 'Student Profile' },
        ]
      : undefined;

  return (
    <ToastProvider>
      <Layout currentPage={currentPage} onNavigate={navigate} breadcrumbs={breadcrumbs}>
        {view.type === 'page' && view.page === 'dashboard' && (
          <Dashboard onNavigate={navigate} onViewStudent={viewStudent} />
        )}
        {view.type === 'page' && view.page === 'students' && (
          <StudentsList onViewStudent={viewStudent} />
        )}
        {view.type === 'page' && view.page === 'courses' && <CoursesPage />}
        {view.type === 'page' && view.page === 'subjects' && <SubjectsPage />}
        {view.type === 'student' && (
          <StudentProfile studentId={view.studentId} onBack={() => navigate('students')} />
        )}
      </Layout>
    </ToastProvider>
  );
}

export default App;
