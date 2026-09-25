// JavaScript Document
// Datos mockeados de StudyFlow (sin backend). Se cargan antes de menu.js.
// Días de la semana: 0 = Lun ... 6 = Dom. Las fechas de entregas son relativas a hoy.

var ICONO_SVG = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

var DATOS = {

  // Credenciales de prueba para el login
  usuario: {
    nombre: "Valentina Rueda",
    correo: "user@gmail.com",
    password: "pass123",
    rol: "Estudiante"
  },

  semestre: "2024-II",
  pomodorosHechos: 14,

  materias: [
    {
      id: "mate201", nombre: "Cálculo Diferencial", codigo: "MATE-201", profesor: "Sandra Rueda",
      dias: [0, 2], inicio: "08:00", fin: "10:00", creditos: 4, pomodoros: 6,
      color: "lila", claseIcono: "color-lila",
      icono: "Σ"
    },
    {
      id: "isis102", nombre: "Programación III", codigo: "ISIS-102", profesor: "Carlos Mendoza",
      dias: [1, 3], inicio: "12:00", fin: "14:00", creditos: 4, pomodoros: 4,
      color: "coral", claseIcono: "color-coral",
      icono: '<svg ' + ICONO_SVG + '><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>'
    },
    {
      id: "mate103", nombre: "Álgebra Lineal", codigo: "MATE-103", profesor: "Elena Restrepo",
      dias: [0, 2, 4], inicio: "10:00", fin: "11:30", creditos: 4, pomodoros: 5,
      color: "gris", claseIcono: "color-gris",
      icono: '<svg ' + ICONO_SVG + '><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/></svg>'
    },
    {
      id: "fisi101", nombre: "Física General", codigo: "FISI-101", profesor: "Roberto Gómez",
      dias: [2, 4], inicio: "14:00", fin: "16:00", creditos: 4, pomodoros: 4,
      color: "aqua", claseIcono: "color-aqua",
      icono: '<svg ' + ICONO_SVG + '><path d="M9 2v6.5L4 20a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-5-11.5V2"/><path d="M8.5 2h7"/><path d="M6.5 15h11"/></svg>'
    }
  ],

  // diasDesdeHoy: 1 = mañana, 2 = pasado mañana, etc.
  entregas: [
    { id: 1, titulo: "Parcial Unidad 3",       materia: "mate201", prioridad: "alta",  pomodoros: 4, diasDesdeHoy: 1, completada: false },
    { id: 2, titulo: "Proyecto",               materia: "isis102", prioridad: "media", pomodoros: 2, diasDesdeHoy: 2, completada: false },
    { id: 3, titulo: "Tarea",                  materia: "fisi101", prioridad: "media", pomodoros: 2, diasDesdeHoy: 3, completada: false },
    { id: 4, titulo: "Quiz Espacios Vectoriales", materia: "mate103", prioridad: "media", pomodoros: 1, diasDesdeHoy: 6, completada: false },
    { id: 5, titulo: "Informe de laboratorio", materia: "fisi101", prioridad: "alta",  pomodoros: 3, diasDesdeHoy: 9, completada: false }
  ],

  // Bloques de estudio aceptados en Sugerencias: { entregaId, fecha: "AAAA-MM-DD", inicio: 9, fin: 11 }
  bloques: []
};

// Las entregas agregadas o completadas durante la sesión se conservan entre pantallas.
try {
  var entregasGuardadas = sessionStorage.getItem("studyflowEntregas");
  if (entregasGuardadas) { DATOS.entregas = JSON.parse(entregasGuardadas); }
} catch (e) {}
try {
  var bloquesGuardados = sessionStorage.getItem("studyflowBloques");
  if (bloquesGuardados) { DATOS.bloques = JSON.parse(bloquesGuardados); }
} catch (e) {}
try {
  var materiasGuardadas = sessionStorage.getItem("studyflowMaterias");
  if (materiasGuardadas) { DATOS.materias = JSON.parse(materiasGuardadas); }
} catch (e) {}
