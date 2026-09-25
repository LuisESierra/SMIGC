import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  HashRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Compass,
  ScanLine,
  Layers,
  Fingerprint,
  Users,
  Clock,
  HelpCircle,
  X,
  Check,
  Lock,
  Volume2,
  VolumeX,
  Monitor,
  Copy,
  Camera,
  Search,
  Trophy,
  RotateCcw,
  Wifi,
  WifiOff,
  Play,
  MapPin,
  Star,
  ChevronRight,
} from 'lucide-react';
import { roles, stories, storyFor, asset, symbolImage } from '../shared/content.js';
import './styles.css';

const Ctx = createContext(null),
  icons = { Compass, ScanLine, Layers, Fingerprint };
const useGame = () => useContext(Ctx);
const museumScreenRoutes = new Set([
  '/museo',
  '/induccion',
  '/animacionMuseo',
  '/qrMuseo',
  '/tematicaMuseo',
  '/rolesMuseo',
  '/estadoMuseo',
  '/revisarCelular',
  '/fraseMuseo',
  '/gananMuseo',
  '/tematicaMuseo2',
]);
const format = (seconds) =>
  `${Math.floor(Math.max(0, seconds) / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(Math.max(0, seconds) % 60)
    .toString()
    .padStart(2, '0')}`;
