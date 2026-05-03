import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import { getPendingDoctors, verifyDoctor, getAnalytics, getUsers } from '../api/adminApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d) => new Date(d).toISOString().slice(0, 10);

const today = () => fmtDate(new Date());
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDate(d);
};

const fmtUserDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const SEVERITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
const CHART_COLORS    = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
                         '#14b8a6', '#84cc16', '#f43f5e', '#0ea5e9', '#a855f7'];

// ── Sub-components ────────────────────────────────────────────────────────────

const Card = ({ title, children, className = '' }) => (
  <section className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
    <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
    {children}
  </section>
);

const Spinner = () => (
  <div className="flex justify-center py-10">
    <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Empty = ({ msg = 'No data for this period.' }) => (
  <p className="text-center text-gray-400 text-sm py-8">{msg}</p>
);

// Custom label for the severity pie slices
const SeverityLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={13} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();

  // Doctor verification state
  const [doctors,     setDoctors]     = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [verifying,   setVerifying]   = useState(null);

  // Registered users state
  const [users,        setUsers]        = useState([]);
  const [userRole,     setUserRole]     = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError,   setUsersError]   = useState('');

  // Analytics state
  const [from,      setFrom]      = useState(daysAgo(30));
  const [to,        setTo]        = useState(today());
  const [analytics, setAnalytics] = useState(null);
  const [loadingAn, setLoadingAn] = useState(true);
  const [anError,   setAnError]   = useState('');

  // ── Doctor verification ───────────────────────────────────────────────────

  useEffect(() => {
    getPendingDoctors()
      .then(({ data }) => setDoctors(data.doctors))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const params = userRole === 'all' ? {} : { role: userRole };
      const { data } = await getUsers(params);
      setUsers(data.users);
    } catch (err) {
      setUsersError(err.response?.data?.error?.message || 'Could not load registered users.');
    } finally {
      setLoadingUsers(false);
    }
  }, [userRole]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleVerify = async (id) => {
    setVerifying(id);
    try {
      await verifyDoctor(id);
      setDoctors((prev) => prev.filter((d) => d._id !== id));
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, verified: true } : u)));
    } catch {
      alert('Verification failed — try again.');
    } finally {
      setVerifying(null);
    }
  };

  // ── Analytics fetch ───────────────────────────────────────────────────────

  const fetchAnalytics = useCallback(async () => {
    setLoadingAn(true);
    setAnError('');
    try {
      const { data } = await getAnalytics({ from, to });
      setAnalytics(data);
    } catch (err) {
      setAnError(err.response?.data?.error?.message || 'Could not load analytics.');
    } finally {
      setLoadingAn(false);
    }
  }, [from, to]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Severity data: ensure all three levels always appear in the pie
  const severityData = analytics
    ? ['low', 'medium', 'high'].map((s) => {
        const found = analytics.severity.find((x) => x.severity === s);
        return { name: s, value: found?.count ?? 0 };
      }).filter((x) => x.value > 0)
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Admin Dashboard</h2>
        <p className="text-gray-500 text-sm mb-8">{user?.name} · {user?.department || 'Platform'}</p>

        {/* ── Doctor Verification ──────────────────────────────────────────── */}
        <Card title="🩺 Pending Doctor Verifications" className="mb-6">
          {doctors.length > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {doctors.length}
            </span>
          )}
          {loadingList ? <Spinner /> : doctors.length === 0 ? (
            <Empty msg="No pending verifications." />
          ) : (
            <div className="space-y-3">
              {doctors.map((doc) => (
                <div key={doc._id}
                     className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {doc.specialty} · Licence: {doc.licenseNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerify(doc._id)}
                    disabled={verifying === doc._id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                  >
                    {verifying === doc._id ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Date range filter ────────────────────────────────────────────── */}
        <Card title="Registered Patients and Doctors" className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-500">
              View names, emails, role details, and account status for registered users.
            </p>
            <div className="flex gap-2">
              {['all', 'patient', 'doctor'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRole(role)}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-lg capitalize transition-colors ${
                    userRole === role
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {usersError && <p className="text-sm text-red-600 mb-3">{usersError}</p>}

          {loadingUsers ? <Spinner /> : users.length === 0 ? (
            <Empty msg="No registered users found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Details</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((person) => (
                    <tr key={person._id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-800 whitespace-nowrap">{person.name}</td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{person.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                          person.role === 'doctor'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {person.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {person.role === 'doctor'
                          ? `${person.specialty || 'Specialty not set'} - Licence: ${person.licenseNumber || '-'}`
                          : `${person.county || 'County not set'}${person.phone ? ` - ${person.phone}` : ''}`}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          person.role === 'doctor' && !person.verified
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {person.role === 'doctor' ? (person.verified ? 'Verified' : 'Pending') : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 whitespace-nowrap">{fmtUserDate(person.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
            <input type="date" value={from} max={to}
                   onChange={(e) => setFrom(e.target.value)}
                   className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
            <input type="date" value={to} min={from} max={today()}
                   onChange={(e) => setTo(e.target.value)}
                   className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map((n) => (
              <button key={n} onClick={() => { setFrom(daysAgo(n)); setTo(today()); }}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors">
                Last {n}d
              </button>
            ))}
          </div>
          {anError && <p className="text-xs text-red-600">{anError}</p>}
        </div>

        {loadingAn ? <Spinner /> : !analytics ? null : (
          <div className="space-y-6">

            {/* ── Widget 1: Total consultations ─────────────────────────── */}
            <Card title="📊 Total Triage Assessments">
              <div className="flex items-end gap-3">
                <span className="text-6xl font-bold text-blue-600">{analytics.total}</span>
                <span className="text-gray-500 text-sm mb-2 pb-1">
                  assessments between {from} and {to}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Source: TriageLog collection · anonymised · no patient identity stored
              </p>
            </Card>

            {/* ── Widget 2 + 3 side by side ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Widget 2: Top 10 symptoms */}
              <Card title="🤒 Top 10 Reported Symptoms">
                {analytics.topSymptoms.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={analytics.topSymptoms}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 90, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="symptom" tick={{ fontSize: 11 }} width={88} />
                      <Tooltip
                        formatter={(v) => [v, 'reports']}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {analytics.topSymptoms.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Widget 4: Severity distribution (pie) */}
              <Card title="🎯 Triage Severity Distribution">
                {severityData.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={severityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        labelLine={false}
                        label={<SeverityLabel />}
                      >
                        {severityData.map((entry) => (
                          <Cell key={entry.name}
                                fill={SEVERITY_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(v) => (
                          <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{v}</span>
                        )}
                      />
                      <Tooltip
                        formatter={(v, name) => [v, name]}
                        contentStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* ── Widget 3: Regional distribution ───────────────────────── */}
            <Card title="🗺️ Regional Distribution by County">
              {analytics.regional.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analytics.regional}
                    margin={{ top: 0, right: 16, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="county"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(v) => [v, 'assessments']}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* ── Widget 5: Trends over time ─────────────────────────────── */}
            <Card title="📈 Daily Triage Volume — Last 30 Days">
              {analytics.trends.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={analytics.trends}
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d) => d.slice(5)} // MM-DD
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(d) => `Date: ${d}`}
                      formatter={(v) => [v, 'assessments']}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
