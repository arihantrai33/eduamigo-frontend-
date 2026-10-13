import {
  CheckCircle2, XCircle, AlertTriangle, Bus, MessageCircle, Bell, School, User, ClipboardList, House, BookOpen, BarChart3, Search,
  Trash2, FileText, Megaphone, Calendar, Upload, Wallet, Users, Pin, Phone, Hourglass, CreditCard, Backpack, Inbox, GraduationCap,
  Zap, MapPin, Paperclip, TreePalm, IdCard, MonitorSmartphone, LogOut, FolderOpen, FolderKanban, Sun, Moon, CalendarDays, Banknote, Pencil,
  Clock, AlarmClock, Umbrella, Trophy, Lock, Ban, Bot, Settings, Handshake, Flag, Microscope, CloudSun, KeyRound, Timer, Target,
  Printer, TrafficCone, Radio, LifeBuoy, Ruler, FlaskConical, Globe, ArrowUp, Circle, Pause, Map, Tag, Folder, Link, Briefcase,
  RefreshCw, Landmark, Book, Package, ShieldCheck, Sunrise, HelpCircle, PersonStanding, Siren, Presentation,
  ArrowLeft, ArrowRight, SendHorizontal, X,
} from "lucide-react";

// Line icons that replace the emojis the app used to show. An icon takes the size and colour of the text
// around it (1em, currentColor), so it can stand where the emoji stood. 📵 and 🚪 were used for
// "sign out on all devices" and "log out", hence their icons. The arrow, send and close characters of
// icon-only buttons (← ➤ ×) map here too; such a button names itself with aria-label.
const ICONS = {
  "✅": CheckCircle2, "❌": XCircle, "⚠": AlertTriangle, "🚨": Siren, "🆘": Siren, "⛔": Ban, "🔒": Lock, "🔑": KeyRound, "🛡": ShieldCheck,
  "🚌": Bus, "🚦": TrafficCone, "📍": MapPin, "🗺": Map, "🏁": Flag,
  "💬": MessageCircle, "🔔": Bell, "📢": Megaphone, "📣": Megaphone, "📞": Phone, "📵": MonitorSmartphone, "📡": Radio, "🔗": Link,
  "🏫": School, "🏛": Landmark, "🎓": GraduationCap, "🧑‍🎓": GraduationCap, "👩‍🏫": Presentation, "👨‍🏫": Presentation, "🎒": Backpack,
  "👤": User, "👨": User, "👩": User, "👧": User, "👦": User, "🧒": User, "👥": Users, "👨‍👩‍👧": Users, "👩‍👧": Users, "🤝": Handshake, "🏃": PersonStanding,
  "📋": ClipboardList, "📝": FileText, "📄": FileText, "📖": BookOpen, "📚": BookOpen, "📕": Book, "📗": Book, "✏": Pencil,
  "📂": FolderOpen, "📁": Folder, "🗂": FolderKanban, "📎": Paperclip, "📌": Pin, "🏷": Tag, "📦": Package, "🖨": Printer,
  "📤": Upload, "⬆": ArrowUp, "📭": Inbox, "🔍": Search, "🗑": Trash2, "⚙": Settings, "🔄": RefreshCw, "🪪": IdCard,
  "📊": BarChart3, "🎯": Target, "🏆": Trophy, "⚡": Zap, "💼": Briefcase,
  "💰": Wallet, "💳": CreditCard, "💵": Banknote,
  "📅": Calendar, "🗓": CalendarDays, "🕐": Clock, "⏰": AlarmClock, "⏱": Timer, "⏳": Hourglass, "⏸": Pause,
  "🏠": House, "🚪": LogOut, "🌴": TreePalm, "🏖": Umbrella, "☀": Sun, "🌙": Moon, "🌤": CloudSun, "🌅": Sunrise, "🌍": Globe, "🌐": Globe,
  "🤖": Bot, "🔬": Microscope, "⚗": FlaskConical, "📐": Ruler, "🛟": LifeBuoy, "❓": HelpCircle,
  "🟢": Circle, "🟡": Circle, "🔴": Circle,
  "←": ArrowLeft, "→": ArrowRight, "➤": SendHorizontal, "×": X, "✕": X, "✖": X,
};
// Coloured dots keep their meaning (online / pending / alert) as a filled circle.
const DOT_COLORS = { "🟢": "#16A34A", "🟡": "#EAB308", "🔴": "#DC2626" };

const clean = (e) => String(e || "").replace(/\uFE0F/g, "");

export default function Glyph({ e, size = "1em", strokeWidth = 2, style }) {
  const key = clean(e);
  const Icon = ICONS[key];
  if (!Icon) return null;
  const dot = DOT_COLORS[key];
  return (
    <Icon
      size={dot ? "0.7em" : size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      style={{ verticalAlign: "-0.125em", flexShrink: 0, ...(dot ? { color: dot, fill: dot } : {}), ...style }}
    />
  );
}
