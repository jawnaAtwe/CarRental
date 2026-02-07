'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useLanguage } from "../context/LanguageContext";
 import { messaging, requestNotificationPermission } from '../../lib/firebase-config';
import { lang } from '../Lang/lang';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination
} from "@heroui/react";

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "user" | "customer";
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

export default function DashboardWeekly() {
  const { language } = useLanguage();
  const { data: session, status } = useSession();
  const user = session?.user as SessionUser | undefined;
  const isSuperAdmin = user?.roleId === 9;

  const [chartData, setChartData] = useState<{ day: string; count: number; average: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // بيانات الحجوزات الأخيرة مؤقتة
  const recentBookings = [
    { id: 1, renter: 'Mohammed', date: '2026-01-15', status: 'Active' },
    { id: 2, renter: 'Sarah', date: '2026-01-14', status: 'Completed' },
    { id: 3, renter: 'Ali', date: '2026-01-13', status: 'Pending' },
  ];

  const [page, setPage] = useState(1);
  const rowsPerPage = 3;
  const paginatedBookings = recentBookings.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(recentBookings.length / rowsPerPage);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const tenantIdToUse = isSuperAdmin ? undefined : user.tenantId;
        const url = tenantIdToUse 
          ? `/api/v1/admin/bookings/weekly?tenant_id=${tenantIdToUse}` 
          : `/api/v1/admin/bookings/weekly`;

        const res = await fetch(url);
        const data = await res.json();

        const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

        const total = data.reduce((sum: number, item: any) => sum + item.count, 0);
        const average = daysOfWeek.length ? total / daysOfWeek.length : 0;

        const fullData = daysOfWeek.map(day => {
          const found = data.find((d: any) => d.day === day);
          return { day, count: found ? found.count : 0, average };
        });

        setChartData(fullData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, user, isSuperAdmin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-content2 via-content2 to-content1 p-6 space-y-8">

      {/* جدول الحجوزات */}
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">{lang(language, 'dashboard.recent_bookings')}</h2>
        <Table
          shadow="none"
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
            <TableColumn>{lang(language, 'dashboard.renter')}</TableColumn>
            <TableColumn>{lang(language, 'dashboard.date')}</TableColumn>
            <TableColumn>{lang(language, 'dashboard.status')}</TableColumn>
          </TableHeader>
          <TableBody>
            {paginatedBookings.map(b => (
              <TableRow key={b.id}>
                <TableCell>{b.renter}</TableCell>
                <TableCell>{b.date}</TableCell>
                <TableCell>{b.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* الشارت الأسبوعي */}
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">{lang(language, 'dashboard.weekly_traders')}</h2>

        {loading ? (
          <p className="text-text/70">{lang(language, 'dashboard.loading')}...</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name={lang(language,'dashboard.bookings')} />
              <Line type="monotone" dataKey="average" stroke="#FF8042" strokeWidth={2} name={lang(language,'dashboard.average')} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
