const Icon = ({ d, size = 20, stroke = 'currentColor', fill = 'none', sw = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

export const IconCalendar = (p) => <Icon {...p}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></Icon>;
export const IconList     = (p) => <Icon {...p}><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/></Icon>;
export const IconUser     = (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/></Icon>;
export const IconChevR    = (p) => <Icon {...p} d="M9 5l7 7-7 7" />;
export const IconChevL    = (p) => <Icon {...p} d="M15 5l-7 7 7 7" />;
export const IconPlus     = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
export const IconClose    = (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>;
export const IconCheck    = (p) => <Icon {...p} d="M5 13l4 4 10-10" />;
export const IconClock    = (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Icon>;
export const IconRepeat   = (p) => <Icon {...p}><path d="M4 9l3-3h12v5M20 15l-3 3H5v-5"/></Icon>;
export const IconLock     = (p) => <Icon {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></Icon>;
export const IconMail     = (p) => <Icon {...p}><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M4 7l8 6 8-6"/></Icon>;
export const IconTrash    = (p) => <Icon {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></Icon>;
export const IconBall     = ({ size = 16, color = '#D4E04A' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill={color}/>
    <path d="M3 8c5 1 13 1 18 0M3 16c5-1 13-1 18 0" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
  </svg>
);
