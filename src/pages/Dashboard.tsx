import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { FullPageLoader } from '@/components/ui/Feedback';
import type { Page } from '@/components/Layout';
import type { Student, Course, Subject } from '@/types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onViewStudent: (id: string) => void;
}

export function Dashboard({ onNavigate, onViewStudent }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, courses: 0, subjects: 0, avgAttendance: 0 });
  const [recentStudents, setRecentStudents] = useState<StudentWithCourse[]>([]);

  type StudentWithCourse = Student & { courses?: Course };

  useEffect(() => {
    (async () => {
      const [studentCount, courseCount, subjectCount, studentsRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*, courses(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance').select('total_classes, attended_classes'),
      ]);

      const totalClasses = (attendanceRes.data ?? []).reduce((s, a) => s + (a.total_classes || 0), 0);
      const attended = (attendanceRes.data ?? []).reduce((s, a) => s + (a.attended_classes || 0), 0);
      const avg = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

      setStats({
        students: studentCount.count ?? 0,
        courses: courseCount.count ?? 0,
        subjects: subjectCount.count ?? 0,
        avgAttendance: avg,
      });
      setRecentStudents((studentsRes.data as StudentWithCourse[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <FullPageLoader />;

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50', iconColor: 'text-blue-600', page: 'students' as Page },
    { label: 'Total Courses', value: stats.courses, icon: GraduationCap, color: 'bg-emerald-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-600', page: 'courses' as Page },
    { label: 'Total Subjects', value: stats.subjects, icon: BookOpen, color: 'bg-amber-500', bg: 'bg-amber-50', iconColor: 'text-amber-600', page: 'subjects' as Page },
    { label: 'Avg. Attendance', value: `${stats.avgAttendance}%`, icon: TrendingUp, color: 'bg-purple-500', bg: 'bg-purple-50', iconColor: 'text-purple-600', page: null },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your college administration system</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => stat.page && onNavigate(stat.page)}
              disabled={!stat.page}
              className="text-left"
            >
              <Card className="p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  {stat.page && (
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Recent Students */}
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Recently Added Students</h3>
          <button
            onClick={() => onNavigate('students')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {recentStudents.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">No students enrolled yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => onViewStudent(student.id)}
                className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {student.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{student.full_name}</p>
                  <p className="text-xs text-slate-500">{student.student_id} · {student.courses?.course_name ?? 'No course'}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Sem {student.semester} · Sec {student.section}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