async function request(path, body) {
  const res = await fetch(
    '/api' + path,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo completar la solicitud.');
  return data;
}
function Provider({ children }) {
  const [session, setSession] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem('smigc-session'));
      } catch {
        return null;
      }
    }),
    [room, setRoom] = useState(null),
    [connected, setConnected] = useState(false),
    [error, setError] = useState(''),
    [sound, setSound] = useState(false),
    [now, setNow] = useState(Date.now()),
    socket = useRef(null),
    offset = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset.current), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!session) {
      setRoom(null);
      return;
    }
    const s = io({ autoConnect: true });
    socket.current = s;
    s.on('connect', () => {
      s.emit('subscribe', session, (result) => {
        if (result.error) {
          setError(result.error);
          setConnected(false);
        } else setConnected(true);
      });
    });
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));
    s.on('state', (value) => {
      offset.current = value.serverNow - Date.now();
      setRoom(value);
    });
    return () => {
      s.disconnect();
      socket.current = null;
    };
  }, [session]);
  function login(value) {
    sessionStorage.setItem('smigc-session', JSON.stringify(value));
    setRoom(null);
    setSession(value);
  }
  function logout() {
    sessionStorage.removeItem('smigc-session');
    setSession(null);
    setRoom(null);
  }
  const play = (good = true) => {
    if (sound)
      new Audio(
        asset(good ? 'Bloqueo/audio/sonidoCorrecto.mp3' : 'Bloqueo/audio/sonidoIncorrecto.mp3'),
      )
        .play()
        .catch(() => {});
  };
  const action = (type, payload = {}) =>
    new Promise((resolve) => {
      if (!socket.current?.connected) {
        setError('Se perdió la conexión. Tu progreso está guardado; espera a reconectar.');
        return resolve(false);
      }
      socket.current.timeout(6000).emit('action', { type, payload }, (err, result) => {
        if (err || result?.error) {
          setError(result?.error || 'No llegó la respuesta. Revisa la conexión.');
          play(false);
          resolve(false);
        } else {
          setError('');
          if (['find', 'solve', 'phrase'].includes(type)) play();
          resolve(true);
        }
      });
    });
  return (
    <Ctx.Provider
      value={{
        session,
        room,
        connected,
        error,
        setError,
        login,
        logout,
        action,
        now,
        sound,
        setSound,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
function RoleIcon({ role, size = 24 }) {
  const Icon = icons[role.icon];
  return <Icon size={size} strokeWidth={1.5} />;
}
function Button({ children, className = '', ...props }) {
  return (
    <button className={'button ' + className} {...props}>
      {children}
    </button>
  );
}
function PageHead({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">
          <span />
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {description && <p className="lede">{description}</p>}
      </div>
      {children}
    </div>
  );
}
function Shell() {
  const { room, session, connected, error, setError, now, sound, setSound } = useGame();
  const [help, setHelp] = useState(false);
  const location = useLocation();
  const brandHome = session?.host || museumScreenRoutes.has(location.pathname) ? '/museo' : '/';
  const active = ['playing', 'phrase'].includes(room?.phase),
    seconds = room?.startedAt ? Math.ceil((room.startedAt + 600000 - now) / 1000) : 600;
  useEffect(() => {
    setError('');
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <div className="institution-bar">
        <span>UNIVERSIDAD AUTÓNOMA DE OCCIDENTE</span>
        <span>
          CALI, COLOMBIA <span className="tiny-dot" />
        </span>
      </div>
      <header className="site-header">
        <Link
          to={brandHome}
          className="brand"
          aria-label={`Museo Interactivo Lilí, ${brandHome === '/museo' ? 'inicio de la pantalla del museo' : 'inicio de participantes'}`}
        >
          <span className="brand-wordmark">
            <span>Museo</span>
            <strong>Interactivo Lilí</strong>
          </span>
          <span className="brand-divider" />
          <span className="brand-caption">
            EXPERIENCIA
            <br />
            <b>INTERACTIVA</b>
          </span>
        </Link>
        <nav aria-label="Navegación principal">
          <button className="nav-link" onClick={() => setHelp(true)}>
            <HelpCircle size={17} />
            Cómo jugar
          </button>
          <Link
            className={'nav-link ' + (location.pathname === '/museo' ? 'selected' : '')}
            to="/museo"
          >
            <Monitor size={17} />
            <span>Pantalla del museo</span>
          </Link>
          <a
            className="museum-link"
            href="https://museo.uao.edu.co/"
            target="_blank"
            rel="noreferrer"
          >
            Visita el museo <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      {session && (
        <div className="session-bar">
          <span className="session-status">
            {connected ? <Wifi size={15} /> : <WifiOff size={15} />}{' '}
            {connected ? 'Sala conectada' : 'Reconectando…'} <b>{session.code}</b>
          </span>
          <span>
            {room?.me?.role
              ? roles.find((r) => r.id === room.me.role)?.name
              : session.host
                ? 'Pantalla compartida'
                : 'Participante'}
          </span>
          {active && (
            <strong className={seconds < 60 ? 'timer urgent' : 'timer'}>
              <Clock size={16} />
              {format(seconds)}
            </strong>
          )}
          <button
            className="icon-button"
            aria-label={sound ? 'Desactivar sonidos' : 'Activar sonidos'}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      )}
      <main id="main">
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button
              className="icon-button"
              aria-label="Cerrar mensaje"
              onClick={() => setError('')}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/introduccion"
            element={
              <Guard>
                <RolePicker />
              </Guard>
            }
          />
          <Route
            path="/introduccion/:slug"
            element={
              <Guard>
                <Introduction />
              </Guard>
            }
          />
          <Route
            path="/seleccionCargando"
            element={
              <Guard>
                <Lobby />
              </Guard>
            }
          />
          <Route
            path="/juego/:role"
            element={
              <Guard>
                <Game />
              </Guard>
            }
          />
          <Route path="/museo" element={<Museum />} />
          <Route path="/induccion" element={<VideoPage kind="induction" />} />
          <Route path="/animacionMuseo" element={<VideoPage kind="context" />} />
          <Route
            path="/qrMuseo"
            element={
              <Guard>
                <RoomQR />
              </Guard>
            }
          />
          <Route
            path="/tematicaMuseo"
            element={
              <Guard>
                <VideoPage kind="story" />
              </Guard>
            }
          />
          <Route
            path="/rolesMuseo"
            element={
              <Guard>
                <MuseumRoles />
              </Guard>
            }
          />
          <Route
            path="/estadoMuseo"
            element={
              <Guard>
                <Lobby host />
              </Guard>
            }
          />
          <Route
            path="/revisarCelular"
            element={
              <Guard>
                <SharedPlay />
              </Guard>
            }
          />
          <Route
            path="/fraseMuseo"
            element={
              <Guard>
                <SharedPlay />
              </Guard>
            }
          />
          <Route
            path="/ganan"
            element={
              <Guard>
                <Result />
              </Guard>
            }
          />
          <Route
            path="/pierden"
            element={
              <Guard>
                <Result />
              </Guard>
            }
          />
          <Route
            path="/gananMuseo"
            element={
              <Guard>
                <Result host />
              </Guard>
            }
          />
          <Route
            path="/tematicaMuseo2"
            element={
              <Guard>
                <VideoPage kind="ending" />
              </Guard>
            }
          />
          <Route
            path="/museoTabla"
            element={
              <Guard>
                <Scores />
              </Guard>
            }
          />
          <Route path="/museoTablaMejorT" element={<Scores best />} />
          <Route
            path="/intentaloDenuevo"
            element={
              <Guard>
                <Retry />
              </Guard>
            }
          />
          <Route
            path="/TestFinalizada"
            element={
              <Guard>
                <Completion />
              </Guard>
            }
          />
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>No encontramos esta pantalla</h1>
                <Link className="button" to="/">
                  Volver al inicio <ArrowRight size={18} />
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        <span>
          Museo Lilí <span className="footer-dot">·</span> Memorias que nos conectan.
        </span>
        <span>
          SMIGC <span className="footer-dot">/</span> Una experiencia para descubrir en equipo
        </span>
        <img src="/assets/museum/uao.webp" alt="Universidad Autónoma de Occidente" />
      </footer>
      {help && <Help onClose={() => setHelp(false)} />}
    </>
  );
}
function Help({ onClose }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="help-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <button className="icon-button close" aria-label="Cerrar ayuda" onClick={onClose}>
        <X />
      </button>
      <p className="eyebrow">GUÍA DE LA EXPERIENCIA</p>
      <h2>
        Cuatro roles.
        <br />
        Una historia por descubrir.
      </h2>
      <p>
        Reúnan cuatro participantes y abran la pantalla del museo para crear una sala. Cada persona
        ingresa desde su dispositivo, se registra y elige un rol diferente.
      </p>
      <div className="help-steps">
        {roles.map((r, i) => (
          <div key={r.id}>
            <span className="role-icon">
              <RoleIcon role={r} />
            </span>
            <div>
              <b>
                0{i + 1} · {r.name}
              </b>
              <p>{r.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="note">
        <Clock size={18} /> Tienen 10 minutos desde que el museo inicia la misión. Después,
        completen juntos la frase final.
      </p>
      <details>
        <summary>Ver el tutorial original</summary>
        {[1, 2, 3, 4].map((i) => (
          <img
            className="tutorial-image"
            key={i}
            src={asset(`Modal/resources/tutorial/tutorial${i}.png`)}
            alt={`Paso ${i} del tutorial original`}
          />
        ))}
      </details>
      <Button onClick={onClose}>
        Entendido <Check size={18} />
      </Button>
    </dialog>
  );
}
function Home() {
  const { session, room, setError } = useGame();
  const nav = useNavigate();
  const [code, setCode] = useState(
      () => new URLSearchParams(location.hash.split('?')[1]).get('sala') || '',
    ),
    [busy, setBusy] = useState(false);
  async function enter(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await request('/rooms/' + encodeURIComponent(code));
      if (data.phase !== 'lobby')
        throw new Error('Esta sala ya comenzó. Pide una nueva sala al museo.');
      if (data.count >= 4) throw new Error('La sala ya está completa.');
      sessionStorage.setItem('smigc-join', data.code);
      nav('/registro');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="home">
      <div className="breadcrumb">
        MUSEO LILÍ <ChevronRight size={12} /> EXPLORA EN EQUIPO
      </div>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            <span />
            EL PATRIMONIO COBRA VIDA
          </p>
          <h1>
            El pasado tiene
            <br />
            mucho que
            <br />
            <em>contarnos.</em>
          </h1>
          <p className="hero-description">
            Cuatro viajeros. Una misión compartida.
            <br />
            Encuentren los símbolos, descifren las palabras
            <br className="desktop" /> y rescaten juntos las memorias del territorio.
          </p>
          <form className="entry-card" onSubmit={enter}>
            <div className="entry-heading">
              <span className="small-icon">
                <Compass size={21} />
              </span>
              <div>
                <h2>Tu aventura empieza aquí</h2>
                <p>Introduce el código que ves en la pantalla del museo.</p>
              </div>
            </div>
            <label htmlFor="room-code">CÓDIGO DE LA SALA</label>
            <div className="code-row">
              <input
                id="room-code"
                name="code"
                aria-label="Código de la sala"
                placeholder="— — — —"
                value={code}
                maxLength={4}
                minLength={4}
                pattern="[A-Za-z0-9]{4}"
                autoComplete="off"
                required
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              />
              <Button disabled={busy || code.length !== 4}>
                {busy ? 'Conectando…' : 'Unirme a la experiencia'}
                <ArrowRight size={20} />
              </Button>
            </div>
            <div className="entry-meta">
              <span>
                <Users size={14} />4 participantes
              </span>
              <span>
                <Clock size={14} />
                10 minutos
              </span>
              <span>
                <Check size={14} />
                En equipo
              </span>
            </div>
          </form>
          {session && (
            <Link
              className="resume-link"
              to={
                session.host
                  ? '/estadoMuseo'
                  : room?.me?.role
                    ? '/seleccionCargando'
                    : '/introduccion'
              }
            >
              Retomar mi sala {session.code} <ArrowRight size={16} />
            </Link>
          )}
        </div>
        <div className="hero-art">
          <img
            className="hero-photo"
            src="/assets/museum/exhibition.png"
            alt="Vitrina de piezas arqueológicas del Museo Lilí"
          />
          <div className="art-top">
            <span>
              <span className="live-dot" /> MUSEO LILÍ · CALI
            </span>
            <ArrowUpRight size={21} />
          </div>
          <div className="art-caption">
            <span className="art-index">01 / EXPLORAR</span>
            <h2>
              Huellas del pasado.
              <br />
              Conexiones del presente.
            </h2>
            <div className="art-caption-bottom">
              <span>
                Una colección de historias
                <br />
                espera ser descubierta.
              </span>
              <span className="round-arrow">
                <ArrowRight size={24} />
              </span>
            </div>
          </div>
          <span className="photo-credit">Imagen del sitio del Museo Lilí</span>
        </div>
      </section>
      <section className="roles-overview">
        <div className="section-label">
          <p className="eyebrow">CADA MIRADA CUENTA</p>
          <h2>Un equipo, cuatro formas de descubrir.</h2>
          <span>¿Cuál será tu papel?</span>
        </div>
        <div className="role-cards">
          {roles.map((r, i) => (
            <article key={r.id} className="role-overview">
              <div className="role-card-top">
                <RoleIcon role={r} size={29} />
                <span>0{i + 1}</span>
              </div>
              <h3>{r.name}</h3>
              <p>{r.verb}</p>
              <span className="role-line" />
            </article>
          ))}
        </div>
      </section>
      <div className="home-bottom">
        <span>
          <MapPin size={16} /> Museo etnográfico y arqueológico · Universidad Autónoma de Occidente
        </span>
        <Link to="/museo">
          Preparar una sala <ArrowUpRight size={17} />
        </Link>
      </div>
    </div>
  );
}
function Register() {
  const { login, setError } = useGame();
  const nav = useNavigate(),
    code = sessionStorage.getItem('smigc-join');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      login(await request(`/rooms/${code}/join`, { ...data, consent: data.consent === 'on' }));
      nav('/introduccion');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!code)
    return (
      <div className="empty">
        <h1>Primero ingresa el código de sala</h1>
        <Link to="/" className="button">
          Ir al inicio
        </Link>
      </div>
    );
  return (
    <div className="page narrow">
      <Link to="/" className="back">
        <ArrowLeft size={16} /> Volver
      </Link>
      <PageHead
        eyebrow={`SALA ${code} / 01 · REGISTRO`}
        title="Toda historia empieza contigo."
        description="Cuéntanos quién eres para sumarte a la expedición."
      />
      <form className="panel form-panel" onSubmit={submit}>
        <label>
          Nombre completo
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={70}
            required
            placeholder="¿Cómo te llamas?"
          />
        </label>
        <label>
          D.I. o código estudiantil
          <input
            name="identification"
            inputMode="numeric"
            pattern="[0-9]{3,20}"
            required
            placeholder="Tu documento o código"
          />
        </label>
        <label>
          Correo electrónico
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={150}
            required
            placeholder="nombre@correo.com"
          />
        </label>
        <fieldset>
          <legend>Participas como</legend>
          <label className="radio-label">
            <input type="radio" name="type" value="Estudiante" required />
            Estudiante
          </label>
          <label className="radio-label">
            <input type="radio" name="type" value="Visitante" required />
            Visitante
          </label>
        </fieldset>
        <label className="checkbox-label">
          <input type="checkbox" name="consent" required />
          <span>
            Estoy de acuerdo con el{' '}
            <a
              href="https://www.uao.edu.co/aviso-de-privacidad-de-la-universidad-autonoma-de-occidente/"
              target="_blank"
              rel="noreferrer"
            >
              aviso de privacidad de la UAO
            </a>{' '}
            y el registro de mis datos para esta experiencia.
          </span>
        </label>
        <p className="muted small">
          Los datos de esta recreación se guardan en el servidor que aloja la sala. No se envían al
          sistema original.
        </p>
        <Button disabled={busy}>
          {busy ? 'Registrando…' : 'Escoger mi rol'}
          <ArrowRight size={18} />
        </Button>
      </form>
    </div>
  );
}
function Guard({ children }) {
  const { session, room, connected } = useGame();
  if (!session)
    return (
      <div className="empty">
        <Lock size={40} />
        <h1>Únete a una sala para continuar</h1>
        <Link to="/" className="button">
          Ingresar código <ArrowRight size={18} />
        </Link>
      </div>
    );
  if (!room)
    return (
      <div className="empty">
        <div className="spinner" />
        <h2>{connected ? 'Recuperando la expedición…' : 'Conectando con la sala…'}</h2>
        <p>Conservamos tu sesión al recargar esta pestaña.</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  return children;
}
function RolePicker() {
  const { room, action } = useGame(),
    nav = useNavigate();
  if (room.me.host) return <Lobby host />;
  return (
    <div className="page">
      <PageHead
        eyebrow="02 / ELIGE TU ROL"
        title="Una misión. Cuatro miradas."
        description="Cada integrante tiene una habilidad única. Elijan roles diferentes y descubran lo que pueden lograr juntos."
      />
      <div className="pick-grid">
        {roles.map((r, i) => {
          const player = room.players.find((p) => p.role === r.id),
            occupied = player && player.id !== room.me.id;
          return (
            <article className={'panel pick-card ' + (occupied ? 'occupied' : '')} key={r.id}>
              <span className="pick-number">0{i + 1}</span>
              <img src={asset(`Picker/logos/logo${r.image}.png`)} alt="" />
              <h2>{r.name}</h2>
              <p>{r.verb}</p>
              <p className="small muted">{r.description}</p>
              <Button
                disabled={occupied}
                className="secondary"
                onClick={async () => {
                  if (await action('role', { role: r.id })) nav('/introduccion/' + r.id);
                }}
              >
                {occupied ? `${player.name} · Ocupado` : 'Elegir ' + r.name}
                {occupied ? <Lock size={16} /> : <ArrowRight size={17} />}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
function Animation({ role }) {
  const frameMap = {
    guia: ['animacionmapa', [49, 50, 51]],
    huaquero: ['animacionHuaquero', [52, 53, 54]],
    interprete: ['animacionInterprete', [55, 56, 57, 58, 59, 60, 61]],
    antropologo: ['animacionAntropologo', [62, 63, 65, 66, 67, 68, 69, 70]],
  };
  const [frame, setFrame] = useState(0);
  const [folder, frames] = frameMap[role];
  useEffect(() => {
    const id = setInterval(() => setFrame((v) => (v + 1) % frames.length), 650);
    return () => clearInterval(id);
  }, [role]);
  return (
    <img
      className="instruction-animation"
      src={asset(`Introduccion/resources/${folder}/Frame ${frames[frame % frames.length]}.png`)}
      alt="Demostración de la actividad del rol"
    />
  );
}
function Introduction() {
  const { slug } = useParams(),
    r = roles.find((r) => r.id === slug),
    { room, action } = useGame(),
    nav = useNavigate();
  if (!r) return <RolePicker />;
  return (
    <div className="page narrow">
      <Link className="back" to="/introduccion">
        <ArrowLeft size={16} /> Cambiar de rol
      </Link>
      <PageHead eyebrow="CONOCE TU MISIÓN" title={`Eres ${r.name}.`} description={r.description} />
      <div className="panel introduction-panel">
        <Animation role={r.id} />
        <audio
          controls
          preload="none"
          src={asset(`RolesMuseo/resources/Narracion${r.audio}.mp3`)}
          aria-label={`Narración del rol ${r.name}`}
        />
        <Button
          onClick={async () => {
            if (room.me.role !== r.id && !(await action('role', { role: r.id }))) return;
            if (await action('ready')) nav('/seleccionCargando');
          }}
        >
          Estoy listo <Check size={18} />
        </Button>
      </div>
    </div>
  );
}
function Team({ room }) {
  return (
    <div className="team-grid">
      {roles.map((r) => {
        const p = room.players.find((p) => p.role === r.id);
        return (
          <div key={r.id} className={'team-member ' + (p?.ready ? 'ready' : '')}>
            <span className="role-icon">
              <RoleIcon role={r} />
            </span>
            <div>
              <strong>{r.name}</strong>
              <p>{p?.name || 'Esperando viajero…'}</p>
            </div>
            <span className="team-badge">
              {p?.finishedAt ? <Check size={18} /> : p?.ready ? 'Listo' : p ? 'Eligiendo' : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
function usePhaseRoute(host = false) {
  const { room } = useGame(),
    nav = useNavigate();
  useEffect(() => {
    if (room.phase === 'playing' || room.phase === 'phrase')
      nav(host ? '/fraseMuseo' : '/juego/' + room.me.role);
    else if (room.phase === 'won') nav(host ? '/gananMuseo' : '/ganan');
    else if (room.phase === 'lost') nav('/pierden');
  }, [room.phase, room.me.role, host]);
}
function Lobby({ host = false }) {
  const { room, action } = useGame(),
    nav = useNavigate();
  host = host || room.me.host;
  usePhaseRoute(host);
  return (
    <div className="page">
      <PageHead
        eyebrow={`SALA ${room.code} / EL EQUIPO`}
        title="La aventura se vive juntos."
        description="Cuando los cuatro viajeros estén listos, la pantalla del museo dará inicio a la misión."
      >
        <div className="big-count">
          {room.players.filter((p) => p.ready).length}
          <span>/ 4 listos</span>
        </div>
      </PageHead>
      <Team room={room} />
      <div className="lobby-bottom panel">
        <div>
          <h2>{storyFor(room.story).name}</h2>
          <p>
            <Clock size={17} /> 10 minutos · Cuatro roles · Una historia
          </p>
        </div>
        {host ? (
          <Button
            disabled={!room.players.every((p) => p.ready) || room.players.length !== 4}
            onClick={async () => {
              if (await action('start')) nav('/fraseMuseo');
            }}
          >
            Iniciar misión <Play size={18} />
          </Button>
        ) : (
          <>
            <span className="waiting">
              <span className="live-dot" /> Esperando al museo
            </span>
            <Link to="/introduccion" className="back">
              Revisar mi rol
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
function Museum() {
  const { session, login, logout, setError } = useGame(),
    nav = useNavigate(),
    [story, setStory] = useState(1),
    [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    try {
      login(await request('/rooms', { story }));
      nav('/induccion');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page museum-setup">
      <div>
        <PageHead
          eyebrow="PANTALLA COMPARTIDA"
          title="Bienvenidos a una nueva experiencia."
          description="Museo Interactivo Lilí. Prepara la pantalla del museo y reúne a cuatro viajeros para rescatar las memorias del territorio."
        />
        <div className="panel form-panel">
          <label>
            Historia de la expedición
            <select value={story} onChange={(e) => setStory(Number(e.target.value))}>
              {stories.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.id.toString().padStart(2, '0')} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            El recorrido empieza con la inducción y la contextualización originales, seguido del
            código para los participantes.
          </p>
          <Button onClick={create} disabled={busy}>
            {busy ? 'Preparando…' : 'Crear sala y comenzar'}
            <ArrowRight size={18} />
          </Button>
          {session?.host && (
            <Link className="back" to="/estadoMuseo">
              Retomar sala {session.code}
            </Link>
          )}
          {session && !session.host && (
            <p className="small muted">
              Ya tienes una sesión de participante en esta pestaña. Abre la pantalla del museo en
              otra pestaña para conservar tu rol.
            </p>
          )}
        </div>
      </div>
      <div className="museum-image">
        <img src="/assets/museum/exhibition.png" alt="Vitrinas arqueológicas del Museo Lilí" />
        <span>
          El territorio guarda historias.
          <br />
          Descubrámoslas juntos.
        </span>
      </div>
    </div>
  );
}
function VideoPage({ kind }) {
  const { room } = useGame(),
    nav = useNavigate(),
    s = storyFor(room?.story);
  const info = {
    induction: ['Inducción', 'induccion/resources/induccion.mp4', '/animacionMuseo'],
    context: [
      'Un viaje a nuestras memorias',
      'AnimacionMuseo/resources/Contextualizacin.mp4',
      '/qrMuseo',
    ],
    story: [
      s.name,
      s.id === 1
        ? 'TematicaMuseo/resources/Cuencos1.mp4'
        : `FraseMuseo/videosSemanas/${s.video}_1.mp4`,
      '/rolesMuseo',
    ],
    ending: [
      'La historia que recuperamos',
      s.id === 1
        ? 'TematicaMuseo2/resources/Cuencos2.mp4'
        : `FraseMuseo/videosSemanas/${s.video}_1.mp4`,
      '/museoTabla',
    ],
  }[kind];
  return (
    <div className="page">
      <PageHead
        eyebrow="MUSEO INTERACTIVO LILÍ"
        title={info[0]}
        description="Miren, escuchen y preparen su siguiente descubrimiento."
      />
      <video
        key={info[1]}
        className="story-video"
        controls
        playsInline
        preload="metadata"
        src={asset(info[1])}
        onEnded={() => nav(info[2])}
      />
      <div className="video-controls">
        <span>Video recuperado de la experiencia original SMIGC</span>
        <Button onClick={() => nav(info[2])}>
          Continuar <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
function RoomQR() {
  const { room, setError } = useGame(),
    nav = useNavigate(),
    [qr, setQr] = useState(''),
    [base, setBase] = useState(location.origin),
    [copied, setCopied] = useState(false);
  const url = base.replace(/\/$/, '') + '/#/?sala=' + room.code;
  useEffect(() => {
    if (room.players.length === 4) nav('/tematicaMuseo', { replace: true });
  }, [room.players.length, nav]);
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#282828', light: '#ffffff' },
    }).then(setQr);
  }, [url]);
  return (
    <div className="page">
      <PageHead
        eyebrow="INVITA A TU EQUIPO"
        title="Cuatro viajeros. Un mismo destino."
        description="Lee el código QR o ingresa el código de la sala desde cada dispositivo."
      />
      <div className="qr-layout">
        <div className="panel qr-card">
          {qr && <img src={qr} alt={`QR para entrar a la sala ${room.code}`} />}
          <span className="eyebrow">CÓDIGO DE LA SALA</span>
          <strong className="room-code-display">{room.code}</strong>
          <button
            className="text-button"
            onClick={() =>
              navigator.clipboard
                .writeText(url)
                .then(() => setCopied(true))
                .catch(() =>
                  setError('No se pudo copiar. Selecciona la dirección que aparece debajo.'),
                )
            }
          >
            <Copy size={16} />
            {copied ? 'Enlace copiado' : 'Copiar enlace de invitación'}
          </button>
          <input aria-label="Enlace de invitación" readOnly value={url} />
        </div>
        <div>
          <Team room={room} />
          <p className="note">
            <Users size={18} />
            {room.players.length} de 4 participantes conectados
          </p>
          <details className="network-settings">
            <summary>Conectar otros dispositivos</summary>
            <p>
              Conecta los móviles a la misma red y usa la dirección de este servidor accesible desde
              ellos.
            </p>
            <label>
              Dirección del servidor
              <input
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder="http://192.168.1.10:4173"
              />
            </label>
          </details>
        </div>
      </div>
    </div>
  );
}
function MuseumRoles() {
  const { room } = useGame(),
    [current, setCurrent] = useState(0),
    [playing, setPlaying] = useState(false),
    audioRef = useRef();
  useEffect(() => {
    if (playing) audioRef.current?.play().catch(() => setPlaying(false));
  }, [current, playing]);
  return (
    <div className="page">
      <PageHead
        eyebrow="CONOZCAN SUS HABILIDADES"
        title="¡Seleccionen sus roles, viajeros!"
        description="Estamos a punto de comenzar."
      />
      <div className="role-cards">
        {roles.map((r, i) => (
          <article
            className={'panel pick-card ' + (playing && current === i ? 'highlight' : '')}
            key={r.id}
          >
            <img src={asset(`Picker/logos/logo${r.image}.png`)} alt="" />
            <h2>{r.name}</h2>
            <p>{r.description}</p>
          </article>
        ))}
      </div>
      <div className="video-controls">
        <audio
          ref={audioRef}
          controls
          src={asset(`RolesMuseo/resources/Narracion${roles[current].audio}.mp3`)}
          onEnded={() => {
            if (current < 3) setCurrent((v) => v + 1);
            else setPlaying(false);
          }}
        />
        <Button
          className="secondary"
          onClick={() => {
            setCurrent(0);
            setPlaying(true);
          }}
        >
          <Volume2 size={18} />
          Escuchar los cuatro roles
        </Button>
        <Link className="button" to="/estadoMuseo">
          Ver el equipo <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
function Game() {
  const { room } = useGame(),
    nav = useNavigate(),
    { role } = useParams();
  useEffect(() => {
    if (room.phase === 'won') nav('/ganan');
    if (room.phase === 'lost') nav('/pierden');
    if (room.phase === 'lobby') nav('/seleccionCargando');
    if (room.me.role && role !== room.me.role) nav('/juego/' + room.me.role);
  }, [room.phase, role, room.me.role]);
  if (room.me.host) return <SharedPlay />;
  const r = roles.find((r) => r.id === room.me.role);
  if (!r) return <RolePicker />;
  return (
    <div className="page game-page">
      <PageHead
        eyebrow={`${r.name.toUpperCase()} / ${storyFor(room.story).name.toUpperCase()}`}
        title={room.phase === 'phrase' ? 'La última pieza de la historia.' : r.verb}
        description={
          room.phase === 'phrase'
            ? 'Reúnanse frente a la pantalla del museo para completar la frase.'
            : {
                guia: 'Rápido, indícale al Huaquero los puntos que se marcan en el mapa.',
                huaquero: 'Busca los símbolos indicados por el Guía y enséñaselos al Intérprete.',
                interprete: 'Encuentra los pares de los símbolos que ha recuperado el Huaquero.',
                antropologo:
                  'Solicita al Intérprete las palabras claves. Reordena las letras y recupera su significado.',
              }[r.id]
        }
      >
        <span className="large-role-icon">
          <RoleIcon role={r} size={40} />
        </span>
      </PageHead>
      {room.phase === 'phrase' ? (
        r.id === 'antropologo' ? (
          <Phrase />
        ) : (
          <div className="panel empty">
            <Check size={42} />
            <h2>Tu parte está completa.</h2>
            <p>El equipo debe ordenar las palabras en la pantalla compartida.</p>
          </div>
        )
      ) : r.id === 'guia' ? (
        <Guide />
      ) : r.id === 'huaquero' ? (
        <Hunter />
      ) : r.id === 'interprete' ? (
        <Memory />
      ) : (
        <Anthropologist />
      )}
      <Progress />
    </div>
  );
}
function Progress() {
  const { room } = useGame();
  return (
    <div className="progress-strip">
      {[
        ['Ubicaciones', room.guided.length],
        ['Símbolos', room.found.length],
        ['Traducciones', room.translated.length],
        ['Palabras', room.solved.length],
      ].map(([label, value], i) => (
        <div key={label}>
          <span>
            0{i + 1} / {label}
            <b>{value}/4</b>
          </span>
          <div className="track">
            <i style={{ width: `${value * 25}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function Guide() {
  const { room, action, now } = useGame(),
    s = storyFor(room.story),
    place = s.places[room.clue],
    positions = [
      [34, 26],
      [45, 29],
      [61, 43],
      [77, 46],
      [77, 57],
    ],
    coords = positions[place - 1];
  return (
    <div className="guide-grid">
      <div className="panel map-panel">
        <div className="map">
          <img src={asset('Mapa/resources/mapamuseolili.png')} alt="Mapa original del Museo Lilí" />
          <div className="map-marker" style={{ left: coords[0] + '%', top: coords[1] + '%' }}>
            <MapPin size={32} />
            <span>{place}</span>
          </div>
        </div>
        <span className="map-caption">
          MAPA DEL MUSEO LILÍ <span>● Ubicación activa</span>
        </span>
      </div>
      <div className="panel clue-card">
        <p className="eyebrow">RASTRO {room.clue + 1} / 4</p>
        <h2>Ubicación {place}</h2>
        <img
          className="clue-symbol"
          src={symbolImage(s.symbols[room.clue])}
          alt={`Símbolo ${s.symbols[room.clue]} que debe encontrar el Huaquero`}
        />
        <p>Indícale al Huaquero dónde buscar este símbolo.</p>
        <strong className="clue-time">
          <Clock size={22} />
          {Math.max(0, Math.ceil((room.clueAt + 30000 - now) / 1000))}
          <small>segundos</small>
        </strong>
        <Button onClick={() => action('guide')}>
          <Search size={18} />
          Buscar otro símbolo
        </Button>
        <p className="small muted">
          Al tocar la lupa confirmas que compartiste esta ubicación. El rastro cambia cada 30
          segundos.
        </p>
        {room.guided.length === 4 && (
          <p className="success-note">
            <Check size={16} />
            Ya compartiste las cuatro ubicaciones.
          </p>
        )}
      </div>
    </div>
  );
}
function CameraPanel() {
  const [stream, setStream] = useState(null),
    [error, setError] = useState(''),
    ref = useRef(),
    streamRef = useRef();
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
    streamRef.current = stream;
  }, [stream]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);
  async function open() {
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          'La cámara necesita HTTPS o localhost. Puedes seguir usando el tablero de símbolos.',
        );
      setStream(
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        }),
      );
      setError('');
    } catch (e) {
      setError(e.message || 'No se pudo abrir la cámara. Revisa el permiso del navegador.');
    }
  }
  return (
    <div className="camera-panel">
      {stream ? (
        <>
          <video ref={ref} autoPlay muted playsInline />
          <Button
            className="secondary"
            onClick={() => {
              stream.getTracks().forEach((t) => t.stop());
              setStream(null);
            }}
          >
            Cerrar cámara <X size={16} />
          </Button>
          <p>Observa la pieza y selecciona su símbolo en el tablero.</p>
        </>
      ) : (
        <>
          <Camera size={32} />
          <h3>Explora con tu cámara</h3>
          <p>Observa las piezas siguiendo las indicaciones del Guía.</p>
          <Button className="secondary" onClick={open}>
            Abrir cámara <Camera size={17} />
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
    </div>
  );
}
function Hunter() {
  const { room, action } = useGame();
  return (
    <div className="hunter-grid">
      <div className="panel">
        <div className="panel-heading">
          <h2>Busca los símbolos</h2>
          <span>{room.found.length} / 4 encontrados</span>
        </div>
        <div className="symbol-grid">
          {[3, 9, 15, 12, 11, 6, 20, 5, 1, 14, 4, 19, 7, 16, 2, 18, 8, 17, 10, 13].map((n) => (
            <button
              key={n}
              className={'symbol-tile ' + (room.found.includes(n) ? 'found' : '')}
              aria-label={`Símbolo ${n}${room.found.includes(n) ? ', encontrado' : ''}`}
              disabled={room.found.includes(n)}
              onClick={() => action('find', { symbol: n })}
            >
              <img src={symbolImage(n)} alt="" />
              {room.found.includes(n) && <Check size={17} />}
            </button>
          ))}
        </div>
      </div>
      <CameraPanel />
    </div>
  );
}
function Memory() {
  const { room, action } = useGame(),
    [tab, setTab] = useState('memory');
  const s = storyFor(room.story);
  return (
    <>
      <div className="tabs">
        <button aria-pressed={tab === 'memory'} onClick={() => setTab('memory')}>
          <Layers size={18} />
          Encontrar pares
        </button>
        <button aria-pressed={tab === 'translations'} onClick={() => setTab('translations')}>
          <Fingerprint size={18} />
          Traductor <span>{room.translated.length}</span>
        </button>
      </div>
      {tab === 'memory' ? (
        <div className="panel">
          <div className="panel-heading">
            <h2>La memoria de los símbolos</h2>
            <span>Revela dos cartas por turno</span>
          </div>
          <div className="memory-grid">
            {room.deck.map((card) => (
              <button
                data-card={card.index}
                aria-label={`Carta ${card.index + 1}${card.symbol ? ', símbolo ' + card.symbol : ''}`}
                aria-pressed={!!card.symbol}
                key={card.index}
                className={
                  'memory-card ' +
                  (card.symbol ? 'revealed ' : '') +
                  (card.matched ? 'matched' : '')
                }
                disabled={card.matched}
                onClick={() => action('flip', { index: card.index })}
              >
                {card.symbol ? (
                  <img src={symbolImage(card.symbol)} alt={`Símbolo ${card.symbol}`} />
                ) : (
                  <>
                    <Fingerprint size={37} strokeWidth={1} />
                    <span>MUSEO LILÍ</span>
                  </>
                )}
              </button>
            ))}
          </div>
          <p className="note">
            <Lock size={16} />
            Solo puedes traducir los símbolos que el Huaquero ya encontró. Los demás pares vuelven a
            ocultarse.
          </p>
        </div>
      ) : (
        <div className="translation-grid">
          {s.symbols.map((n, i) => (
            <div className="panel translation-card" key={n}>
              <img src={symbolImage(n)} alt={`Símbolo ${n}`} />
              {room.anagrams[i] ? (
                <>
                  <strong>{room.anagrams[i]}</strong>
                  <p>Comparte estas letras con el Antropólogo.</p>
                </>
              ) : (
                <>
                  <Lock size={22} />
                  <p>
                    {room.found.includes(n)
                      ? 'Encuentra el par para traducirlo.'
                      : 'El Huaquero aún no lo ha encontrado.'}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function Anthropologist() {
  const { room, action } = useGame();
  return (
    <div className="anagram-grid">
      {[0, 1, 2, 3].map((i) => (
        <Anagram key={i} index={i} room={room} action={action} />
      ))}
    </div>
  );
}
function Anagram({ index: i, room, action }) {
  const [value, setValue] = useState('');
  const done = room.solved.includes(i),
    word = room.anagrams[i];
  return (
    <form
      className={'panel anagram-card ' + (done ? 'solved' : '')}
      onSubmit={(e) => {
        e.preventDefault();
        action('solve', { index: i, answer: value });
      }}
    >
      <span className="eyebrow">
        PALABRA 0{i + 1}
        {done && <Check size={20} />}
      </span>
      {word ? (
        <div className="anagram-letters">
          {word.split('').map((letter, j) => (
            <span key={j}>{letter}</span>
          ))}
        </div>
      ) : (
        <div className="locked-word">
          <Lock size={32} />
          <p>Esperando la traducción del Intérprete</p>
        </div>
      )}
      <label htmlFor={'answer-' + i}>¿Qué palabra se esconde?</label>
      <input
        id={'answer-' + i}
        name="answer"
        disabled={!word || done}
        required
        value={done ? storyFor(room.story).answers[i] : value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        placeholder="Ordena las letras"
      />
      <Button className="secondary" disabled={!word || done}>
        {done ? 'Palabra recuperada' : 'Comprobar'}
        {done ? <Check size={16} /> : <ArrowRight size={16} />}
      </Button>
    </form>
  );
}
function SharedPlay() {
  const { room } = useGame(),
    nav = useNavigate();
  useEffect(() => {
    if (room.phase === 'won') nav('/gananMuseo');
    if (room.phase === 'lost') nav('/pierden');
  }, [room.phase]);
  if (room.phase === 'lobby') return <Lobby host />;
  return (
    <div className="page">
      <PageHead
        eyebrow={`${storyFor(room.story).name.toUpperCase()} / MISIÓN COMPARTIDA`}
        title={room.phase === 'phrase' ? 'Completa la frase.' : 'Apresúrense, el tiempo corre…'}
        description={
          room.phase === 'phrase'
            ? 'Las palabras que recuperaron guardan la memoria de esta historia. Ordénenlas juntos.'
            : 'Revisen sus celulares. Cada descubrimiento acerca al equipo a la historia.'
        }
      />
      {room.phase === 'phrase' ? (
        <Phrase />
      ) : (
        <>
          <Team room={room} />
          <Progress />
          <div className="panel shared-wait">
            <Compass size={50} />
            <h2>Las cuatro miradas se necesitan.</h2>
            <p>
              El Guía localiza. El Huaquero encuentra. El Intérprete traduce. El Antropólogo
              descifra.
            </p>
            <strong>
              {room.score} <small>puntos del equipo</small>
            </strong>
          </div>
        </>
      )}
    </div>
  );
}
function Phrase() {
  const { room, action } = useGame(),
    s = storyFor(room.story),
    [selected, setSelected] = useState(null);
  const slots = room.phrase;
  const words = [...room.words].sort((a, b) => a.localeCompare(b));
  const place = (word, i) => {
    if (!word || !words.includes(word)) return;
    action('placeWord', { word, index: i });
    setSelected(null);
  };
  return (
    <div className="panel phrase-panel">
      <span className="eyebrow">LA HISTORIA RECUPERADA</span>
      <div className="sentence">
        {s.sentence.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < 4 && (
              <button
                className={'word-slot ' + (slots[i] ? 'filled' : '')}
                aria-label={`Espacio ${i + 1}${slots[i] ? ': ' + slots[i] : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  place(e.dataTransfer.getData('text/plain'), i);
                }}
                onClick={() =>
                  selected ? place(selected, i) : action('placeWord', { word: null, index: i })
                }
              >
                {slots[i] || (
                  <>
                    <span>0{i + 1}</span> Coloca una palabra
                  </>
                )}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="word-bank">
        {words.map((word) => (
          <button
            key={word}
            draggable={!slots.includes(word)}
            disabled={slots.includes(word)}
            className={selected === word ? 'selected' : ''}
            onDragStart={(e) => e.dataTransfer.setData('text/plain', word)}
            onClick={() => setSelected(word)}
          >
            {word}
          </button>
        ))}
      </div>
      <p className="muted small">
        Arrastra cada palabra a su espacio, o selecciónala y toca el espacio. Toca una palabra
        colocada para retirarla.
      </p>
      <div className="phrase-actions">
        <button className="text-button" onClick={() => action('resetPhrase')}>
          <RotateCcw size={16} />
          Reordenar
        </button>
        <Button disabled={slots.some((x) => !x)} onClick={() => action('phrase', { words: slots })}>
          Comprobar la historia <ArrowRight size={19} />
        </Button>
      </div>
    </div>
  );
}
function Result({ host = false }) {
  const { room, action, logout } = useGame(),
    nav = useNavigate(),
    [rating, setRating] = useState(0),
    [comment, setComment] = useState('');
  host = host || room.me.host;
  const won = room.phase === 'won';
  if (!['won', 'lost'].includes(room.phase)) return <Completion />;
  return (
    <div className="page result-page">
      <span className="result-icon">{won ? <Trophy size={44} /> : <Clock size={44} />}</span>
      <PageHead
        eyebrow={won ? 'MISIÓN CUMPLIDA' : 'EL TIEMPO SE TERMINÓ'}
        title={won ? '¡La memoria sigue viva!' : 'Cada intento deja una huella.'}
        description={
          won
            ? '¡Viajeros!, han encontrado la historia de los pueblos amerindios. ¡Los han salvado del olvido!'
            : 'La misión no ha sido completada con éxito. Reúnan al equipo para una nueva expedición.'
        }
      />
      <div className="result-stats">
        <div>
          <strong>{format((room.endedAt - room.startedAt) / 1000)}</strong>
          <span>Tiempo del recorrido</span>
        </div>
        <div>
          <strong>{room.score}</strong>
          <span>Puntos del equipo</span>
        </div>
        <div>
          <strong>{room.solved.length} / 4</strong>
          <span>Palabras recuperadas</span>
        </div>
      </div>
      {won && (
        <div className="badges">
          {storyFor(room.story).symbols.map((n) => (
            <img src={symbolImage(n)} key={n} alt={`Insignia del símbolo ${n}`} />
          ))}
        </div>
      )}
      {host ? (
        <div className="result-links">
          {won && (
            <Link className="button" to="/tematicaMuseo2">
              Ver la historia completa <Play size={18} />
            </Link>
          )}
          <Link className="button secondary" to="/museoTabla">
            Tiempo del recorrido <ArrowRight size={18} />
          </Link>
          <Link className="back" to="/museo">
            Crear otra sala
          </Link>
        </div>
      ) : room.me.feedback ? (
        <div className="panel feedback-thanks">
          <Check size={30} />
          <h2>Gracias por compartir tu experiencia.</h2>
          <Link to="/museoTabla" className="button secondary">
            Ver resultados
          </Link>
          <button
            className="text-button"
            onClick={() => {
              logout();
              nav('/');
            }}
          >
            Volver al inicio
          </button>
        </div>
      ) : (
        <form
          className="panel feedback-form"
          onSubmit={async (e) => {
            e.preventDefault();
            await action('feedback', { rating, comment });
          }}
        >
          <h2>Califica tu experiencia</h2>
          <div className="stars" role="group" aria-label="Calificación de la experiencia">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                aria-label={`${n} estrellas`}
                aria-pressed={rating === n}
                onClick={() => setRating(n)}
              >
                <Star size={31} fill={n <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <label>
            Deja un comentario
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1500}
              placeholder="¿Qué descubriste en esta aventura?"
            />
          </label>
          <Button disabled={!rating}>
            Enviar valoración <ArrowRight size={18} />
          </Button>
        </form>
      )}
    </div>
  );
}
function Scores({ best = false }) {
  const { room, logout } = useGame(),
    [board, setBoard] = useState([]),
    [error, setError] = useState('');
  useEffect(() => {
    if (best)
      request('/leaderboard')
        .then(setBoard)
        .catch((e) => setError(e.message));
  }, [best]);
  return (
    <div className="page">
      <PageHead
        eyebrow="HUELLAS DE LA EXPEDICIÓN"
        title={best ? 'Los mejores tiempos.' : 'Tiempo del recorrido.'}
        description={
          best
            ? 'Partidas completadas en este servidor, ordenadas por tiempo.'
            : 'El resultado de cuatro miradas que trabajaron juntas.'
        }
      />
      {error && <p role="alert">{error}</p>}
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              {(best
                ? ['Posición', 'Sala', 'Historia', 'Tiempo', 'Puntos']
                : ['Viajero', 'Rol', 'Tiempo', 'Estado']
              ).map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {best
              ? board.map((r, i) => (
                  <tr key={r.code}>
                    <td>{String(i + 1).padStart(2, '0')}</td>
                    <td>{r.code}</td>
                    <td>{storyFor(r.story).name}</td>
                    <td>{format(r.seconds)}</td>
                    <td>{r.score}</td>
                  </tr>
                ))
              : room?.players.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{roles.find((r) => r.id === p.role)?.name || 'Sin rol'}</td>
                    <td>{p.finishedAt ? format((p.finishedAt - room.startedAt) / 1000) : '—'}</td>
                    <td>{p.finishedAt ? 'Completado' : 'Pendiente'}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        {best && !board.length && (
          <p className="empty-table">
            Aún no hay expediciones completadas. La próxima puede ser la tuya.
          </p>
        )}
      </div>
      <div className="video-controls">
        <Link to={best ? '/museo' : '/museoTablaMejorT'} className="button">
          {best ? 'Preparar otra expedición' : 'Ver mejores tiempos'}
          <ArrowRight size={18} />
        </Link>
        {room && !room.me.host && (
          <Link to={room.phase === 'won' ? '/ganan' : '/pierden'} className="back">
            Valorar la experiencia
          </Link>
        )}
      </div>
    </div>
  );
}
function Retry() {
  const { room } = useGame();
  return (
    <div className="page narrow">
      <PageHead
        eyebrow="UN NUEVO INTENTO"
        title="La frase aún no es correcta."
        description="Conversen, revisen las palabras y vuelvan a intentarlo."
      />
      <Link className="button" to={room.me.host ? '/fraseMuseo' : '/juego/antropologo'}>
        Volver a la frase <RotateCcw size={18} />
      </Link>
    </div>
  );
}
function Completion() {
  const { room } = useGame();
  return (
    <div className="empty">
      <Check size={42} />
      <h1>Consulta el estado de tu expedición</h1>
      <Link
        className="button"
        to={
          room.me.host ? '/fraseMuseo' : room.me.role ? '/juego/' + room.me.role : '/introduccion'
        }
      >
        Continuar <ArrowRight size={18} />
      </Link>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Provider>
      <Shell />
    </Provider>
  </HashRouter>,
);
