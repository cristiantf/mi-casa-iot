import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Wifi, Settings, Zap, Lightbulb, Fan, Tv, Thermometer, Droplets, Activity, Sun, Layers, 
  Plus, Trash, Server, CheckCircle, AlertCircle, LogOut, Lock, User, Clock, Users, Edit, Save, X, Wind, Mic 
} from 'lucide-react';
import './App.css';

// --- TOAST ---
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container" style={{position:'fixed', top:20, right:20, zIndex:9999}}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} style={{
            background: t.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
            color:'white', padding:'12px 20px', borderRadius:10, marginBottom:10, 
            display:'flex', alignItems:'center', gap:10, backdropFilter:'blur(5px)'
          }}>
            {t.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- APP CONTEXT ---
const AppContext = createContext();
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user_session')) || null);
  const [devices, setDevices] = useState([]);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('server_url') || "http://localhost:3001/api");
  const showToast = useContext(ToastContext);
  const getHeaders = () => ({ 'Content-Type': 'application/json', 'x-user-id': user?.id });

  const login = async (username, password) => {
    try {
      const res = await fetch(`${serverUrl}/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user_session', JSON.stringify(data.user));
        return true;
      }
      showToast(data.message, "error");
      return false;
    } catch (e) { showToast("Error de conexión", "error"); return false; }
  };

  const logout = () => { setUser(null); localStorage.removeItem('user_session'); };

  const loadDevices = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${serverUrl}/devices`);
      setDevices(await res.json());
    } catch (e) { console.error("Error loading devices"); }
  };

  const addDevice = async (dev) => {
    const res = await fetch(`${serverUrl}/devices`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dev) });
    if(res.ok) { loadDevices(); showToast("Dispositivo creado"); }
  };
  const editDevice = async (id, dev) => {
    const res = await fetch(`${serverUrl}/devices/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(dev) });
    if(res.ok) { loadDevices(); showToast("Actualizado"); }
  };
  const removeDevice = async (id) => {
    if(!window.confirm("¿Borrar dispositivo?")) return;
    const res = await fetch(`${serverUrl}/devices/${id}`, { method: 'DELETE', headers: getHeaders() });
    if(res.ok) { loadDevices(); showToast("Eliminado", "error"); }
  };
  const updateUser = async (id, userData) => {
      const res = await fetch(`${serverUrl}/users/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(userData) });
      if(res.ok) showToast("Usuario actualizado");
      else showToast("Error al actualizar", "error");
  };
  const syncStatus = async (id, statusVal) => {
    await fetch(`${serverUrl}/devices/${id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: statusVal.toString() }) });
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: statusVal.toString() } : d));
  };
  useEffect(() => { if (user) loadDevices(); }, [user, serverUrl]);

  return (
    <AppContext.Provider value={{ user, login, logout, devices, addDevice, editDevice, removeDevice, updateUser, syncStatus, serverUrl, setServerUrl, getHeaders }}>
      {children}
    </AppContext.Provider>
  );
};

// --- UI COMPONENTS ---
const VoiceControl = ({ onCommand }) => {
    const [listening, setListening] = useState(false);
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) { alert("Usa Chrome para voz."); return; }
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onresult = (e) => onCommand(e.results[0][0].transcript.toLowerCase());
        recognition.start();
    };
    return <button onClick={startListening} className={`mic-btn ${listening ? 'listening' : ''}`}><Mic size={24} color="white"/></button>;
};

const Navbar = () => {
  const loc = useLocation();
  const navStyle = { color: 'rgba(255,255,255,0.6)', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', fontSize:'0.75rem', gap:4 };
  const activeStyle = { ...navStyle, color: '#6366f1' };
  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" style={loc.pathname === '/dashboard' ? activeStyle : navStyle}><Zap size={24}/><span>Control</span></Link>
      <Link to="/settings" style={loc.pathname === '/settings' ? activeStyle : navStyle}><Settings size={24}/><span>Cuenta</span></Link>
    </nav>
  );
};

const FullNodeCard = ({ device }) => {
  const { syncStatus } = useContext(AppContext);
  const [state, setState] = useState({ d4: device.status === '1' ? 1 : 0, d5: 0, d6: 0, d7: 0, pwm9: 0, pwm10: 0, temp: 0, gas: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
       fetch(`http://${device.ip}/sensors`, { mode: 'cors' }).then(r => r.ok ? r.json() : null)
        .then(data => data && setState(p => ({...p, temp: data.temp, gas: data.gas}))).catch(() => {}); 
    }, 5000);
    return () => clearInterval(interval);
  }, [device.ip]);

  const send = (type, pin, val) => {
    const key = type === 'digital' ? `d${pin}` : `pwm${pin}`;
    setState(prev => ({ ...prev, [key]: val }));
    fetch(`http://${device.ip}/${type}?pin=${pin}&val=${val}`, { mode: 'no-cors' }).catch(e => console.log("Offline"));
    if (pin === 4 && type === 'digital') syncStatus(device.id, val);
  };

  return (
    <div className="device-card">
      <div className="card-header-row">
        <div><h3 style={{margin:0, display:'flex', gap:10, fontSize:'1.1rem'}}><Layers color="#6366f1"/> {device.name}</h3><small style={{color:'#94a3b8'}}>{device.ip}</small></div>
        <div style={{color: device.status === '1' ? '#10b981' : '#64748b', fontSize:'0.8rem'}}>● {device.status === '1' ? 'ON' : 'OFF'}</div>
      </div>
      <div className="control-grid">
        <div className={`control-item ${state.d4 ? 'active' : ''}`} onClick={() => send('digital', 4, state.d4 ? 0 : 1)}><Lightbulb size={24}/><span>{device.d4_name || 'Luz'}</span></div>
        <div className={`control-item ${state.d5 ? 'active' : ''}`} onClick={() => send('digital', 5, state.d5 ? 0 : 1)}><Fan size={24}/><span>{device.d5_name || 'Vent.'}</span></div>
        <div className={`control-item ${state.d6 ? 'active' : ''}`} onClick={() => send('digital', 6, state.d6 ? 0 : 1)}><Tv size={24}/><span>{device.d6_name || 'Patio'}</span></div>
        <div className={`control-item ${state.d7 ? 'active' : ''}`} onClick={() => send('digital', 7, state.d7 ? 0 : 1)}><Zap size={24}/><span>{device.d7_name || 'Aux'}</span></div>
      </div>
      <div className="slider-group"><span className="slider-label"><span><Sun size={14}/> Luz</span><span>{state.pwm9}</span></span><input type="range" className="range-slider" min="0" max="255" value={state.pwm9} onChange={(e) => send('pwm', 9, e.target.value)} /></div>
      <div className="slider-group" style={{marginTop:15}}><span className="slider-label"><span><Wind size={14}/> Motor</span><span>{state.pwm10}</span></span><input type="range" className="range-slider" min="0" max="255" value={state.pwm10} onChange={(e) => send('pwm', 10, e.target.value)} /></div>
      <div className="sensors-container">
         <div className="sensor-badge" style={{color:'#3b82f6'}}><Thermometer size={20}/><span className="sensor-value">{state.temp}°C</span></div>
         <div className="sensor-badge" style={{color:'#f97316'}}><Droplets size={20}/><span className="sensor-value">{state.gas}ppm</span></div>
         <div className="sensor-badge" style={{color:'#8b5cf6'}}><Activity size={20}/><span className="sensor-value">{device.ip}</span></div>
      </div>
    </div>
  );
};

