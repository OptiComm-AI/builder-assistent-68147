import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserStats {
  id: string;
  full_name: string | null;
  username: string | null;
  created_at: string;
  project_count: number;
  conversation_count: number;
  message_count: number;
  last_activity: string | null;
  total_budget: number;
  is_admin?: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data: userStats, error: statsError } = await supabase
        .from('admin_user_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (statsError) throw statsError;

      // Check admin status for each user
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);
      
      const usersWithRoles = userStats?.map(user => ({
        ...user,
        is_admin: adminIds.has(user.id)
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminRole(userId: string, isCurrentlyAdmin: boolean) {
    try {
      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `User ${isCurrentlyAdmin ? 'removed from' : 'promoted to'} admin`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  }

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <Card>
        <CardHeader className="h-32 bg-muted/50" />
        <CardContent className="h-96 bg-muted/30" />
      </Card>
    </div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View and manage all users in the system</CardDescription>
        <div className="flex items-center gap-2 pt-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Conversations</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">@{user.username || 'N/A'}</div>
                  </div>
                </TableCell>
                <TableCell>{user.project_count}</TableCell>
                <TableCell>{user.conversation_count}</TableCell>
                <TableCell>{user.message_count}</TableCell>
                <TableCell className="text-sm">
                  {user.last_activity 
                    ? formatDistanceToNow(new Date(user.last_activity), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell>
                  {user.is_admin ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAdminRole(user.id, user.is_admin || false)}
                  >
                    {user.is_admin ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
