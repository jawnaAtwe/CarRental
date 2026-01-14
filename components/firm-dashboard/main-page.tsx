'use client';
import React from 'react';
import StatCard from '@/components/utils/StatCard';
import {
  BriefcaseIcon,
  CalendarIcon,
  DocumentIcon,
  CreditCardIcon,
  SparklesIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from "../context/LanguageContext";
import { lang } from '../Lang/lang';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
} from "@heroui/react";
import moment from 'moment';

export default function DashboardPage() {
  const { language } = useLanguage();

  const stats = [
    { title: lang(language, 'dashboard.open_cases'), value: 24, icon: <BriefcaseIcon className="w-6 h-6" /> },
    { title: lang(language, 'dashboard.upcoming_hearings'), value: 8, icon: <CalendarIcon className="w-6 h-6" /> },
    { title: lang(language, 'dashboard.pending_documents'), value: 12, icon: <DocumentIcon className="w-6 h-6" /> },
    { title: lang(language, 'dashboard.pending_payments'), value: '15,000', icon: <CreditCardIcon className="w-6 h-6" /> },
  ];

  const recentCases = [
    {
      id: 1,
      title: language === 'ar' ? 'قضية عقارية - مكة' : 'Real Estate Case - Makkah',
      client: language === 'ar' ? 'محمد' : 'Mohammed',
      status: language === 'ar' ? 'نشط' : 'Active',
      date: moment('2025-12-01').format('LL'),
    },
    {
      id: 2,
      title: language === 'ar' ? 'قضية تجارية - الرياض' : 'Commercial Case - Riyadh',
      client: language === 'ar' ? 'شركة النور' : 'Al-Noor Company',
      status: language === 'ar' ? 'قيد المراجعة' : 'Under Review',
      date: moment('2025-11-28').format('LL'),
    },
    {
      id: 3,
      title: language === 'ar' ? 'قضية عمالية - جدة' : 'Labor Case - Jeddah',
      client: language === 'ar' ? 'سارة خالد' : 'Sarah Khalid',
      status: language === 'ar' ? 'نشط' : 'Active',
      date: moment('2025-11-25').format('LL'),
    },
  ];

  const tasks = [
    { id: 1, text: language === 'ar' ? 'مراجعة عقد البيع' : 'Review sales contract', done: false },
    { id: 2, text: language === 'ar' ? 'إعداد لائحة دفاع' : 'Prepare defense statement', done: true },
    { id: 3, text: language === 'ar' ? 'حضور جلسة محكمة' : 'Attend court hearing', done: false },
    { id: 4, text: language === 'ar' ? 'التواصل مع العميل' : 'Contact client', done: false },
  ];

  const [page, setPage] = React.useState(1);
  const rowsPerPage = 3;
  const paginatedCases = recentCases.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(recentCases.length / rowsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-content2 via-content2 to-content1">
      <main className="p-8 space-y-8">

        {/* HEADER */}
        <div className="rounded-2xl p-6 bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
          <h1 className="text-3xl font-extrabold mb-1">
            {lang(language, 'dashboard.welcome')} محمد
          </h1>
          <p className="text-white/80">{lang(language, 'dashboard.overview')}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              {...stat}
              cardClass="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-md hover:shadow-xl transition"
            />
          ))}
        </div>

        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <SparklesIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-text">
              {lang(language, 'dashboard.ai_insights')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              'dashboard.predict_outcomes',
              'dashboard.suggest_documents',
              'dashboard.analyze_evidence',
            ].map((key, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-gradient-to-br from-content2 to-content1 border border-divider hover:scale-[1.02] transition"
              >
                <h3 className="font-semibold mb-2 text-text">
                  {lang(language, key)}
                </h3>
                <p className="text-sm text-text/70">
                  {lang(language, `${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CASES + TASKS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CASES */}
          <div className="lg:col-span-2 bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-text">
                {lang(language, 'dashboard.recent_cases')}
              </h2>
              <span className="text-primary text-sm cursor-pointer">
                {lang(language, 'dashboard.view_all')}
              </span>
            </div>

            <Table
              shadow="none"
              aria-label="Recent Cases"
              bottomContent={
                <div className="flex justify-between mt-2">
                  <Pagination
                    isCompact
                    showControls
                    page={page}
                    total={totalPages}
                    onChange={setPage}
                    color="secondary"
                  />
                </div>
              }
            >
              <TableHeader>
                <TableColumn>{lang(language, 'dashboard.case')}</TableColumn>
                <TableColumn>{lang(language, 'dashboard.client')}</TableColumn>
                <TableColumn>{lang(language, 'dashboard.status')}</TableColumn>
                <TableColumn>{lang(language, 'dashboard.date')}</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedCases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>{c.client}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell>{c.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* TASKS */}
          <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-md">
            <h2 className="text-xl font-bold mb-4 text-text">
              {lang(language, 'dashboard.tasks')}
            </h2>

            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-content2 hover:bg-content1 transition"
                >
                  <input type="checkbox" checked={task.done} readOnly />
                  <span className={`flex-1 text-sm ${task.done ? 'line-through opacity-60' : ''}`}>
                    {task.text}
                  </span>
                  {task.done && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MONTHLY ACTIVITY */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-text">
              {lang(language, 'dashboard.monthly_activity')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[32, 18, 45, '250K'].map((val, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-content2">
                <div className="text-2xl font-bold text-primary">{val}</div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