// --- PANTALLAS ---
const DashboardScreen = () => {
  const { user, devices, syncStatus } = useContext(AppContext);
  const showToast = useContext(ToastContext);

  const handleVoice = (text) => {
      showToast(`Oído: "${text}"`);
      const words = text.toLowerCase();
      const isOn = words.includes("encender") || words.includes("prender") || words.includes("activar");
      const isOff = words.includes("apagar") || words.includes("desactivar");
      if (!isOn && !isOff) return; 
      const val = isOn ? 1 : 0;
      let found = false;

      devices.forEach(dev => {
          const checkAndSend = (btnName, pin) => {
              if (btnName && words.includes(btnName.toLowerCase())) {
                  fetch(`http://${dev.ip}/digital?pin=${pin}&val=${val}`, {mode:'no-cors'});
                  if(pin === 4) syncStatus(dev.id, val);
                  found = true;
              }
          };
          checkAndSend(dev.d4_name, 4); checkAndSend(dev.d5_name, 5);
          checkAndSend(dev.d6_name, 6); checkAndSend(dev.d7_name, 7);
      });
      if(found) showToast(isOn ? "Activando..." : "Apagando...");
      else showToast("No encontré ese dispositivo", "error");
  };

  return (
    <div className="container-main">
      <header className="app-header"><h2>Hola, {user?.name} 👋</h2></header>
      <div className="dashboard-grid">
        {devices.map(d => <FullNodeCard key={d.id} device={d} />)}
      </div>
      <div style={{position:'fixed', bottom:90, right:20, zIndex:100}}><VoiceControl onCommand={handleVoice}/></div>
      <Navbar />
    </div>
  );
};

