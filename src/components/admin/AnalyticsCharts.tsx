import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface UserGrowth {
  date: string;
  count: number;
}

interface ActivityData {
  name: string;
  count: number;
}

export function AnalyticsCharts() {
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      // Fetch user growth over last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at');

      // Group by date
      const growthMap = new Map<string, number>();
      profiles?.forEach(profile => {
        const date = new Date(profile.created_at).toLocaleDateString();
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });

      const growth = Array.from(growthMap.entries()).map(([date, count]) => ({
        date,
        count
      }));

      setUserGrowth(growth);

      // Fetch activity counts
      const [
        { count: projectsCount },
        { count: conversationsCount },
        { count: messagesCount },
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      setActivityData([
        { name: 'Projects', count: projectsCount || 0 },
        { name: 'Conversations', count: conversationsCount || 0 },
        { name: 'Messages', count: messagesCount || 0 },
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="h-24 bg-muted/50" />
          <CardContent className="h-64 bg-muted/30" />
        </Card>
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Growth (Last 30 Days)</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>Total counts across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
