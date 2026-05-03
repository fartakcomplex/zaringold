
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Switch} from '@/components/ui/switch';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Shield, Plus, Pencil, Trash2, Lock, Unlock, Users, Key, Search, CheckCircle, XCircle, Save, UserPlus, UserMinus, Crown, Eye, ChevronLeft, Settings, Info} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useAppStore} from '@/lib/store';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface RoleData {
  id: string;
  name: string;
  label: string;
  description: string | null;
  color: string;
  isSystem: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  _count: { users: number; rolePermissions: number };
}

interface PermissionData {
  id: string;
  name: string;
  label: string;
  module: string;
  description: string | null;
}

interface UserForRole {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UserRoleData {
  id: string;
  roleId: string;
  roleName: string;
  roleLabel: string;
  roleColor: string;
  rolePriority: number;
  isSystem: boolean;
  permissionCount: number;
  assignedAt: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Module Labels                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MODULE_LABELS: Record<string, string> = {
  users: 'کاربران',
  tickets: 'تیکت‌ها',
  transactions: 'تراکنش‌ها',
  payments: 'پرداخت‌ها',
  wallets: 'کیف پول',
  kyc: 'احراز هویت',
  blog: 'بلاگ',
  settings: 'تنظیمات',
  security: 'امنیت',
  reports: 'گزارشات',
  marketing: 'مارکتینگ',
  roles: 'نقش‌ها',
};

const MODULE_COLORS: Record<string, string> = {
  users: 'bg-amber-500/15 text-amber-400',
  tickets: 'bg-blue-500/15 text-blue-400',
  transactions: 'bg-emerald-500/15 text-emerald-400',
  payments: 'bg-violet-500/15 text-violet-400',
  wallets: 'bg-yellow-500/15 text-yellow-400',
  kyc: 'bg-cyan-500/15 text-cyan-400',
  blog: 'bg-pink-500/15 text-pink-400',
  settings: 'bg-gray-500/15 text-gray-400',
  security: 'bg-red-500/15 text-red-400',
  reports: 'bg-indigo-500/15 text-indigo-400',
  marketing: 'bg-orange-500/15 text-orange-400',
  roles: 'bg-gold/15 text-gold',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function timeAgo(date: Date | string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'همین الان';
  if (s < 3600) return `${Math.floor(s / 60)} دقیقه پیش`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعت پیش`;
  if (s < 604800) return `${Math.floor(s / 86400)} روز پیش`;
  return new Intl.DateTimeFormat('fa-IR').format(new Date(date));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminRoles() {
  const { addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(true);

  // ── Roles State ──
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [roleSearch, setRoleSearch] = useState('');

  // ── Permissions State ──
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, PermissionData[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedRolePerms, setSelectedRolePerms] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permChanges, setPermChanges] = useState(false);

  // ── Users by Role State ──
  const [usersForRole, setUsersForRole] = useState<UserForRole[]>([]);
  const [usersForRoleLoading, setUsersForRoleLoading] = useState(false);
  const [userRoleSearch, setUserRoleSearch] = useState('');

  // ── Create/Edit Dialog State ──
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleData | null>(null);
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#6B7280');
  const [formPriority, setFormPriority] = useState('0');
  const [formSaving, setFormSaving] = useState(false);

  // ── Add User to Role Dialog ──
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserForRole[]>([]);
  const [addUserSearch, setAddUserSearch] = useState('');
  const [addUserSelectedIds, setAddUserSelectedIds] = useState<string[]>([]);
  const [addUserSaving, setAddUserSaving] = useState(false);

  /* ── Fetch Roles ── */
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  /* ── Fetch Permissions ── */
  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/permissions');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.data.all || []);
        setPermissionsByModule(data.data.grouped || {});
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Fetch All Users ── */
  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.users || [];
        setAllUsers(list);
      }
    } catch { /* ignore */ }
  }, []);

  /* ── Fetch Role Permissions ── */
  const fetchRolePermissions = useCallback(async (roleId: string) => {
    if (!roleId) return;
    setPermLoading(true);
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`);
      if (res.ok) {
        const data = await res.json();
        const permIds = (data.data?.rolePermissions || []).map(
          (rp: { permissionId: string }) => rp.permissionId
        );
        setSelectedRolePerms(permIds);
        setPermChanges(false);
      }
    } catch { /* ignore */ }
    setPermLoading(false);
  }, []);

  /* ── Fetch Users by Role ── */
  const fetchUsersByRole = useCallback(async (roleId: string) => {
    if (!roleId) return;
    setUsersForRoleLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const allUsersList = Array.isArray(data) ? data : data.users || [];
        // Get user-role assignments for this role
        const roleData = roles.find(r => r.id === roleId);
        if (roleData && roleData._count.users > 0) {
          // Filter users that have this role via UserRole table
          // For now we match by primary role field
          const roleName = roleData.name;
          const filtered = allUsersList.filter(
            (u: UserForRole) => u.role === roleName
          );
          setUsersForRole(filtered);
        } else {
          setUsersForRole([]);
        }
      }
    } catch { /* ignore */ }
    setUsersForRoleLoading(false);
  }, [roles]);

  useEffect(() => {
    const init = async () => {
      await fetchRoles();
      await fetchPermissions();
    };
    init();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (selectedRoleId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId, fetchRolePermissions]);

  useEffect(() => {
    if (selectedRoleId && activeTab === 'users') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsersByRole(selectedRoleId);
      fetchAllUsers();
    }
  }, [selectedRoleId, activeTab, fetchUsersByRole, fetchAllUsers]);

  /* ── Toggle Permission ── */
  const togglePermission = (permId: string) => {
    setSelectedRolePerms((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
    setPermChanges(true);
  };

  /* ── Save Permissions ── */
  const savePermissions = async () => {
    if (!selectedRoleId) return;
    setPermSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: selectedRolePerms }),
      });
      if (res.ok) {
        addToast('دسترسی‌ها با موفقیت ذخیره شد', 'success');
        setPermChanges(false);
        fetchRoles();
      } else {
        const data = await res.json();
        addToast(data.message || 'خطا در ذخیره دسترسی‌ها', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setPermSaving(false);
  };

  /* ── Create Role ── */
  const handleCreateRole = async () => {
    if (!formName.trim() || !formLabel.trim()) {
      addToast('نام و عنوان نقش الزامی است', 'error');
      return;
    }
    setFormSaving(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim().replace(/\s+/g, '_').toLowerCase(),
          label: formLabel.trim(),
          description: formDescription.trim() || null,
          color: formColor,
          priority: parseInt(formPriority) || 0,
        }),
      });
      if (res.ok) {
        addToast('نقش با موفقیت ایجاد شد', 'success');
        setCreateDialogOpen(false);
        resetForm();
        fetchRoles();
      } else {
        const data = await res.json();
        addToast(data.message || 'خطا در ایجاد نقش', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setFormSaving(false);
  };

  /* ── Update Role ── */
  const handleUpdateRole = async () => {
    if (!editRole) return;
    setFormSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${editRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: formLabel.trim(),
          description: formDescription.trim() || null,
          color: formColor,
          priority: parseInt(formPriority) || 0,
        }),
      });
      if (res.ok) {
        addToast('نقش با موفقیت بروزرسانی شد', 'success');
        setEditDialogOpen(false);
        setEditRole(null);
        resetForm();
        fetchRoles();
      } else {
        const data = await res.json();
        addToast(data.message || 'خطا در بروزرسانی نقش', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setFormSaving(false);
  };

  /* ── Delete Role ── */
  const handleDeleteRole = async (roleId: string) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('نقش با موفقیت حذف شد', 'success');
        if (selectedRoleId === roleId) {
          setSelectedRoleId('');
          setSelectedRolePerms([]);
        }
        fetchRoles();
      } else {
        const data = await res.json();
        addToast(data.message || 'خطا در حذف نقش', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
  };

  /* ── Open Edit Dialog ── */
  const openEditDialog = (role: RoleData) => {
    setEditRole(role);
    setFormName(role.name);
    setFormLabel(role.label);
    setFormDescription(role.description || '');
    setFormColor(role.color);
    setFormPriority(String(role.priority));
    setEditDialogOpen(true);
  };

  /* ── Open Create Dialog ── */
  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  /* ── Reset Form ── */
  const resetForm = () => {
    setFormName('');
    setFormLabel('');
    setFormDescription('');
    setFormColor('#6B7280');
    setFormPriority('0');
  };

  /* ── Add Users to Role ── */
  const handleAddUsersToRole = async () => {
    if (!selectedRoleId || addUserSelectedIds.length === 0) return;
    setAddUserSaving(true);
    try {
      for (const userId of addUserSelectedIds) {
        await fetch(`/api/admin/users/${userId}/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleIds: [selectedRoleId] }),
        });
      }
      addToast(`${addUserSelectedIds.length} کاربر به نقش اضافه شدند`, 'success');
      setAddUserDialogOpen(false);
      setAddUserSelectedIds([]);
      fetchUsersByRole(selectedRoleId);
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setAddUserSaving(false);
  };

  /* ── Remove User from Role ── */
  const handleRemoveUserFromRole = async (userId: string) => {
    if (!selectedRoleId) return;
    try {
      await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: [] }),
      });
      addToast('کاربر از نقش حذف شد', 'success');
      fetchUsersByRole(selectedRoleId);
    } catch {
      addToast('خطا در حذف کاربر از نقش', 'error');
    }
  };

  /* ── Filtered Data ── */
  const filteredRoles = useMemo(() => {
    const q = roleSearch.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
    );
  }, [roles, roleSearch]);

  const filteredUsersForRole = useMemo(() => {
    const q = userRoleSearch.toLowerCase();
    return usersForRole.filter(
      (u) =>
        u.phone.toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [usersForRole, userRoleSearch]);

  const filteredAddUsers = useMemo(() => {
    const q = addUserSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.phone.toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q)
    );
  }, [allUsers, addUserSearch]);

  const selectedRoleData = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  );

  const modules = useMemo(
    () => Object.keys(permissionsByModule).sort(),
    [permissionsByModule]
  );

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                    */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="size-6 text-gold" />
            نقش‌ها و دسترسی‌ها
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت نقش‌ها، دسترسی‌ها و سطح دسترسی کاربران
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gold text-black hover:bg-gold/90">
          <Plus className="size-4 ml-1.5" />
          نقش جدید
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gold/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">کل نقش‌ها</p>
                <p className="text-2xl font-bold text-gold">{roles.length}</p>
              </div>
              <div className="rounded-xl p-2.5 bg-gold/15">
                <Shield className="size-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">کل دسترسی‌ها</p>
                <p className="text-2xl font-bold text-amber-400">{permissions.length}</p>
              </div>
              <div className="rounded-xl p-2.5 bg-amber-500/15">
                <Key className="size-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">نقش‌های سیستمی</p>
                <p className="text-2xl font-bold text-blue-400">
                  {roles.filter((r) => r.isSystem).length}
                </p>
              </div>
              <div className="rounded-xl p-2.5 bg-blue-500/15">
                <Lock className="size-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ماژول‌ها</p>
                <p className="text-2xl font-bold text-emerald-400">{modules.length}</p>
              </div>
              <div className="rounded-xl p-2.5 bg-emerald-500/15">
                <Settings className="size-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3">
          <TabsTrigger
            value="roles"
            className={cn(activeTab === 'roles' && 'bg-gold/15 text-gold')}
          >
            <Shield className="size-4 ml-1.5" />
            نقش‌ها
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className={cn(activeTab === 'permissions' && 'bg-gold/15 text-gold')}
          >
            <Key className="size-4 ml-1.5" />
            ماتریس دسترسی
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className={cn(activeTab === 'users' && 'bg-gold/15 text-gold')}
          >
            <Users className="size-4 ml-1.5" />
            کاربران بر اساس نقش
          </TabsTrigger>
        </TabsList>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/*  Tab 1: Roles List                                                    */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="roles">
          <Card className="border-gold/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base">لیست نقش‌ها</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="جستجوی نقش..."
                    className="pr-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredRoles.map((role) => (
                    <Card
                      key={role.id}
                      className={cn(
                        'border border-border/50 hover:border-gold/30 transition-all duration-200 hover:shadow-lg overflow-hidden'
                      )}
                    >
                      {/* Color bar */}
                      <div
                        className="h-1.5 w-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="size-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${role.color}25` }}
                            >
                              {role.isSystem ? (
                                <Lock className="size-5" style={{ color: role.color }} />
                              ) : (
                                <Unlock className="size-5" style={{ color: role.color }} />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold">{role.label}</h4>
                              <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                                {role.name}
                              </p>
                            </div>
                          </div>
                          {role.isSystem && (
                            <Badge className="bg-blue-500/15 text-blue-400 text-[9px]">
                              سیستمی
                            </Badge>
                          )}
                        </div>

                        {role.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {role.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Key className="size-3" />
                            <span>{role._count.rolePermissions} دسترسی</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="size-3" />
                            <span>{role._count.users} کاربر</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Crown className="size-3" />
                            <span>اولویت {role.priority}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-gold/20 text-gold hover:bg-gold/10 text-xs h-8"
                            onClick={() => {
                              setSelectedRoleId(role.id);
                              setActiveTab('permissions');
                            }}
                          >
                            <Eye className="size-3 ml-1" />
                            دسترسی‌ها
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border/50 text-muted-foreground hover:bg-muted text-xs h-8"
                            onClick={() => openEditDialog(role)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          {!role.isSystem && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف نقش</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    آیا از حذف نقش &quot;{role.label}&quot; اطمینان دارید؟
                                    این عملیات غیرقابل بازگشت است.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    حذف شود
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {filteredRoles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="size-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">نقشی یافت نشد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/*  Tab 2: Permissions Matrix                                          */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="permissions">
          <div className="space-y-4">
            {/* Role Selector */}
            <Card className="border-gold/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <Label className="text-sm font-semibold mb-2 block">انتخاب نقش</Label>
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="نقشی را انتخاب کنید..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span>{role.label}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ({role._count.rolePermissions} دسترسی)
                              </span>
                              {role.isSystem && (
                                <Lock className="size-3 text-muted-foreground" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRoleData && (
                    <div className="flex items-center gap-3">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">دسترسی فعال</p>
                        <p className="text-lg font-bold text-gold">{selectedRolePerms.length}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">کل دسترسی‌ها</p>
                        <p className="text-lg font-bold text-amber-400">{permissions.length}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedRoleData?.isSystem && (
                  <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                    <Info className="size-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-300">
                      این یک نقش سیستمی است. تغییر دسترسی‌ها ممکن است بر عملکرد سیستم تأثیر بگذارد.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permissions Matrix */}
            {selectedRoleId && (
              <Card className="border-gold/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">ماتریس دسترسی</CardTitle>
                    {permChanges && (
                      <Button
                        size="sm"
                        onClick={savePermissions}
                        disabled={permSaving}
                        className="bg-gold text-black hover:bg-gold/90 text-xs"
                      >
                        <Save className="size-3.5 ml-1.5" />
                        {permSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    دسترسی‌های فعال برای نقش{' '}
                    <span className="text-gold font-medium">
                      {selectedRoleData?.label}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {permLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-4">
                        {modules.map((moduleName) => {
                          const modulePerms = permissionsByModule[moduleName] || [];
                          const enabledCount = modulePerms.filter((p) =>
                            selectedRolePerms.includes(p.id)
                          ).length;
                          const allEnabled = enabledCount === modulePerms.length;

                          return (
                            <div
                              key={moduleName}
                              className="rounded-lg border border-border/50 overflow-hidden"
                            >
                              {/* Module Header */}
                              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <Badge className={cn('text-[10px]', MODULE_COLORS[moduleName] || 'bg-gray-500/15 text-gray-400')}>
                                    {MODULE_LABELS[moduleName] || moduleName}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {enabledCount}/{modulePerms.length}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {allEnabled && (
                                    <Badge className="bg-emerald-500/15 text-emerald-400 text-[9px]">
                                      <CheckCircle className="size-3 ml-1" />
                                      کامل
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Permissions Grid */}
                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {modulePerms.map((perm) => {
                                  const isEnabled = selectedRolePerms.includes(perm.id);
                                  return (
                                    <div
                                      key={perm.id}
                                      className={cn(
                                        'flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150',
                                        isEnabled
                                          ? 'border-gold/30 bg-gold/5'
                                          : 'border-border/30 hover:border-border/60'
                                      )}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className={cn(
                                          'text-xs font-medium truncate',
                                          isEnabled ? 'text-gold' : 'text-muted-foreground'
                                        )}>
                                          {perm.label}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground font-mono" dir="ltr">
                                          {perm.name}
                                        </p>
                                      </div>
                                      <Switch
                                        checked={isEnabled}
                                        onCheckedChange={() => togglePermission(perm.id)}
                                        className="mr-2 shrink-0"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}

            {!selectedRoleId && (
              <Card className="border-gold/10">
                <CardContent className="py-16 text-center">
                  <Key className="size-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    برای مشاهده و ویرایش دسترسی‌ها، ابتدا یک نقش را انتخاب کنید
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/*  Tab 3: Users by Role                                              */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="users">
          <div className="space-y-4">
            {/* Role Selector */}
            <Card className="border-gold/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <Label className="text-sm font-semibold mb-2 block">انتخاب نقش</Label>
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="نقشی را انتخاب کنید..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span>{role.label}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ({role._count.users} کاربر)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedRoleId && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setAddUserDialogOpen(true);
                        setAddUserSearch('');
                        setAddUserSelectedIds([]);
                      }}
                      className="bg-gold text-black hover:bg-gold/90 text-xs h-9"
                    >
                      <UserPlus className="size-3.5 ml-1.5" />
                      افزودن کاربر
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            {selectedRoleId && (
              <Card className="border-gold/10">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="size-4 text-gold" />
                      کاربران دارای نقش {selectedRoleData?.label}
                      <Badge className="bg-gold/15 text-gold text-[10px]">
                        {filteredUsersForRole.length}
                      </Badge>
                    </CardTitle>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={userRoleSearch}
                        onChange={(e) => setUserRoleSearch(e.target.value)}
                        placeholder="جستجوی کاربر..."
                        className="pr-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersForRoleLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[400px]">
                      {filteredUsersForRole.length > 0 ? (
                        <div className="space-y-2">
                          {filteredUsersForRole.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-gold/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                                  {(user.fullName || user.phone).charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.fullName || 'بدون نام'}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                                    {user.phone}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {user.isActive ? (
                                  <CheckCircle className="size-3.5 text-emerald-400" />
                                ) : (
                                  <XCircle className="size-3.5 text-red-400" />
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {timeAgo(user.createdAt)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                                  onClick={() => handleRemoveUserFromRole(user.id)}
                                >
                                  <UserMinus className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          <Users className="size-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">کاربری با این نقش یافت نشد</p>
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}

            {!selectedRoleId && (
              <Card className="border-gold/10">
                <CardContent className="py-16 text-center">
                  <Users className="size-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    برای مشاهده کاربران، ابتدا یک نقش را انتخاب کنید
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/*  Create Role Dialog                                                   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-gold" />
              ایجاد نقش جدید
            </DialogTitle>
            <DialogDescription>
              یک نقش جدید با دسترسی‌های دلخواه ایجاد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">نام انگلیسی (سیستمی)</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value.replace(/\s/g, '_').toLowerCase())}
                placeholder="مثال: content_manager"
                dir="ltr"
                className="text-left font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">عنوان (فارسی)</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="مثال: مدیر محتوا"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">توضیحات</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="توضیحات نقش..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">رنگ</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    dir="ltr"
                    className="font-mono text-xs flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">اولویت</Label>
                <Input
                  type="number"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  placeholder="0"
                  dir="ltr"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="text-sm"
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={formSaving}
              className="bg-gold text-black hover:bg-gold/90 text-sm"
            >
              {formSaving ? 'در حال ایجاد...' : 'ایجاد نقش'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/*  Edit Role Dialog                                                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-gold" />
              ویرایش نقش
            </DialogTitle>
            <DialogDescription>
              ویرایش اطلاعات نقش: {editRole?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editRole?.isSystem && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                <Info className="size-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-300">
                  این یک نقش سیستمی است. نام آن قابل تغییر نیست.
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">نام انگلیسی (سیستمی)</Label>
              <Input
                value={formName}
                disabled={editRole?.isSystem}
                className={cn(
                  'font-mono text-left',
                  editRole?.isSystem && 'bg-muted opacity-60'
                )}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">عنوان (فارسی)</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">توضیحات</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">رنگ</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    dir="ltr"
                    className="font-mono text-xs flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">اولویت</Label>
                <Input
                  type="number"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  dir="ltr"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditRole(null);
              }}
              className="text-sm"
            >
              انصراف
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={formSaving}
              className="bg-gold text-black hover:bg-gold/90 text-sm"
            >
              {formSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/*  Add User to Role Dialog                                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-gold" />
              افزودن کاربر به نقش {selectedRoleData?.label}
            </DialogTitle>
            <DialogDescription>
              کاربران مورد نظر را برای تخصیص این نقش انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={addUserSearch}
                onChange={(e) => setAddUserSearch(e.target.value)}
                placeholder="جستجوی کاربر با شماره تلفن یا نام..."
                className="pr-9"
              />
            </div>

            {addUserSelectedIds.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gold/10">
                <span className="text-xs text-gold font-medium">
                  {addUserSelectedIds.length} کاربر انتخاب شده
                </span>
              </div>
            )}

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {filteredAddUsers.map((user) => {
                  const isSelected = addUserSelectedIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all',
                        isSelected
                          ? 'border-gold/30 bg-gold/5'
                          : 'border-border/30 hover:border-border/60'
                      )}
                      onClick={() =>
                        setAddUserSelectedIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== user.id)
                            : [...prev, user.id]
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'size-5 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected
                              ? 'border-gold bg-gold'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {isSelected && (
                            <CheckCircle className="size-3 text-black" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {user.fullName || 'بدون نام'}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge className="bg-gold/15 text-gold text-[9px]">انتخاب شده</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddUserDialogOpen(false)}
              className="text-sm"
            >
              انصراف
            </Button>
            <Button
              onClick={handleAddUsersToRole}
              disabled={addUserSaving || addUserSelectedIds.length === 0}
              className="bg-gold text-black hover:bg-gold/90 text-sm"
            >
              {addUserSaving ? 'در حال ذخیره...' : `افزودن ${addUserSelectedIds.length} کاربر`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
