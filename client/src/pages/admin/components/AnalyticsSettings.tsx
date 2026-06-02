import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function AnalyticsSettings() {
  
  const revenueData = [
    { name: 'Apr 04', amount: 0 },
    { name: 'Apr 05', amount: 0 },
    { name: 'Apr 06', amount: 0 },
    { name: 'Apr 07', amount: 0 },
    { name: 'Apr 08', amount: 0 },
    { name: 'Apr 09', amount: 0 },
    { name: 'Apr 10', amount: 0 },
  ];

  const userGrowthData = [
    { name: 'Nov', users: 0 },
    { name: 'Dec', users: 0 },
    { name: 'Jan', users: 0 },
    { name: 'Feb', users: 12 },
    { name: 'Mar', users: 2 },
    { name: 'Apr', users: 0 },
  ];

  const paymentStatusData = [
    { name: 'Completed', value: 75, color: '#22c55e' },
    { name: 'Undefined', value: 25, color: '#eab308' },
  ];

  const genderData = [
    { name: 'Male', value: 60, color: '#3b82f6' },
    { name: 'Female', value: 40, color: '#ec4899' },
  ];
  
  const ageData = [
    { name: 'Under 18', value: 10 },
    { name: '18-24', value: 30 },
    { name: '25-34', value: 45 },
    { name: '35+', value: 15 },
  ];

  const geoData = [
    { name: 'Unknown', value: 80 },
    { name: 'Lagos', value: 45 },
    { name: 'Edo', value: 30 },
    { name: 'FCT', value: 20 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Analytics</h2>
          <p className="text-slate-500 mt-1">Manage your platform analytics and overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Admin Access
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-black mt-1">15</h3>
            </div>
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Vendors</p>
              <h3 className="text-2xl font-black mt-1">1</h3>
            </div>
            <div className="h-10 w-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Events</p>
              <h3 className="text-2xl font-black mt-1">5</h3>
            </div>
            <div className="h-10 w-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Transactions</p>
              <h3 className="text-2xl font-black mt-1">6</h3>
            </div>
            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mt-8">
        <div>
           <h3 className="font-bold text-lg">Analytics & Insights</h3>
           <p className="text-sm text-slate-500">Comprehensive business analytics and data export</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> All Time <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6">
         <Button variant="outline" className="gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Export CSV</Button>
         <Button variant="outline" className="gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg> Export Excel</Button>
         <Button variant="outline" className="gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg> Export PDF</Button>
         <Button variant="outline" className="gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Export for Power BI</Button>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm">
         <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h4 className="font-bold text-lg">Revenue Trends</h4>
                  <p className="text-sm text-slate-500">Daily revenue for the selected period</p>
               </div>
               <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-bold border border-green-100">
                  Total: NGN 5,400
               </div>
            </div>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                     <YAxis tickFormatter={(value) => `₦${value}`} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                     <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`₦${value}`, 'Revenue']}
                     />
                     <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-8">
               <h4 className="font-bold text-lg mb-1">Payment Status</h4>
               <p className="text-sm text-slate-500 mb-6">Distribution of all transactions</p>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={paymentStatusData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={90}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {paymentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <RechartsTooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex justify-center gap-6 mt-4">
                  {paymentStatusData.map((entry, index) => (
                     <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
                        <span className="text-sm font-medium capitalize text-slate-600">{entry.name}</span>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>

         <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-8">
               <h4 className="font-bold text-lg mb-1">User Growth</h4>
               <p className="text-sm text-slate-500 mb-6">New users per month (Last 6 months)</p>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={userGrowthData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm">
         <CardContent className="p-8">
            <h4 className="font-bold text-lg mb-6">Top Users by Spending</h4>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <div>
                  <p className="font-bold text-slate-900 dark:text-white">admin@gmail.com</p>
                  <p className="text-xs text-slate-400 font-mono">iDKMsmz4...</p>
               </div>
               <div className="text-green-600 font-bold">NGN 5,200</div>
            </div>
         </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-8 text-center">
               <h4 className="font-bold text-lg mb-1">Gender Distribution</h4>
               <p className="text-sm text-slate-500 mb-6">Breakdown of users by gender</p>
               <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={genderData}
                           cx="50%"
                           cy="50%"
                           innerRadius={40}
                           outerRadius={70}
                           paddingAngle={2}
                           dataKey="value"
                        >
                           {genderData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <RechartsTooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-8">
               <h4 className="font-bold text-lg mb-1 text-center">Age Groups</h4>
               <p className="text-sm text-slate-500 mb-6 text-center">User distribution by age</p>
               <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={ageData} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={60} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-8">
               <h4 className="font-bold text-lg mb-1 text-center">Geographic Distribution</h4>
               <p className="text-sm text-slate-500 mb-6 text-center">Top 10 states by user count</p>
               <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={geoData} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={60} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
