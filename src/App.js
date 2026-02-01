import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Wifi, Settings, Zap, Lightbulb, Fan, Tv, Thermometer, 
  Droplets, Activity, Sun, Layers, Plus, Trash, Server, 
  CheckCircle, AlertCircle, LogOut, Wind, Lock, User 
} from 'lucide-react';
import './App.css';

// --- 1. SISTEMA DE NOTIFICACIONES (TOAST) ---
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
            display:'flex', alignItems:'center', gap:10, backdropFilter:'blur(5px)',
            boxShadow:'0 5px 15px rgba(0,0,0,0.3)'
          }}>
            {t.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- 2. CONTEXTO DE DATOS (APP) ---
const AppContext = createContext();

const AppProvider = ({ children }) => {
  // Estado del Usuario
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_session');
    return saved ? JSON.parse(saved) : null; // Inicia como null para pedir Login
  });
  
  const [devices, setDevices] = useState([]);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('server_url') || "http://localhost:3001/api");
  
  const showToast = useContext(ToastContext);

  // Login Simulado (O contra backend)
  const login = (u, p) => {
    if (u === 'admin' && p === '1234') {
        const userData = { name: "Admin", role: "admin" };
        setUser(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
        showToast("¡Bienvenido!");
        return true;
    } else {
        showToast("Usuario o contraseña incorrectos", "error");
        return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
    showToast("Sesión cerrada correctamente");
  };

  // Actualizar IP del Servidor Backend
  const updateServerUrl = (url) => {
    let formatted = url.replace(/\/$/, ""); 
    if (!formatted.endsWith("/api")) formatted += "/api";
    setServerUrl(formatted);
    localStorage.setItem('server_url', formatted);
    showToast(`Servidor configurado: ${formatted}`);
  };

  // Cargar dispositivos
  useEffect(() => {
    if (user) {
      const localDevs = localStorage.getItem('my_devices');
      if (localDevs) {
        setDevices(JSON.parse(localDevs));
      } else {
        setDevices([{ id: 1, name: "Sala Demo", ip: "192.168.1.50", location: "Planta Baja" }]);
      }
    }
  }, [user]);

  // Funciones CRUD
  const addDevice = (newDev) => {
    const updated = [...devices, { ...newDev, id: Date.now() }];
    setDevices(updated);
    localStorage.setItem('my_devices', JSON.stringify(updated));
    showToast("Dispositivo agregado");
  };

  const removeDevice = (id) => {
    const updated = devices.filter(d => d.id !== id);
    setDevices(updated);
    localStorage.setItem('my_devices', JSON.stringify(updated));
    showToast("Dispositivo eliminado", "error");
  };

  return (
    <AppContext.Provider value={{ user, login, logout, devices, addDevice, removeDevice, serverUrl, updateServerUrl }}>
      {children}
    </AppContext.Provider>
  );
};

// --- 3. COMPONENTES UI ---

const Navbar = () => {
  const loc = useLocation();
  const navStyle = { color: 'rgba(255,255,255,0.6)', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', fontSize:'0.75rem', gap:4 };
  const activeStyle = { ...navStyle, color: '#6366f1' };

  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" style={loc.pathname === '/dashboard' ? activeStyle : navStyle}>
        <Zap size={24}/><span>Control</span>
      </Link>
      <Link to="/settings" style={loc.pathname === '/settings' ? activeStyle : navStyle}>
        <Settings size={24}/><span>Ajustes</span>
      </Link>
    </nav>
  );
};

// PANTALLA DE LOGIN
const LoginScreen = () => {
    const { login } = useContext(AppContext);
    const [u, setU] = useState("");
    const [p, setP] = useState("");

    return (
        <div className="container-main" style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div className="device-card" style={{width:'100%', maxWidth:'350px', textAlign:'center'}}>
                <div style={{background:'rgba(99, 102, 241, 0.2)', width:60, height:60, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto'}}>
                    <Lock size={30} color="#6366f1"/>
                </div>
                <h2 style={{margin:0}}>Smart Home</h2>
                <p style={{color:'#94a3b8', marginBottom:30}}>Ingresa tus credenciales</p>
                
                <div style={{textAlign:'left', marginBottom:15}}>
                    <div style={{display:'flex', alignItems:'center', background:'rgba(0,0,0,0.3)', borderRadius:10, padding:'0 10px', border:'1px solid rgba(255,255,255,0.1)'}}>
                        <User size={18} color="#94a3b8"/>
                        <input placeholder="Usuario (admin)" value={u} onChange={e=>setU(e.target.value)} style={{background:'transparent', border:'none', color:'white', padding:15, width:'100%', outline:'none'}}/>
                    </div>
                </div>
                <div style={{textAlign:'left', marginBottom:30}}>
                    <div style={{display:'flex', alignItems:'center', background:'rgba(0,0,0,0.3)', borderRadius:10, padding:'0 10px', border:'1px solid rgba(255,255,255,0.1)'}}>
                        <Lock size={18} color="#94a3b8"/>
                        <input type="password" placeholder="Contraseña (1234)" value={p} onChange={e=>setP(e.target.value)} style={{background:'transparent', border:'none', color:'white', padding:15, width:'100%', outline:'none'}}/>
                    </div>
                </div>

                <button onClick={() => login(u, p)} style={{width:'100%', padding:15, borderRadius:10, border:'none', background:'#6366f1', color:'white', fontWeight:'bold', fontSize:'1rem', cursor:'pointer', boxShadow:'0 4px 15px rgba(99, 102, 241, 0.4)'}}>
                    INICIAR SESIÓN
                </button>
            </div>
        </div>
    );
};

// TARJETA DE DISPOSITIVO (DASHBOARD)
const FullNodeCard = ({ device }) => {
  const [state, setState] = useState({ d4:0, d5:0, d6:0, d7:0, pwm9:0, pwm10:0, temp:24, hum:60, gas:12 });

  const send = (type, pin, val) => {
    const key = type === 'digital' ? `d${pin}` : `pwm${pin}`;
    setState(prev => ({ ...prev, [key]: val }));
    
    // Envío real al ESP
    fetch(`http://${device.ip}/${type}?pin=${pin}&val=${val}`, { mode: 'no-cors' })
      .catch(e => console.log("Offline"));
  };

  return (
    <div className="device-card">
      <div className="card-header-row">
        <div>
          <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', fontSize:'1.1rem'}}>
            <Layers color="#6366f1" size={20}/> {device.name}
          </h3>
          <small style={{color:'#94a3b8'}}>{device.ip}</small>
        </div>
        <div style={{display:'flex', alignItems:'center', color:'#10b981', fontSize:'0.8rem', gap:'5px'}}>
          <div style={{width:8, height:8, background:'#10b981', borderRadius:'50%', boxShadow:'0 0 10px #10b981'}}></div>
          Online
        </div>
      </div>

      <div className="control-grid">
        <div className={`control-item ${state.d4 ? 'active' : ''}`} onClick={() => send('digital', 4, state.d4 ? 0 : 1)}>
          <Lightbulb size={24}/> <span>Luz</span>
        </div>
        <div className={`control-item ${state.d5 ? 'active' : ''}`} onClick={() => send('digital', 5, state.d5 ? 0 : 1)}>
          <Fan size={24}/> <span>Ventilador</span>
        </div>
        <div className={`control-item ${state.d6 ? 'active' : ''}`} onClick={() => send('digital', 6, state.d6 ? 0 : 1)}>
          <Tv size={24}/> <span>Patio</span>
        </div>
        <div className={`control-item ${state.d7 ? 'active' : ''}`} onClick={() => send('digital', 7, state.d7 ? 0 : 1)}>
          <Zap size={24}/> <span>Aux</span>
        </div>
      </div>

      {/* --- AQUÍ ESTÁ EL CAMBIO: DOS SLIDERS (PIN 9 y PIN 10) --- */}
      
      {/* Slider PIN 9 (Dimmer Luz) */}
      <div className="slider-group">
        <span className="slider-label" style={{display:'flex', justifyContent:'space-between'}}>
            <span><Sun size={14} style={{verticalAlign:'middle', marginRight:5}}/> Iluminación (Pin 9)</span>
            <span>{state.pwm9}</span>
        </span>
        <input type="range" className="range-slider" min="0" max="255" value={state.pwm9} onChange={(e) => send('pwm', 9, e.target.value)} />
      </div>

      {/* Slider PIN 10 (Velocidad Motor) */}
      <div className="slider-group" style={{marginTop: 20}}>
        <span className="slider-label" style={{display:'flex', justifyContent:'space-between'}}>
            <span><Wind size={14} style={{verticalAlign:'middle', marginRight:5}}/> Velocidad Motor (Pin 10)</span>
            <span>{state.pwm10}</span>
        </span>
        <input type="range" className="range-slider" min="0" max="255" value={state.pwm10} onChange={(e) => send('pwm', 10, e.target.value)} />
      </div>
      {/* -------------------------------------------------------- */}

      <div className="sensors-row" style={{marginTop:25}}>
        <div className="sensor-badge"><Thermometer size={14}/> {state.temp}°C</div>
        <div className="sensor-badge"><Droplets size={14}/> {state.hum}%</div>
        <div className="sensor-badge"><Activity size={14}/> Gas: {state.gas}</div>
      </div>
    </div>
  );
};

// --- 4. PANTALLAS ---

const DashboardScreen = () => {
  const { user, devices } = useContext(AppContext);
  return (
    <div className="container-main">
      <header className="app-header">
        <h2 style={{fontSize:'1.5rem', margin:0}}>Hola, {user?.name} 👋</h2>
        <p style={{color:'#94a3b8', margin:0}}>Panel de Control</p>
      </header>

      <div className="dashboard-grid">
        {devices.length === 0 ? (
          <div style={{textAlign:'center', padding:40, color:'#64748b'}}>
            <p>No hay dispositivos.</p>
            <p>Ve a <b>Ajustes</b> para agregar uno.</p>
          </div>
        ) : (
          devices.map(d => <FullNodeCard key={d.id} device={d} />)
        )}
      </div>
      <Navbar />
    </div>
  );
};

const SettingsScreen = () => {
  const { devices, addDevice, removeDevice, serverUrl, updateServerUrl, logout } = useContext(AppContext);
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [tmpServer, setTmpServer] = useState(serverUrl);

  const handleAdd = () => {
    if (name && ip) {
      addDevice({ name, ip, location: "Manual" });
      setName(""); setIp("");
    }
  };

  return (
    <div className="container-main">
      <header className="app-header">
        <h2 style={{fontSize:'1.5rem', margin:0}}>Ajustes ⚙️</h2>
      </header>

      <div className="dashboard-grid">
        
        {/* AGREGAR NODO */}
        <div className="device-card">
          <h3 style={{marginTop:0, display:'flex', gap:10}}><Plus color="#6366f1"/> Nuevo Nodo</h3>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            <input 
              placeholder="Nombre (ej: Cocina)" 
              value={name} onChange={e => setName(e.target.value)} 
              style={{padding:12, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none'}}
            />
            <input 
              placeholder="IP ESP (ej: 192.168.1.50)" 
              value={ip} onChange={e => setIp(e.target.value)} 
              style={{padding:12, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none'}}
            />
            <button onClick={handleAdd} style={{padding:12, borderRadius:10, border:'none', background:'#6366f1', color:'white', fontWeight:'bold', cursor:'pointer'}}>
              Guardar Dispositivo
            </button>
          </div>
        </div>

        {/* CONFIGURAR SERVIDOR */}
        <div className="device-card">
          <h3 style={{marginTop:0, display:'flex', gap:10}}><Server color="#10b981"/> Servidor PC</h3>
          <p style={{fontSize:'0.8rem', color:'#94a3b8'}}>IP de tu computadora (Node.js)</p>
          <div style={{display:'flex', gap:10}}>
            <input 
              value={tmpServer} onChange={e => setTmpServer(e.target.value)} 
              style={{flex:1, padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.3)', color:'white', outline:'none'}}
            />
            <button onClick={() => updateServerUrl(tmpServer)} style={{padding:'10px 20px', borderRadius:10, border:'1px solid #10b981', background:'transparent', color:'#10b981', cursor:'pointer'}}>
              OK
            </button>
          </div>
        </div>

        {/* LISTA DE DISPOSITIVOS */}
        <div className="device-card">
          <h3 style={{marginTop:0}}>Mis Dispositivos</h3>
          {devices.map(d => (
            <div key={d.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <div>
                <div style={{fontWeight:'bold'}}>{d.name}</div>
                <div style={{fontSize:'0.8rem', color:'#6366f1'}}>{d.ip}</div>
              </div>
              <button onClick={() => removeDevice(d.id)} style={{background:'rgba(239, 68, 68, 0.2)', border:'none', borderRadius:8, padding:8, color:'#ef4444', cursor:'pointer'}}>
                <Trash size={16}/>
              </button>
            </div>
          ))}
        </div>

        {/* BOTON CERRAR SESION */}
        <button onClick={logout} style={{width:'100%', padding:15, borderRadius:15, border:'1px solid #ef4444', background:'transparent', color:'#ef4444', display:'flex', justifyContent:'center', gap:10, cursor:'pointer', fontWeight:'bold'}}>
          <LogOut size={20}/> CERRAR SESIÓN
        </button>

      </div>
      <Navbar />
    </div>
  );
};

// --- APP PRINCIPAL CON LÓGICA DE SESIÓN ---
const AppContent = () => {
    const { user } = useContext(AppContext);
    
    // Si no hay usuario, mostramos SOLO el Login
    if (!user) {
        return <LoginScreen />;
    }

    // Si hay usuario, mostramos el Router con Dashboard y Settings
    return (
        <Router>
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/settings" element={<SettingsScreen />} /> 
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
    );
};

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
         <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}