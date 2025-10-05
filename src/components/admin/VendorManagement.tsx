import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  website_url: string;
  search_url_template: string;
  logo_url: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    search_url_template: '',
    logo_url: '',
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingVendor) {
        const { error } = await supabase
          .from('vendors')
          .update(formData)
          .eq('id', editingVendor.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Vendor updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Vendor added successfully',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchVendors();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save vendor',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vendor deleted successfully',
      });

      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor',
        variant: 'destructive',
      });
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Vendor ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchVendors();
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vendor status',
        variant: 'destructive',
      });
    }
  }

  function openEditDialog(vendor: Vendor) {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      website_url: vendor.website_url,
      search_url_template: vendor.search_url_template,
      logo_url: vendor.logo_url || '',
      is_active: vendor.is_active,
      priority: vendor.priority,
    });
    setDialogOpen(true);
  }

  function resetForm() {
    setEditingVendor(null);
    setFormData({
      name: '',
      website_url: '',
      search_url_template: '',
      logo_url: '',
      is_active: true,
      priority: 0,
    });
  }

  if (loading) {
    return <div className="animate-pulse"><Card><CardHeader className="h-32 bg-muted/50" /><CardContent className="h-96 bg-muted/30" /></Card></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vendor Management</CardTitle>
            <CardDescription>Manage product search vendors and their configurations</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
                <DialogDescription>
                  Configure the vendor details and search URL template
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Vendor Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="search_url_template">Search URL Template</Label>
                  <Input
                    id="search_url_template"
                    value={formData.search_url_template}
                    onChange={(e) => setFormData({ ...formData, search_url_template: e.target.value })}
                    placeholder="https://example.com/search?q={query}"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{query}'} as placeholder for the search term
                  </p>
                </div>
                <div>
                  <Label htmlFor="priority">Priority (higher = searched first)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingVendor ? 'Update' : 'Add'} Vendor</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>
                  <a
                    href={vendor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {vendor.website_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>{vendor.priority}</TableCell>
                <TableCell>
                  <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                    {vendor.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(vendor.id, vendor.is_active)}
                    >
                      <Switch checked={vendor.is_active} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(vendor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vendor.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
