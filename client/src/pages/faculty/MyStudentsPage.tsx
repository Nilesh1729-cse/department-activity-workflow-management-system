import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { UserCheck, Mail, Phone, GraduationCap, Briefcase, Users } from 'lucide-react';

export const MyStudentsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res: any = await api.get('/faculty/my-students');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const assignedStudents = data?.assignedStudents || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-600" />
            My Assigned Student Mentees
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Students officially allocated to your capstone research projects for mentorship and evaluation.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
          {assignedStudents.length} Students Mentored
        </span>
      </div>

      {assignedStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800">No Students Allocated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Once the HOD finalizes the project allocation cycle, students matched to your projects will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedStudents.map((item: any) => (
            <div
              key={item.allocationId}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {item.student.user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.student.user.name}</h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Roll No: {item.student.rollNumber} • {item.student.program.name}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ACTIVE MENTEE
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assigned Project
                </span>
                <p className="font-semibold text-slate-800">
                  {item.projectCode}: {item.projectTitle}
                </p>
                {item.allocationReason && (
                  <p className="text-[11px] text-slate-500 italic mt-1">
                    "{item.allocationReason}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {item.student.user.email}
                </span>
                {item.student.user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {item.student.user.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