const SettingsScreen = () => {
  const { user, devices, addDevice, editDevice, removeDevice, logout, serverUrl, getHeaders, updateUser } = useContext(AppContext);
  const [tab, setTab] = useState(user.role === 'admin' ? 'devices' : 'profile');
  
  // Forms
  const [editingId, setEditingId] = useState(null);
  const [formDev, setFormDev] = useState({ name:'', ip:'', location:'', d4_name:'Luz', d5_name:'Vent.', d6_name:'Patio', d7_name:'Aux' });
  
  const [usersList, setUsersList] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formUser, setFormUser] = useState({ username:'', password:'', role:'user' });
  const [newPass, setNewPass] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (tab === 'users') fetch(`${serverUrl}/users`, {headers: getHeaders()}).then(r=>r.json()).then(setUsersList);
    if (tab === 'history') fetch(`${serverUrl}/history`, {headers: getHeaders()}).then(r=>r.json()).then(setHistory);
  }, [tab]);

  // Devices CRUD
  const handleSaveDevice = () => {
    if (editingId) { editDevice(editingId, formDev); setEditingId(null); }
    else { addDevice(formDev); }
    setFormDev({ name:'', ip:'', location:'', d4_name:'Luz', d5_name:'Vent.', d6_name:'Patio', d7_name:'Aux' });
  };
  const startEditDev = (d) => { 
      setEditingId(d.id); 
      setFormDev({ 
          name: d.name, ip: d.ip, location: d.location,
          d4_name: d.d4_name || 'Luz', d5_name: d.d5_name || 'Vent.', 
          d6_name: d.d6_name || 'Patio', d7_name: d.d7_name || 'Aux'
      }); 
  };

  // Users CRUD
  const handleSaveUser = async () => {
      if (editingUser) { await updateUser(editingUser, formUser); setEditingUser(null); }
      else { await fetch(`${serverUrl}/users`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(formUser) }); }
      setFormUser({ username: '', password: '', role: 'user' });
      fetch(`${serverUrl}/users`, {headers: getHeaders()}).then(r=>r.json()).then(setUsersList);
  };
  const startEditUser = (u) => { setEditingUser(u.id); setFormUser({ username: u.username, password: '', role: u.role }); };
  const handleDeleteUser = async (id) => {
    if(!window.confirm("¿Borrar?")) return;
    await fetch(`${serverUrl}/users/${id}`, { method: 'DELETE', headers: getHeaders() });
    setUsersList(p => p.filter(u => u.id !== id));
  };
  const handleChangeMyPassword = async () => {
    if(newPass.length<3) return alert("Muy corta");
    await updateUser(user.id, {password: newPass}); setNewPass("");
  };

  return (
    <div className="container-main">
      <header className="app-header"><h2>Gestión ⚙️</h2></header>
      <div className="settings-tabs">
        {user.role === 'admin' && <button className={`tab-btn ${tab==='devices'?'active':''}`} onClick={()=>setTab('devices')}><Layers size={16}/> Nodos</button>}
        {user.role === 'admin' && <button className={`tab-btn ${tab==='users'?'active':''}`} onClick={()=>setTab('users')}><Users size={16}/> Usuarios</button>}
        {user.role === 'admin' && <button className={`tab-btn ${tab==='history'?'active':''}`} onClick={()=>setTab('history')}><Clock size={16}/> Historial</button>}
        <button className={`tab-btn ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}><User size={16}/> Perfil</button>
      </div>

      {user.role === 'admin' && tab === 'devices' && (
        <>
          <div className="form-card">
            <h4>{editingId ? 'Editar Nodo' : 'Nuevo Nodo'}</h4>
            <div style={{display:'grid', gap:10}}>
                <input className="input-field" placeholder="Nombre" value={formDev.name} onChange={e=>setFormDev({...formDev, name:e.target.value})}/>
                <input className="input-field" placeholder="IP" value={formDev.ip} onChange={e=>setFormDev({...formDev, ip:e.target.value})}/>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <input className="input-field" placeholder="Btn 1" value={formDev.d4_name} onChange={e=>setFormDev({...formDev, d4_name:e.target.value})}/>
                    <input className="input-field" placeholder="Btn 2" value={formDev.d5_name} onChange={e=>setFormDev({...formDev, d5_name:e.target.value})}/>
                    <input className="input-field" placeholder="Btn 3" value={formDev.d6_name} onChange={e=>setFormDev({...formDev, d6_name:e.target.value})}/>
                    <input className="input-field" placeholder="Btn 4" value={formDev.d7_name} onChange={e=>setFormDev({...formDev, d7_name:e.target.value})}/>
                </div>
                <button className="btn-primary" onClick={handleSaveDevice}>Guardar</button>
            </div>
          </div>
          <div className="device-card">
            {devices.map(d => (
              <div key={d.id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                <div><b>{d.name}</b> <small style={{color:'#6366f1'}}>({d.ip})</small></div>
                <div style={{display:'flex', gap:10}}>
                    <button className="btn-icon btn-edit" onClick={()=>startEditDev(d)}><Edit size={18}/></button>
                    <button className="btn-icon btn-delete" onClick={()=>removeDevice(d.id)}><Trash size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {user.role === 'admin' && tab === 'users' && (
        <>
          <div className="form-card">
            <h4>{editingUser ? 'Editar' : 'Nuevo'}</h4>
            <input className="input-field" placeholder="Usuario" value={formUser.username} onChange={e=>setFormUser({...formUser, username:e.target.value})}/>
            <input className="input-field" type="password" placeholder="Pass" value={formUser.password} onChange={e=>setFormUser({...formUser, password:e.target.value})}/>
            <select className="input-field" value={formUser.role} onChange={e=>setFormUser({...formUser, role:e.target.value})}>
                <option value="user">Usuario Limitado</option>
                <option value="admin">Administrador</option>
            </select>
            <button className="btn-primary" onClick={handleSaveUser}>{editingUser ? 'Actualizar' : 'Crear'}</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Usuario</th><th>Rol</th><th>Acción</th></tr></thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}><td>{u.username}</td><td>{u.role}</td>
                    <td>{u.username !== 'admin' && <div style={{display:'flex', gap:5}}><button className="btn-icon btn-edit" onClick={()=>startEditUser(u)}><Edit size={16}/></button><button className="btn-icon btn-delete" onClick={()=>handleDeleteUser(u.id)}><Trash size={16}/></button></div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {user.role === 'admin' && tab === 'history' && (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>User</th><th>Acción</th><th>Hora</th></tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}><td>{h.username || 'Sistema'}</td><td>{h.action}</td><td>{new Date(h.timestamp).toLocaleTimeString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'profile' && (
          <div className="form-card">
              <h4>Mi Perfil</h4>
              <p>Cambiar contraseña</p>
              <input className="input-field" type="password" placeholder="Nueva" value={newPass} onChange={e=>setNewPass(e.target.value)}/>
              <button className="btn-primary" style={{width:'auto'}} onClick={handleChangeMyPassword}>Actualizar</button>
              <hr style={{borderColor:'rgba(255,255,255,0.1)', margin:'20px 0'}}/>
              <button className="btn-primary" onClick={logout} style={{background:'#ef4444'}}>Cerrar Sesión</button>
          </div>
      )}
      <Navbar />
    </div>
  );
};

const LoginScreen = () => {
    const { login, setServerUrl, serverUrl } = useContext(AppContext);
    const [u, setU] = useState(""); const [p, setP] = useState(""); const [showConfig, setShowConfig] = useState(false);
    return (
        <div className="container-main" style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
            <div className="device-card" style={{width:'100%', maxWidth:350, textAlign:'center'}}>
                {!showConfig ? (
                    <>
                        <Lock size={40} color="#6366f1" style={{marginBottom:20}}/>
                        <h2>Acceso</h2>
                        <input className="input-field" placeholder="Usuario" onChange={e=>setU(e.target.value)}/>
                        <input className="input-field" type="password" placeholder="Contraseña" onChange={e=>setP(e.target.value)}/>
                        <button className="btn-primary" onClick={()=>login(u,p)}>ENTRAR</button>
                        <p onClick={()=>setShowConfig(true)} style={{fontSize:'0.8rem', marginTop:20, color:'#64748b', cursor:'pointer'}}>Configurar IP</p>
                    </>
                ) : (
                    <>
                        <Server size={40} color="#10b981" style={{marginBottom:20}}/>
                        <h2>Conexión</h2>
                        <input className="input-field" value={serverUrl} onChange={e=>setServerUrl(e.target.value)}/>
                        <button className="btn-primary" onClick={()=>setShowConfig(false)}>GUARDAR</button>
                    </>
                )}
            </div>
        </div>
    );
};
const AppContent = () => { const { user } = useContext(AppContext); if (!user) return <LoginScreen />; return <Router><Routes><Route path="/dashboard" element={<DashboardScreen />} /><Route path="/settings" element={<SettingsScreen />} /><Route path="*" element={<Navigate to="/dashboard" />} /></Routes></Router>; };
export default function App() { return <ToastProvider><AppProvider><AppContent /></AppProvider></ToastProvider>; }