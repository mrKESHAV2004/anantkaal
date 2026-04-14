import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Edit2, 
  LogOut, 
  Plus, 
  Trash2, 
  AlertCircle,
  User,
  LayoutDashboard,
  Users,
  Briefcase
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

/* ===========================
   🔑 JWT DECODER UTILITY
=========================== */
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};


const apiFetch = async (url, options = {}, onUnauthorized) => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }
  return response;
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || null);
  const [view, setView] = useState('login'); 

  const currentUser = useMemo(() => (token ? parseJwt(token) : null), [token]);

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
  };

  if (!token) {
    return <AuthScreen view={view} setView={setView} setToken={setToken} />;
  }

  return <Dashboard token={token} currentUser={currentUser} onLogout={handleLogout} />;
}

function AuthScreen({ view, setView, setToken }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', team_name: '' });
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomTeamInput, setShowCustomTeamInput] = useState(false);

  const isLogin = view === 'login';

  // Fetch teams for the signup dropdown
  useEffect(() => {
    if (!isLogin) {
      fetch(`${API_URL}/teams`)
        .then(res => res.json())
        .then(data => {
          setTeams(Array.isArray(data) ? data : []);
        })
        .catch(() => setTeams([]));
    }
  }, [isLogin]);

  const switchView = (newView) => {
    setFormData({ username: '', email: '', password: '', team_name: '' });
    setError('');
    setSuccessMessage('');
    setShowCustomTeamInput(false);
    setView(newView);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTeamChange = (e) => {
    const value = e.target.value;
    if (value === 'CUSTOM') {
      setShowCustomTeamInput(true);
      setFormData({ ...formData, team_name: '' });
    } else {
      setShowCustomTeamInput(false);
      setFormData({ ...formData, team_name: value });
    }
  };

  const validate = () => {
    if (!isLogin && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!isLogin && !formData.team_name) {
      setError('Please select or enter a team name');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validate()) return;
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        localStorage.setItem('jwt_token', data.token);
        setToken(data.token);
      } else {
        setSuccessMessage('Registration successful! Please log in.');
        switchView('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <LayoutDashboard size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
        </div>

        {successMessage && (
          <div className="p-4 mb-6 rounded-lg flex items-center gap-3 bg-green-50 text-green-700">
            <CheckCircle size={20} />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 rounded-lg flex items-center gap-3 bg-red-50 text-red-700">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="johndoe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Team</label>
              <div className="space-y-2">
                <select 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  onChange={handleTeamChange}
                  value={showCustomTeamInput ? 'CUSTOM' : formData.team_name}
                >
                  <option value="">Select an existing team...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Create a new team...</option>
                </select>
                
                {showCustomTeamInput && (
                  <input
                    type="text"
                    name="team_name"
                    required
                    value={formData.team_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors animate-in slide-in-from-top-1 duration-200"
                    placeholder="Enter new team name"
                  />
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => switchView(isLogin ? 'register' : 'login')}
            className="text-indigo-600 font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}


function Dashboard({ token, currentUser, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewFilter, setViewFilter] = useState('team');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
  setLoading(true);
  setError('');
  try {
    // ALWAYS fetch all team tasks
    const response = await apiFetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    }, onLogout);

    if (!response.ok) throw new Error('Failed to fetch tasks');

    let data = await response.json();

    console.log("RAW TASKS:", data);
    console.log("CURRENT USER:", currentUser);

  data.forEach(task => {
    console.log("TASK:", {
      id: task.id,
      assigned_to: task.assigned_to,
      user_id: task.user_id
    });
  });

    // 🔥 FILTER LOGIC (FRONTEND ONLY)
    if (viewFilter === 'assigned') {
      data = data.filter(t => t.assigned_to === currentUser?.id);
    }

    if (viewFilter === 'created') {
      data = data.filter(t => t.user_id === currentUser?.id);
    }

    if (statusFilter !== 'all') {
      data = data.filter(t => t.status === statusFilter);
    }

    setTasks(data || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
  console.log("CURRENT USER ID:", currentUser?.id);

}, [viewFilter, statusFilter, token, currentUser, onLogout]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiFetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }, onLogout);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) { /* ignore */ }
    };
    
    const fetchTeams = async () => {
      try {
        const response = await apiFetch(`${API_URL}/teams`, {}, onLogout);
        if (response.ok) {
          const data = await response.json();
          setTeams(data);
        }
      } catch (err) { /* ignore */ }
    };

    fetchUsers();
    fetchTeams();
  }, [token, onLogout]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const response = await apiFetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }, onLogout);
      if (response.ok) fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => {
    console.log(tasks)
  }, [fetchTasks]);

  const currentTeam = teams.find(t => t.id === currentUser?.team_id);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="text-indigo-600" size={24} />
              <h1 className="text-xl font-bold text-slate-800">TaskFlow</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-tighter">
                  {currentTeam ? currentTeam.name : 'Team Member'}
                </span>
                <span className="text-sm font-medium text-slate-600">{currentUser?.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
            {[
              { id: 'team', label: 'Team Tasks', icon: Users },
              { id: 'created', label: 'My Tasks', icon: Briefcase },
              { id: 'assigned', label: 'Assigned to Me', icon: User }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setViewFilter(f.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <f.icon size={16} />
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <button
              onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus size={20} />
              New Task
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-b-indigo-600"></div>
            <p className="text-slate-400 font-medium">Updating task list...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Briefcase size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No tasks found</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              {viewFilter === 'assigned' 
                ? "You haven't been assigned any tasks yet." 
                : "Your team task list is clear. Great job!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                users={users}
                currentUserId={currentUser?.id}
                onEdit={() => { setEditingTask(task); setIsModalOpen(true); }} 
                onDelete={() => handleDelete(task.id)} 
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <TaskModal 
          token={token}
          task={editingTask} 
          users={users}
          teams={teams}
          currentUser={currentUser}
          onLogout={onLogout}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchTasks(); }}
        />
      )}
    </div>
  );
}


