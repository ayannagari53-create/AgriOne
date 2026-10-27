import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Tag, 
  User, 
  MapPin, 
  Sprout, 
  Droplets, 
  Layers, 
  AlertCircle, 
  Trash2, 
  Check, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface FarmManagerViewProps {
  language?: SupportedLanguage;
  currentFarm?: any;
  authUser?: any;
  onOpenOnboarding?: () => void;
}

export const FarmManagerView: React.FC<FarmManagerViewProps> = ({ 
  currentFarm,
  authUser,
  onOpenOnboarding 
}) => {
  const { t } = useTranslation();
  const [activeFarm, setActiveFarm] = useState<any>(currentFarm || null);
  const [loadingFarm, setLoadingFarm] = useState<boolean>(!currentFarm);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [title, setTitle] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [category, setCategory] = useState('Fertigation');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('High');
  const [assignedTo, setAssignedTo] = useState('Self');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Sync with currentFarm prop
  useEffect(() => {
    if (currentFarm) {
      setActiveFarm(currentFarm);
      setFieldName(currentFarm.field_name || 'Main Field');
      setLoadingFarm(false);
    }
  }, [currentFarm]);

  // Fetch authenticated farmer profile
  const fetchFarmProfile = async () => {
    const token = localStorage.getItem('agrione_token') || '';
    try {
      const res = await fetch('/api/farms', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.configured && data.farm) {
        setActiveFarm(data.farm);
        setFieldName(data.farm.field_name || 'Main Field');
      } else if (data.farms && data.farms.length > 0) {
        setActiveFarm(data.farms[0]);
        setFieldName(data.farms[0].field_name || 'Main Field');
      } else {
        setActiveFarm(null);
      }
    } catch (e) {
      console.error('Error fetching farm profile:', e);
      setActiveFarm(null);
    } finally {
      setLoadingFarm(false);
    }
  };

  // Fetch authenticated farmer tasks
  const fetchTasks = async () => {
    const token = localStorage.getItem('agrione_token') || '';
    setLoadingTasks(true);
    try {
      const res = await fetch('/api/tasks', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error('Error fetching tasks:', e);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (!currentFarm) {
      fetchFarmProfile();
    }
    fetchTasks();
  }, [currentFarm]);

  // Schedule New Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmittingTask(true);
    const token = localStorage.getItem('agrione_token') || '';
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: title.trim(),
          field_name: fieldName.trim() || activeFarm?.field_name || 'Main Field',
          category,
          due_date: dueDate.trim() || 'Tomorrow 07:00 AM',
          priority,
          status: 'Pending',
          assigned_to: assignedTo.trim() || 'Self',
          farmer_id: authUser?.id || activeFarm?.farmer_id || '',
          token,
        }),
      });
      const data = await res.json();
      setTasks(data.tasks || []);
      setTitle('');
      setDueDate('');
      setShowAddTaskModal(false);
    } catch (e) {
      console.error('Failed to create task:', e);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Toggle Task Status
  const handleToggleTask = async (task: any) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    const token = localStorage.getItem('agrione_token') || '';
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'toggle',
          id: task.id,
          status: newStatus,
          token,
          farmer_id: authUser?.id || activeFarm?.farmer_id || '',
        })
      });
    } catch (e) {
      console.error('Failed to toggle task:', e);
      fetchTasks();
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    const token = localStorage.getItem('agrione_token') || '';
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'delete',
          id: taskId,
          token,
          farmer_id: authUser?.id || activeFarm?.farmer_id || '',
        })
      });
    } catch (e) {
      console.error('Failed to delete task:', e);
      fetchTasks();
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterCategory === 'all') return true;
    return task.category?.toLowerCase() === filterCategory.toLowerCase();
  });

  // Fertigation & Irrigation tasks
  const fertigationTasks = tasks.filter(t => 
    t.category === 'Fertigation' || t.category === 'Irrigation'
  );

  // Labor allocation tasks
  const laborTasks = tasks.filter(t => 
    t.assigned_to && t.assigned_to.trim().length > 0
  );

  // Farm Name determination per requirement:
  // If farmer has provided farm name: display actual name
  // If not provided: show "My Farm" or "Farm name not set"
  // Never invent one
  const resolvedFarmName = (activeFarm?.name && activeFarm.name.trim()) 
    ? activeFarm.name.trim() 
    : t('dash_active_farm');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('fm_badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('fm_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('fm_subtitle')}
          </p>
        </div>

        {activeFarm && (
          <button
            onClick={() => {
              setFieldName(activeFarm?.field_name || 'Main Field');
              setShowAddTaskModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('fm_btn_new_task')}</span>
          </button>
        )}
      </div>

      {/* 1. IF FARM PROFILE DOES NOT EXIST */}
      {!activeFarm && !loadingFarm && (
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0a2315] to-[#041009] border border-emerald-600/50 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-emerald-400" />
          </div>
          
          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {t('fm_not_setup_title')}
            </h3>
            <p className="text-sm text-emerald-200/80 leading-relaxed">
              {t('fm_not_setup_desc')}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenOnboarding}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Sprout className="w-4 h-4" />
              <span>{t('fm_btn_setup')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. AUTHENTICATED FARMER DATA PRESENT */}
      {activeFarm && (
        <>
          {/* Farm Overview Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#071d11] via-[#092917] to-[#071d11] border border-emerald-600/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {t('fm_auth_profile')}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">● {t('fm_active_db')}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {resolvedFarmName}
                </h3>
                {authUser?.name && (
                  <div className="text-xs text-emerald-300/80 font-mono">
                    {t('lbl_full_name')}: <strong className="text-white font-sans">{authUser.name}</strong>
                  </div>
                )}
              </div>

              {onOpenOnboarding && (
                <button
                  onClick={onOpenOnboarding}
                  className="px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-700/60 hover:border-emerald-400 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer self-start md:self-auto"
                >
                  {t('fm_btn_edit')}
                </button>
              )}
            </div>

            {/* Farm Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#05130b] border border-emerald-900/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase">{t('fm_area')}</span>
                <div className="text-base font-bold text-white font-mono">{t('farm_area_val', { value: activeFarm.acreage })}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05130b] border border-emerald-900/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase">{t('ob_lbl_primary_crop')}</span>
                <div className="text-base font-bold text-emerald-300">{activeFarm.primary_crop}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05130b] border border-emerald-900/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase">{t('fm_soil')}</span>
                <div className="text-base font-bold text-white capitalize">{activeFarm.soil_type?.replace(/_/g, ' ')}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05130b] border border-emerald-900/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase">{t('fm_irrigation')}</span>
                <div className="text-base font-bold text-white capitalize">{activeFarm.irrigation_method?.replace(/_/g, ' ')}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05130b] border border-emerald-900/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase">{t('fm_active_plot')}</span>
                <div className="text-base font-bold text-white truncate">{activeFarm.field_name || 'Main Field'}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05130b] border border-emerald-900/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase">{t('fm_location')}</span>
                <div className="text-xs font-semibold text-white truncate" title={activeFarm.location_name}>
                  {activeFarm.district || activeFarm.location_name}
                </div>
              </div>
            </div>

            {/* Location Details Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-900/40 text-xs font-mono text-emerald-300/80">
              <span className="flex items-center gap-1.5 text-white">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{activeFarm.location_name}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400">
                {Number(activeFarm.latitude).toFixed(4)}° N, {Number(activeFarm.longitude).toFixed(4)}° E
              </span>
              {activeFarm.village && (
                <>
                  <span>•</span>
                  <span>{t('fm_village')}: <strong className="text-white">{activeFarm.village}</strong></span>
                </>
              )}
              <span>•</span>
              <span>{t('fm_district')}: <strong className="text-white">{activeFarm.district}</strong>, <strong className="text-white">{activeFarm.state}</strong></span>
            </div>
          </div>

          {/* Logistics & Agronomic Sub-Modules (Fertigation, Labor, Crop Cycle) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Fertigation & Irrigation Schedules */}
            <div className="p-5 rounded-2xl bg-[#081e11] border border-emerald-800/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white font-mono">{t('fm_fertigation_title')}</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {t('fm_scheduled_count', { count: fertigationTasks.length })}
                </span>
              </div>

              {fertigationTasks.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fertigationTasks.map(tTask => (
                    <div key={tTask.id} className="p-2.5 rounded-lg bg-[#05130b] border border-emerald-900/50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{tTask.title}</div>
                        <div className="text-[10px] font-mono text-emerald-400/80">{tTask.due_date} • {tTask.field_name}</div>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        tTask.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {tTask.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#05130b]/60 border border-emerald-900/40 text-center space-y-2">
                  <Droplets className="w-6 h-6 text-emerald-500/60 mx-auto" />
                  <p className="text-xs text-emerald-300/70">
                    {t('fm_no_fertigation')}
                  </p>
                  <button
                    onClick={() => {
                      setCategory('Fertigation');
                      setShowAddTaskModal(true);
                    }}
                    className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    {t('fm_btn_schedule_fertigation')}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Labor Allocation */}
            <div className="p-5 rounded-2xl bg-[#081e11] border border-emerald-800/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white font-mono">{t('fm_labor_title')}</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {t('fm_assigned_count', { count: laborTasks.length })}
                </span>
              </div>

              {laborTasks.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {laborTasks.map(tTask => (
                    <div key={tTask.id} className="p-2.5 rounded-lg bg-[#05130b] border border-emerald-900/50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{tTask.title}</div>
                        <div className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-400" />
                          <span>{tTask.assigned_to}</span>
                          <span>•</span>
                          <span>{tTask.field_name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">{tTask.due_date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#05130b]/60 border border-emerald-900/40 text-center space-y-2">
                  <Users className="w-6 h-6 text-emerald-500/60 mx-auto" />
                  <p className="text-xs text-emerald-300/70">
                    {t('fm_no_labor')}
                  </p>
                  <button
                    onClick={() => {
                      setCategory('Labor Allocation');
                      setShowAddTaskModal(true);
                    }}
                    className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    {t('fm_btn_assign_labor')}
                  </button>
                </div>
              )}
            </div>

            {/* 3. Crop Cycle & Agronomic Stages */}
            <div className="p-5 rounded-2xl bg-[#081e11] border border-emerald-800/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white font-mono">{t('fm_crop_cycle_title')}</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {activeFarm.primary_crop}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300/80">{t('fm_active_crop')}:</span>
                  <span className="font-bold text-white">{activeFarm.primary_crop}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300/80">{t('fm_field_sector')}:</span>
                  <span className="font-bold text-white">{activeFarm.field_name || 'Main Field'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300/80">{t('fm_irrigation_setup')}:</span>
                  <span className="font-bold text-white capitalize">{activeFarm.irrigation_method?.replace(/_/g, ' ')}</span>
                </div>
                <div className="pt-2 border-t border-emerald-900/50">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-1">
                    <span>{t('fm_cycle_progress')}</span>
                    <span>{t('fm_active_growth')}</span>
                  </div>
                  <div className="w-full bg-[#05130b] rounded-full h-2 border border-emerald-900/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full w-2/3 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. REAL TASKS SECTION */}
          <div className="p-6 rounded-3xl bg-[#092214] border border-emerald-600/40 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/60 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{t('fm_active_tasks', { count: tasks.length })}</span>
                </h3>
                <p className="text-xs text-emerald-300/70 mt-0.5">
                  {t('fm_tasks_desc')}
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: t('all') },
                  { id: 'fertigation', label: 'Fertigation' },
                  { id: 'irrigation', label: 'Irrigation' },
                  { id: 'pest management', label: 'Pest' },
                  { id: 'weeding', label: 'Weeding' },
                  { id: 'harvesting', label: 'Harvest' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setFilterCategory(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      filterCategory === c.id
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'bg-[#05130b] text-emerald-300/80 hover:text-white border border-emerald-900/60'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task List or Zero-Task Empty State */}
            {filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50 hover:border-emerald-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          task.priority === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`text-sm font-semibold ${
                          task.status === 'Completed' ? 'line-through text-emerald-400/60' : 'text-white'
                        }`}>
                          {task.title}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-400/80 font-mono">
                        <span>Field: <strong className="text-white">{task.field_name}</strong></span>
                        <span>•</span>
                        <span>Category: <strong className="text-white">{task.category}</strong></span>
                        {task.assigned_to && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-emerald-500" />
                              <strong className="text-white">{task.assigned_to}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-900/40">
                      <div className="text-left md:text-right">
                        <div className="text-xs font-mono text-emerald-300">{task.due_date}</div>
                        <div className={`text-[10px] font-mono ${
                          task.status === 'Completed' ? 'text-emerald-400 font-bold' : 'text-amber-400'
                        }`}>
                          ● {task.status}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTask(task)}
                          title={task.status === 'Completed' ? 'Mark as Pending' : 'Mark as Completed'}
                          className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                              : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:border-emerald-500'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                          className="p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/60 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#06140b] border border-emerald-900/40 text-center space-y-3">
                <Clock className="w-8 h-8 text-emerald-500/50 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{t('fm_no_tasks')}</h4>
                  <p className="text-xs text-emerald-300/70 max-w-md mx-auto">
                    {filterCategory === 'all'
                      ? t('fm_tasks_desc')
                      : `${t('fm_no_tasks')} (${filterCategory})`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFieldName(activeFarm?.field_name || 'Main Field');
                    setShowAddTaskModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('fm_schedule_first_task')}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Schedule New Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#092214] border border-emerald-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{t('fm_modal_title')}</h3>
                <p className="text-xs text-emerald-300/70">
                  {t('fm_modal_subtitle')}
                </p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-emerald-400 hover:text-white cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-emerald-300 block mb-1">
                  {t('fm_lbl_task_title')} <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t('fm_ph_task_title')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fm_lbl_plot')}</label>
                  <input
                    type="text"
                    placeholder={t('fm_ph_plot')}
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fm_lbl_task_category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="Fertigation">Fertigation</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Pest Management">Pest Management</option>
                    <option value="Weeding">Weeding</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Labor Allocation">Labor Allocation</option>
                    <option value="Crop Cycle">Crop Cycle</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fm_lbl_due_date')}</label>
                  <input
                    type="text"
                    placeholder="2026-10-15 06:30"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fm_lbl_priority')}</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="High">{t('high')}</option>
                    <option value="Medium">{t('medium')}</option>
                    <option value="Low">{t('low')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fm_lbl_worker')}</label>
                <input
                  type="text"
                  placeholder="Lead Agronomist"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  {submittingTask ? t('saving') : t('fm_btn_save_task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