function TaskCard({ task, users, currentUserId, onEdit, onDelete }) {
  const statusConfig = {
    'todo':        { icon: Circle,       color: 'text-slate-500', bg: 'bg-slate-100',  label: 'To Do' },
    'in_progress': { icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-100',  label: 'In Progress' },
    'completed':   { icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Completed' },
  };

  const currentStatus = statusConfig[task.status] || statusConfig['todo'];
  const StatusIcon = currentStatus.icon;
  const assignedUser = users.find(u => u.id === task.assigned_to);
  const isCreator = task.user_id === currentUserId;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-5">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentStatus.bg} ${currentStatus.color} uppercase tracking-wider`}>
          <StatusIcon size={14} strokeWidth={3} />
          {currentStatus.label}
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-extrabold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
        {task.title}
      </h3>
      
      <p className="text-slate-500 text-sm flex-grow mb-6 line-clamp-3">
        {task.description || 'No additional details provided.'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
            <User size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-slate-400 font-bold uppercase">Assigned To</span>
            <span className="text-slate-700 font-semibold truncate">
              {assignedUser ? assignedUser.username : 'Anyone'}
            </span>
          </div>
        </div>
        {isCreator && (
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">Owner</span>
        )}
      </div>
    </div>
  );
}


function TaskModal({ token, task, users, teams, currentUser, onLogout, onClose, onSuccess }) {
  const isEditing = !!task;
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    assigned_to: task?.assigned_to || '',
    team_id: task?.team_id || currentUser?.team_id || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEditing ? `${API_URL}/tasks/${task.id}` : `${API_URL}/tasks`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          assigned_to: formData.assigned_to || null 
        })
      }, onLogout);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save task');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800">
              {isEditing ? 'Modify Task' : 'Draft New Task'}
            </h3>
            <p className="text-sm text-slate-500">Scope: Task Details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2 border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Task Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-all text-slate-800 placeholder-slate-300"
              placeholder="What needs to be done?"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Detailed Description</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-all text-slate-800 placeholder-slate-300 resize-none"
              placeholder="Add context or sub-tasks..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 bg-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Assignee</label>
              <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 bg-white">
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Team</label>
            <select
              name="team_id"
              value={formData.team_id}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 bg-white"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 px-1 mt-1 font-medium">Select the team this task belongs to.</p>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {loading ? 'Processing...' : isEditing ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}