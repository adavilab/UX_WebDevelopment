$(document).ready(function ($) {

  // ============================================================
  // 1. VARIABLES DE CONTROL DE ESTADO
  // ============================================================

  var calendarioConectado = true; // estado inicial mostrado en Perfil
  var urlCalendario = "https://calendar.google.com/calendar/ical/user%40gmail.com/public/basic.ics"; // feed mockeado
  try {
    var calendarioGuardado = JSON.parse(sessionStorage.getItem("studyflowCalendario"));
    if (calendarioGuardado) {
      calendarioConectado = calendarioGuardado.conectado;
      urlCalendario = calendarioGuardado.url;
    }
  } catch (e) {}
  var vistaCalendarioActual = "semana"; // "semana" | "mes"
  var demoraNavegacion = 700; // ms de espera simulada antes de navegar
  var entregaEditandoId = null; // id de la entrega que se edita en nueva-entrega.html
  var semillaSugerencias = 0; // cambia al pulsar "Regenerar"
  var rechazadas = []; // ids de entregas cuya sugerencia se rechazó
  try {
    var sugerenciasGuardadas = JSON.parse(sessionStorage.getItem("studyflowSugerencias"));
    if (sugerenciasGuardadas) {
      semillaSugerencias = sugerenciasGuardadas.semilla;
      rechazadas = sugerenciasGuardadas.rechazadas;
    }
  } catch (e) {}
  var inicioSemana = lunesDe(new Date()); // lunes de la semana mostrada en la vista Semana
  var desplazamientoMes = 0; // meses respecto al mes actual (vista Mes)
  var nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  var valoresDias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  var nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  var nombresDiasLargos = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  // ============================================================
  // 2. FUNCIONES (solo se ejecutan cuando se dispara un evento)
  // ============================================================

  // --- Validación genérica de un campo de texto/email no vacío ---
  function validarCampoObligatorio($campo, $input) {
    if ($.trim($input.val()) === "") {
      $campo.addClass("campo-error");
      return false;
    }
    $campo.removeClass("campo-error");
    return true;
  }

  function validarCorreo($campo, $input) {
    var patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patron.test($.trim($input.val()))) {
      $campo.addClass("campo-error");
      return false;
    }
    $campo.removeClass("campo-error");
    return true;
  }

  // --- Navega a otra pantalla simulando una breve carga ---
  function navegarCon(destino, $boton) {
    if ($boton && $boton.length) {
      $boton.addClass("cargando").prop("disabled", true);
    }
    setTimeout(function () {
      window.location.href = destino;
    }, demoraNavegacion);
  }

  // --- Sesión simulada (sessionStorage) ---
  function guardarSesion(nombre, correo) {
    try {
      sessionStorage.setItem("studyflowUsuario", JSON.stringify({ nombre: nombre, correo: correo, rol: "Estudiante" }));
    } catch (e) {}
  }

  function obtenerSesion() {
    try {
      var guardado = sessionStorage.getItem("studyflowUsuario");
      if (guardado) { return JSON.parse(guardado); }
    } catch (e) {}
    return DATOS.usuario;
  }

  function iniciales(nombre) {
    var partes = $.trim(nombre).split(/\s+/);
    var texto = partes[0].charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "");
    return texto.toUpperCase();
  }

  // --- Pinta el usuario en barra superior y perfil ---
  function pintarUsuario() {
    var usuario = obtenerSesion();
    $(".nombre-usuario, .nombre-perfil").text(usuario.nombre);
    $(".avatar").text(iniciales(usuario.nombre));
    $(".correo-perfil").text(usuario.correo);
  }

  function buscarMateria(id) {
    return $.grep(DATOS.materias, function (m) { return m.id === id; })[0];
  }

  function horasDe(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) + parseInt(p[1], 10) / 60;
  }

  function duracionMateria(m) {
    return horasDe(m.fin) - horasDe(m.inicio);
  }

  function textoDias(dias) {
    return $.map(dias, function (d) { return nombresDias[d]; }).join(", ");
  }

  function fechaEntrega(entrega) {
    var fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() + entrega.diasDesdeHoy);
    return fecha;
  }

  function etiquetaFecha(entrega) {
    if (entrega.diasDesdeHoy === 0) { return "Hoy"; }
    if (entrega.diasDesdeHoy === 1) { return "Mañana"; }
    var fecha = fechaEntrega(entrega);
    var indice = (fecha.getDay() + 6) % 7;
    if (entrega.diasDesdeHoy < 7) { return nombresDiasLargos[indice]; }
    return nombresDias[indice] + " " + fecha.getDate() + " " + nombresMeses[fecha.getMonth()].slice(0, 3).toLowerCase();
  }

  // --- Materias: tarjetas resumen, lista y entregas ---
  function pintarMaterias() {
    var materias = DATOS.materias;
    var creditos = 0, horas = 0, pomodoros = 0;
    $.each(materias, function (i, m) {
      creditos += m.creditos;
      horas += duracionMateria(m) * m.dias.length;
      pomodoros += m.pomodoros;
    });
    var porcentaje = Math.round(DATOS.pomodorosHechos / pomodoros * 100);

    $("#resumenTotalMaterias").text(materias.length);
    $("#resumenSemestre").text("Semestre " + DATOS.semestre + " • " + creditos + " créditos");
    $("#resumenHoras").text(horas + " h semanales");
    $("#resumenPomodoros").html(DATOS.pomodorosHechos + ' <span class="unidad">/ ' + pomodoros + ' Pomodoros</span>');
    $("#resumenBarra").css("width", porcentaje + "%");
    $("#resumenPorcentaje").text(porcentaje + "% completado");
    $("#resumenRestantes").text((pomodoros - DATOS.pomodorosHechos) + " restantes");
    $("#contadorMaterias").text(materias.length + " Activas");

    var html = "";
    $.each(materias, function (i, m) {
      html += '<article class="fila-materia">' +
        '<div class="icono-materia ' + m.claseIcono + '" aria-hidden="true">' + m.icono + '</div>' +
        '<div class="info-materia">' +
          '<p class="nombre-materia">' + m.nombre + ' <span class="chip-codigo">' + m.codigo + '</span></p>' +
          '<p class="meta-materia"><span>Profesor: <strong>' + (m.profesor || "Sin asignar") + '</strong></span>' +
          '<span>' + textoDias(m.dias) + ' <strong>' + m.inicio + ' - ' + m.fin + '</strong></span></p>' +
        '</div>' +
        '<div class="pomodoros-materia"><p class="etiqueta">Pomodoros est.</p>' +
        '<p class="valor"><span class="punto"></span>' + m.pomodoros + ' esta semana</p></div>' +
        '</article>';
    });
    $("#listaMaterias").html(html);

    var pendientes = $.grep(DATOS.entregas, function (e) { return !e.completada; });
    pendientes.sort(function (a, b) { return a.diasDesdeHoy - b.diasDesdeHoy; });
    var htmlEntregas = "";
    $.each(pendientes, function (i, e) {
      var m = buscarMateria(e.materia);
      var alta = e.prioridad === "alta";
      htmlEntregas += '<article class="tarjeta-entrega" data-id="' + e.id + '">' +
        '<div class="cabecera-entrega"><span class="chip-prioridad' + (alta ? ' prioridad-alta' : '') + '">Prioridad ' + e.prioridad + '</span>' +
        '<span class="pomodoros-entrega">' + e.pomodoros + ' Pomodoros</span></div>' +
        '<h3><a href="detalle-actividad.html?id=' + e.id + '">' + e.titulo + '</a></h3>' +
        '<p class="materia-entrega">' + m.nombre + ' • ' + m.codigo + '</p>' +
        '<div class="pie-entrega"><span class="chip-fecha' + (e.diasDesdeHoy <= 1 ? ' fecha-destacada' : '') + '">' + etiquetaFecha(e) + '</span>' +
        '<button type="button" class="boton-check" aria-label="Marcar como completada"></button></div>' +
        '</article>';
    });
    $("#listaEntregas").html(htmlEntregas);
  }

  // --- Lunes (00:00) de la semana que contiene una fecha ---
  function lunesDe(fecha) {
    var lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    return lunes;
  }

  // --- Reparte en columnas los eventos que se superponen (como Google Calendar) ---
  function asignarColumnas(eventos) {
    eventos.sort(function (a, b) { return a.inicio - b.inicio || b.fin - a.fin; });
    var grupo = [], finGrupo = -1, columnasFin = [];

    function cerrarGrupo() {
      var total = columnasFin.length;
      $.each(grupo, function (i, ev) {
        ev.columnas = total;
        // como Google Calendar: si las columnas de la derecha están libres, el evento se ensancha
        ev.ancho = 1;
        for (var c = ev.columna + 1; c < total; c++) {
          var ocupada = $.grep(grupo, function (otro) {
            return otro.columna === c && otro.inicio < ev.fin && otro.fin > ev.inicio;
          }).length;
          if (ocupada) { break; }
          ev.ancho++;
        }
      });
      grupo = [];
      columnasFin = [];
    }

    $.each(eventos, function (i, ev) {
      if (grupo.length && ev.inicio >= finGrupo) { cerrarGrupo(); }
      var columna = 0;
      while (columna < columnasFin.length && columnasFin[columna] > ev.inicio) { columna++; }
      columnasFin[columna] = ev.fin;
      ev.columna = columna;
      grupo.push(ev);
      finGrupo = grupo.length === 1 ? ev.fin : Math.max(finGrupo, ev.fin);
    });
    cerrarGrupo();
  }

  // --- Calendario: vista Semana (clases semanales + bloques de estudio de esa semana) ---
  function pintarSemana() {
    var horaInicio = 8, horaFin = 17;
    $.each(DATOS.materias, function (i, m) {
      horaInicio = Math.min(horaInicio, Math.floor(horasDe(m.inicio)));
      horaFin = Math.max(horaFin, Math.ceil(horasDe(m.fin)) - 1);
    });
    var html = "";
    var lunes = inicioSemana;
    var domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6);

    $("#gridSemana .celda-encabezado").each(function (i) {
      if (i > 0) {
        var dia = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i - 1);
        $(this).text(nombresDias[i - 1].toUpperCase() + " " + dia.getDate());
      }
    });
    if (vistaCalendarioActual === "semana") {
      var mismoMes = lunes.getMonth() === domingo.getMonth();
      $("#mesActual").text(lunes.getDate() + (mismoMes ? "" : " " + nombresMeses[lunes.getMonth()].slice(0, 3)) + " – " +
        domingo.getDate() + " " + nombresMeses[domingo.getMonth()].slice(0, 3) + " " + domingo.getFullYear());
    }
    $("#gridSemana").children().not(".celda-encabezado").remove();
    // Eventos de cada día (clases + bloques de estudio), con columnas para los que se superponen
    var eventosPorDia = [];
    for (var dia = 0; dia < 7; dia++) {
      var iso = fechaISO(new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + dia));
      var eventos = [];
      $.each(DATOS.materias, function (i, m) {
        if ($.inArray(dia, m.dias) !== -1) {
          eventos.push({
            inicio: horasDe(m.inicio), fin: horasDe(m.fin), etiqueta: "div", clase: "evento-" + m.color, atributos: "",
            contenido: '<strong>' + m.nombre + '</strong>Clase • ' + m.inicio + ' - ' + m.fin
          });
        }
      });
      $.each(DATOS.bloques, function (i, b) {
        var entrega = buscarEntrega(b.entregaId);
        if (b.fecha === iso && entrega) {
          eventos.push({
            inicio: b.inicio, fin: b.fin, etiqueta: "a", clase: "evento-estudio",
            atributos: ' href="nueva-entrega.html?id=' + entrega.id + '" title="' + entrega.titulo + '"',
            contenido: '<strong>' + buscarMateria(entrega.materia).nombre + '</strong>Estudio • ' + textoHora(b.inicio) + ' - ' + textoHora(b.fin)
          });
        }
      });
      asignarColumnas(eventos);
      eventosPorDia.push(eventos);
    }

    for (var h = horaInicio; h <= horaFin; h++) {
      html += '<div class="celda-hora">' + ("0" + h).slice(-2) + ':00</div>';
      for (var d = 0; d < 7; d++) {
        html += '<div class="celda-dia">';
        $.each(eventosPorDia[d], function (i, ev) {
          if (Math.floor(ev.inicio) !== h) { return; }
          var top = Math.round((ev.inicio - h) * 64 + 2);
          var alto = Math.round((ev.fin - ev.inicio) * 64);
          html += '<' + ev.etiqueta + ' class="evento ' + ev.clase + (ev.columnas > 1 ? ' evento-compacto' : '') + '"' + ev.atributos +
            ' style="height: ' + alto + 'px; top: ' + top + 'px; right: auto; left: calc(' + (ev.columna * 100 / ev.columnas) + '% + 3px); width: calc(' + (100 * ev.ancho / ev.columnas) + '% - 6px);">' +
            ev.contenido + '</' + ev.etiqueta + '>';
        });
        html += '</div>';
      }
    }
    $("#gridSemana").append(html);
  }

  // --- Calendario: vista Mes (clases y entregas como puntos de color) ---
  function pintarMes() {
    var hoy = new Date();
    var primero = new Date(hoy.getFullYear(), hoy.getMonth() + desplazamientoMes, 1);
    var anio = primero.getFullYear(), mes = primero.getMonth();
    var diasMes = new Date(anio, mes + 1, 0).getDate();
    var desfase = (primero.getDay() + 6) % 7; // lunes = 0
    var total = Math.ceil((desfase + diasMes) / 7) * 7;

    if (vistaCalendarioActual === "mes") { $("#mesActual").text(nombresMeses[mes] + " " + anio); }

    var html = "";
    for (var i = 0; i < total; i++) {
      var fecha = new Date(anio, mes, 1 - desfase + i);
      var fuera = fecha.getMonth() !== mes;
      var colores = [];
      if (!fuera) {
        var diaSemana = i % 7;
        $.each(DATOS.materias, function (j, m) {
          if ($.inArray(diaSemana, m.dias) !== -1) { colores.push(m.color); }
        });
        $.each(DATOS.entregas, function (j, e) {
          var f = fechaEntrega(e);
          if (!e.completada && f.getTime() === fecha.getTime()) { colores.push("entrega:" + e.id); }
        });
      }
      html += '<div class="celda-mes' + (fuera ? ' fuera-de-mes' : '') + '" data-semana="' + fechaISO(lunesDe(fecha)) + '"><span class="numero-dia">' + fecha.getDate() + '</span>';
      if (colores.length) {
        html += '<span class="puntos-dia">';
        $.each(colores, function (j, c) {
          if (c.indexOf("entrega:") === 0) {
            var idEntrega = c.split(":")[1];
            html += '<a class="punto punto-entrega" href="nueva-entrega.html?id=' + idEntrega + '" title="' + buscarEntrega(parseInt(idEntrega, 10)).titulo + '"></a>';
          } else {
            html += '<span class="punto punto-' + c + '"></span>';
          }
        });
        html += '</span>';
      }
      html += '</div>';
    }
    $("#gridMes .celda-mes").remove();
    $("#gridMes").append(html);
  }

  function pintarLeyenda() {
    var html = "";
    $.each(DATOS.materias, function (i, m) {
      html += '<span class="item-leyenda"><span class="punto punto-' + m.color + '"></span>' + m.nombre + '</span>';
    });
    html += '<span class="item-leyenda"><span class="punto punto-entrega"></span>Entrega</span>';
    $("#leyendaMaterias").html(html);
  }

  // Las flechas mueven un mes en la vista Mes y una semana en la vista Semana
  function cambiarMes(event) {
    var paso = $(event.currentTarget).is("#mesSiguiente") ? 1 : -1;
    if (vistaCalendarioActual === "semana") {
      inicioSemana = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate() + 7 * paso);
      pintarSemana();
    } else {
      desplazamientoMes += paso;
      pintarMes();
    }
  }

  function mostrarVista(vista) {
    vistaCalendarioActual = vista;
    $(".pestanaCalendario").removeClass("activa").filter('[data-vista="' + vista + '"]').addClass("activa");
    $("#vistaSemana").toggleClass("ocultar", vista !== "semana");
    $("#vistaMes").toggleClass("ocultar", vista !== "mes");
    if (vista === "semana") { pintarSemana(); } else { pintarMes(); }
  }

  // --- Vista Mes: al hacer clic en una semana se abre la vista Semana de esa semana ---
  function abrirSemanaDesdeMes(event) {
    if ($(event.target).closest("a").length) { return; }
    var partes = $(event.currentTarget).data("semana").split("-");
    inicioSemana = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    mostrarVista("semana");
  }

  function resaltarSemana(event) {
    var semana = $(event.currentTarget).data("semana");
    $("#gridMes .celda-mes").removeClass("semana-resaltada").filter(function () {
      return $(this).data("semana") === semana;
    }).addClass("semana-resaltada");
  }

  function quitarResaltadoSemana() {
    $("#gridMes .celda-mes").removeClass("semana-resaltada");
  }

  function guardarEntregas() {
    try {
      sessionStorage.setItem("studyflowEntregas", JSON.stringify(DATOS.entregas));
    } catch (e) {}
  }

  // ============================================================
  // Entregas: formulario (nueva/editar), detalle y eliminación
  // ============================================================

  function parametroId() {
    var id = parseInt(new URLSearchParams(window.location.search).get("id"), 10);
    return isNaN(id) ? null : id;
  }

  function buscarEntrega(id) {
    return $.grep(DATOS.entregas, function (e) { return e.id === id; })[0];
  }

  function fechaISO(fecha) {
    return fecha.getFullYear() + "-" + ("0" + (fecha.getMonth() + 1)).slice(-2) + "-" + ("0" + fecha.getDate()).slice(-2);
  }

  function fechaCorta(fecha) {
    return ("0" + fecha.getDate()).slice(-2) + "/" + ("0" + (fecha.getMonth() + 1)).slice(-2) + "/" + fecha.getFullYear();
  }

  function pintarFormularioEntrega() {
    var html = '<option value="">Selecciona una materia</option>';
    $.each(DATOS.materias, function (i, m) {
      html += '<option value="' + m.id + '">' + m.nombre + '</option>';
    });
    $("#materiaEntrega").html(html);

    var id = parametroId();
    var entrega = id !== null ? buscarEntrega(id) : null;
    if (entrega) {
      entregaEditandoId = entrega.id;
      $("#tituloFormEntrega").text("Editar entrega");
      $("#materiaEntrega").val(entrega.materia);
      $("#tituloEntrega").val(entrega.titulo);
      $("#fechaEntrega").val(fechaISO(fechaEntrega(entrega)));
      $("#pomodorosEntrega").val(entrega.pomodoros);
    }
  }

  function cambiarPomodoros(event) {
    var actual = parseInt($("#pomodorosEntrega").val(), 10) || 1;
    var nuevo = $(event.currentTarget).is("#sumarPomodoro") ? actual + 1 : actual - 1;
    $("#pomodorosEntrega").val(Math.min(12, Math.max(1, nuevo)));
  }

  function manejarSubmitEntrega(event) {
    event.preventDefault();

    var materiaValida = validarCampoObligatorio($("#campoMateriaEntrega"), $("#materiaEntrega"));
    var tituloValido = validarCampoObligatorio($("#campoTituloEntrega"), $("#tituloEntrega"));

    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var dias = NaN;
    if ($("#fechaEntrega").val()) {
      dias = Math.round((new Date($("#fechaEntrega").val() + "T00:00:00") - hoy) / 86400000);
    }
    var fechaValida = !isNaN(dias) && dias >= 0;
    $("#campoFechaEntrega").toggleClass("campo-error", !fechaValida);

    if (!(materiaValida && tituloValido && fechaValida)) { return; }

    var datos = {
      titulo: $.trim($("#tituloEntrega").val()),
      materia: $("#materiaEntrega").val(),
      pomodoros: parseInt($("#pomodorosEntrega").val(), 10) || 1,
      diasDesdeHoy: dias
    };

    if (entregaEditandoId !== null) {
      $.extend(buscarEntrega(entregaEditandoId), datos);
    } else {
      var siguienteId = 1;
      $.each(DATOS.entregas, function (i, e) { siguienteId = Math.max(siguienteId, e.id + 1); });
      DATOS.entregas.push($.extend({ id: siguienteId, prioridad: dias <= 2 ? "alta" : "media", completada: false }, datos));
    }
    guardarEntregas();
    navegarCon("calendario.html", $("#botonGuardarEntrega"));
  }

  function pintarDetalle() {
    var entrega = buscarEntrega(parametroId());
    if (!entrega) {
      window.location.href = "calendario.html";
      return;
    }
    var m = buscarMateria(entrega.materia);
    $("#detalleTitulo").text(m.nombre);
    $("#detalleMateria").text(m.nombre);
    $("#detalleNombre").text(entrega.titulo);
    $("#detalleFecha").text(fechaCorta(fechaEntrega(entrega)));
    $("#detallePomodoros").text(entrega.pomodoros + (entrega.pomodoros === 1 ? " pomodoro" : " pomodoros"));
    $("#botonEditarActividad").attr("href", "nueva-entrega.html?id=" + entrega.id);
  }

  function eliminarActividad() {
    var id = parametroId();
    if (!window.confirm("¿Eliminar esta actividad?")) { return; }
    DATOS.entregas = $.grep(DATOS.entregas, function (e) { return e.id !== id; });
    DATOS.bloques = $.grep(DATOS.bloques, function (b) { return b.entregaId !== id; });
    guardarEntregas();
    guardarBloques();
    window.location.href = "calendario.html";
  }

  // ============================================================
  // Sugerencias de horario (aceptar / rechazar / regenerar)
  // ============================================================

  function guardarBloques() {
    try {
      sessionStorage.setItem("studyflowBloques", JSON.stringify(DATOS.bloques));
    } catch (e) {}
  }

  // Semilla de "Regenerar" y sugerencias rechazadas (los bloques aceptados van en guardarBloques)
  function guardarEstadoSugerencias() {
    try {
      sessionStorage.setItem("studyflowSugerencias", JSON.stringify({ semilla: semillaSugerencias, rechazadas: rechazadas }));
    } catch (e) {}
  }

  function bloqueDe(entregaId) {
    return $.grep(DATOS.bloques, function (b) { return b.entregaId === entregaId; })[0];
  }

  function textoHora(h) {
    return h + ":00";
  }

  function textoBloque(bloque) {
    var fecha = new Date(bloque.fecha + "T00:00:00");
    return nombresDias[(fecha.getDay() + 6) % 7] + " " + fecha.getDate() + " " + nombresMeses[fecha.getMonth()].slice(0, 3) +
      " · " + textoHora(bloque.inicio) + " - " + textoHora(bloque.fin);
  }

  // Busca un hueco libre (sin clases ni otros bloques) antes de la fecha límite
  function proponerBloque(entrega, semilla, ocupadosExtra) {
    var duracion = Math.ceil(entrega.pomodoros / 2);
    var ahora = new Date();
    var candidatos = [];
    var limite = Math.min(Math.max(entrega.diasDesdeHoy, 0), 14);

    for (var offset = 0; offset <= limite; offset++) {
      var fecha = new Date();
      fecha.setHours(0, 0, 0, 0);
      fecha.setDate(fecha.getDate() + offset);
      var iso = fechaISO(fecha);
      var diaSemana = (fecha.getDay() + 6) % 7;
      var ocupadas = {};

      $.each(DATOS.materias, function (i, m) {
        if ($.inArray(diaSemana, m.dias) !== -1) {
          for (var h = Math.floor(horasDe(m.inicio)); h < Math.ceil(horasDe(m.fin)); h++) { ocupadas[h] = true; }
        }
      });
      $.each(DATOS.bloques.concat(ocupadosExtra), function (i, b) {
        if (b.fecha === iso) {
          for (var h = b.inicio; h < b.fin; h++) { ocupadas[h] = true; }
        }
      });

      for (var inicio = 8; inicio + duracion <= 18; inicio++) {
        var libre = true;
        for (var k = inicio; k < inicio + duracion; k++) { if (ocupadas[k]) { libre = false; } }
        if (offset === 0 && inicio <= ahora.getHours()) { libre = false; }
        if (libre) { candidatos.push({ entregaId: entrega.id, fecha: iso, inicio: inicio, fin: inicio + duracion }); }
      }
    }
    return candidatos.length ? candidatos[semilla % candidatos.length] : null;
  }

  function entregasParaSugerir() {
    var pendientes = $.grep(DATOS.entregas, function (e) { return !e.completada; });
    pendientes.sort(function (a, b) {
      if (a.prioridad !== b.prioridad) { return a.prioridad === "alta" ? -1 : 1; }
      return a.diasDesdeHoy - b.diasDesdeHoy;
    });
    return pendientes.slice(0, 3);
  }

  function pintarSugerencias() {
    var propuestos = [];
    var html = "";
    $.each(entregasParaSugerir(), function (i, e) {
      if ($.inArray(e.id, rechazadas) !== -1) { return; }
      var m = buscarMateria(e.materia);
      var aceptado = bloqueDe(e.id);
      var bloque = aceptado || proponerBloque(e, semillaSugerencias + i, propuestos);
      if (!bloque) { return; }
      if (!aceptado) { propuestos.push(bloque); }
      $.data(document.body, "bloque" + e.id, bloque);

      html += '<article class="tarjeta-sugerencia' + (aceptado ? ' aceptada' : '') + '" data-id="' + e.id + '">' +
        '<div class="info-sugerencia">' +
          '<h3>' + m.nombre + '</h3>' +
          '<p class="detalle-sugerencia">' + e.titulo + ' · ' + e.pomodoros + ' pomodoros</p>' +
          '<p class="horario-sugerencia">' + textoBloque(bloque) + '</p>' +
        '</div>' +
        '<div class="acciones-sugerencia">' +
          '<button type="button" class="boton-aceptar" aria-label="Aceptar horario">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>' +
          (aceptado ? '' : '<button type="button" class="boton-rechazar" aria-label="Rechazar horario">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>') +
        '</div></article>';
    });
    if (!html) { html = '<p class="vacio-sugerencias">No hay entregas pendientes para sugerir horarios.</p>'; }
    $("#listaSugerencias").html(html);
  }

  function aceptarSugerencia(event) {
    var id = $(event.currentTarget).closest(".tarjeta-sugerencia").data("id");
    if (!bloqueDe(id)) {
      DATOS.bloques.push($.data(document.body, "bloque" + id));
      guardarBloques();
    }
    pintarSugerencias();
  }

  function rechazarSugerencia(event) {
    var id = $(event.currentTarget).closest(".tarjeta-sugerencia").data("id");
    rechazadas.push(id);
    guardarEstadoSugerencias();
    $(event.currentTarget).closest(".tarjeta-sugerencia").remove();
    if (!$(".tarjeta-sugerencia").length) {
      $("#listaSugerencias").html('<p class="vacio-sugerencias">Rechazaste todas las sugerencias. Usa Regenerar para ver nuevas opciones.</p>');
    }
  }

  function aceptarTodo() {
    $(".tarjeta-sugerencia:not(.aceptada)").each(function () {
      var id = $(this).data("id");
      if (!bloqueDe(id)) { DATOS.bloques.push($.data(document.body, "bloque" + id)); }
    });
    guardarBloques();
    pintarSugerencias();
  }

  function regenerarSugerencias() {
    semillaSugerencias++;
    rechazadas = [];
    guardarEstadoSugerencias();
    pintarSugerencias();
  }

  // --- Login (index.html) ---
  function manejarSubmitLogin(event) {
    event.preventDefault();

    var $correo = $("#correoLogin");
    var $password = $("#passwordLogin");
    var correoValido = validarCorreo($("#campoCorreoLogin"), $correo);
    var passwordValido = validarCampoObligatorio($("#campoPasswordLogin"), $password);

    if (correoValido && passwordValido) {
      if ($.trim($correo.val()).toLowerCase() !== DATOS.usuario.correo) {
        $("#campoCorreoLogin").addClass("campo-error").find(".mensaje-error").text("Este correo no está registrado.");
        return;
      }
      if ($password.val() !== DATOS.usuario.password) {
        $("#campoPasswordLogin").addClass("campo-error").find(".mensaje-error").text("Contraseña incorrecta.");
        return;
      }
      guardarSesion(DATOS.usuario.nombre, DATOS.usuario.correo);
      navegarCon("calendario.html", $("#botonLogin"));
    }
  }

  // --- Registro (registro.html) ---
  function manejarSubmitRegistro(event) {
    event.preventDefault();

    var nombreValido = validarCampoObligatorio($("#campoNombre"), $("#nombreRegistro"));
    var correoValido = validarCorreo($("#campoCorreoRegistro"), $("#correoRegistro"));
    var passwordValido = $.trim($("#passwordRegistro").val()).length >= 6;
    var confirmarValido = $("#confirmarRegistro").val() === $("#passwordRegistro").val() && passwordValido;
    var terminosAceptados = $("#terminosRegistro").is(":checked");

    $("#campoPasswordRegistro").toggleClass("campo-error", !passwordValido);
    $("#campoConfirmar").toggleClass("campo-error", !confirmarValido);

    if (nombreValido && correoValido && passwordValido && confirmarValido && terminosAceptados) {
      guardarSesion($.trim($("#nombreRegistro").val()), $.trim($("#correoRegistro").val()));
      navegarCon("calendario.html", $("#botonRegistro"));
    }
  }

  // --- Calendario: alternar pestañas Semana / Mes ---
  function cambiarVistaCalendario(event) {
    mostrarVista($(event.currentTarget).data("vista"));
  }

  // --- Materias: recargar calendario académico (simulado) ---
  function recargarCalendarioAcademico(event) {
    event.preventDefault();
    var $enlace = $(this);
    var textoOriginal = $enlace.text();

    $enlace.text("Recargando...");
    setTimeout(function () {
      var ahora = new Date();
      var horas = ahora.getHours() % 12 || 12;
      var minutos = ("0" + ahora.getMinutes()).slice(-2);
      var periodo = ahora.getHours() >= 12 ? "PM" : "AM";
      $(".pie-resumen span").first().text("Última revisión: Hoy, " + horas + ":" + minutos + " " + periodo);
      $enlace.text(textoOriginal);
    }, 500);
  }

  // --- Próximas entregas: marcar como completada ---
  function alternarEntregaCompletada() {
    var $boton = $(this);
    var id = $boton.closest(".tarjeta-entrega").data("id");
    $boton.toggleClass("completada");
    $.each(DATOS.entregas, function (i, e) {
      if (e.id === id) { e.completada = $boton.hasClass("completada"); }
    });
    guardarEntregas();
  }

  // --- Crear materia: elegir color identificador ---
  function seleccionarColorMateria() {
    $(".opcion-color").removeClass("seleccionado");
    $(this).closest(".opcion-color").addClass("seleccionado");
  }

  // --- Crear materia: alternar día de clase ---
  function alternarChipDia() {
    $(this).closest(".chip-dia").toggleClass("marcado", this.checked);
  }

  // --- Crear materia: validar y guardar (simulado) ---
  function manejarSubmitCrearMateria(event) {
    event.preventDefault();

    var nombreValido = validarCampoObligatorio($("#nombreMateria").closest(".grupo-campo"), $("#nombreMateria"));
    var codigoValido = validarCampoObligatorio($("#codigoMateria").closest(".grupo-campo"), $("#codigoMateria"));

    $("#nombreMateria").toggleClass("campo-invalido", !nombreValido);
    $("#codigoMateria").toggleClass("campo-invalido", !codigoValido);

    var dias = [];
    $('input[name="dias"]:checked').each(function () {
      dias.push($.inArray(this.value, valoresDias));
    });
    var inicio = $("#horaInicio").val();
    var fin = $("#horaFin").val();
    var diasValidos = dias.length > 0;
    var horarioValido = horasDe(fin) > horasDe(inicio);
    $("#grupoDias").closest(".grupo-campo").toggleClass("campo-error", !diasValidos);
    $("#horaInicio").closest(".grupo-campo").toggleClass("campo-error", !horarioValido);

    if (nombreValido && codigoValido && diasValidos && horarioValido) {
      var nombre = $.trim($("#nombreMateria").val());
      var color = $('input[name="colorMateria"]:checked').val();
      var horasSemana = Math.round((horasDe(fin) - horasDe(inicio)) * dias.length);
      DATOS.materias.push({
        id: "materia" + Date.now(),
        nombre: nombre,
        codigo: $.trim($("#codigoMateria").val()).toUpperCase(),
        profesor: $.trim($("#profesorMateria").val()),
        dias: dias.sort(),
        inicio: inicio,
        fin: fin,
        creditos: 3,
        pomodoros: Math.max(1, horasSemana),
        color: color,
        claseIcono: "color-" + color,
        icono: nombre.charAt(0).toUpperCase()
      });
      guardarMaterias();
      navegarCon("materias.html", $("#botonGuardarMateria"));
    }
  }

  function guardarMaterias() {
    try {
      sessionStorage.setItem("studyflowMaterias", JSON.stringify(DATOS.materias));
    } catch (e) {}
  }

  // --- Perfil: alternar conexión de calendario ---
  function guardarCalendario() {
    try {
      sessionStorage.setItem("studyflowCalendario", JSON.stringify({ conectado: calendarioConectado, url: urlCalendario }));
    } catch (e) {}
  }

  function actualizarEstadoSync() {
    if (calendarioConectado) {
      $("#indicadorSync").removeClass("desconectado");
      $("#textoSync").text("Sincronización activa");
      $("#urlFeed").text(urlCalendario).toggle(urlCalendario !== "");
    } else {
      $("#indicadorSync").addClass("desconectado");
      $("#textoSync").text("Calendario desconectado");
      $("#urlFeed").hide();
    }
  }

  // --- Perfil: popup para pegar el enlace del feed del calendario ---
  function abrirModalCalendario() {
    $("#campoUrlCalendario").removeClass("campo-error");
    $("#urlCalendario").val("");
    $("#modalCalendario").removeClass("ocultar");
    $("#urlCalendario").trigger("focus");
  }

  function cerrarModalCalendario() {
    $("#modalCalendario").addClass("ocultar");
  }

  function cerrarModalCalendarioConFondo(event) {
    if (event.target === event.currentTarget) { cerrarModalCalendario(); }
  }

  function cerrarModalCalendarioConEscape(event) {
    if (event.key === "Escape") { cerrarModalCalendario(); }
  }

  function manejarSubmitCalendario(event) {
    event.preventDefault();
    var url = $.trim($("#urlCalendario").val());
    var valida = /^(https?|webcal):\/\/[^\s\/]+\.[^\s\/]+/i.test(url);
    $("#campoUrlCalendario").toggleClass("campo-error", !valida);
    if (!valida) { return; }

    urlCalendario = url;
    calendarioConectado = true;
    guardarCalendario();
    actualizarEstadoSync();
    cerrarModalCalendario();
  }

  function desconectarCalendario() {
    calendarioConectado = false;
    urlCalendario = "";
    guardarCalendario();
    actualizarEstadoSync();
  }

  // --- Cerrar sesión: vuelve siempre a Login ---
  function manejarCerrarSesion(event) {
    event.preventDefault();
    navegarCon("index.html", $(this));
  }

  // ============================================================
  // 3. TRIGGERS (se asignan siempre después de las funciones)
  // ============================================================

  $("#formLogin").on("submit", manejarSubmitLogin);
  $("#correoLogin, #passwordLogin").on("input", function () { $(this).closest(".campo").removeClass("campo-error"); });
  $("#formRegistro").on("submit", manejarSubmitRegistro);

  pintarUsuario();
  if ($("#listaMaterias").length) { pintarMaterias(); }
  if ($("#listaSugerencias").length) { pintarSugerencias(); }
  if ($("#formNuevaEntrega").length) { pintarFormularioEntrega(); }
  if ($("#detalleTitulo").length) { pintarDetalle(); }
  if ($("#gridSemana").length) { pintarSemana(); pintarMes(); pintarLeyenda(); }

  $(".pestanaCalendario").on("click", cambiarVistaCalendario);
  $("#mesAnterior, #mesSiguiente").on("click", cambiarMes);
  $("#gridMes").on("click", ".celda-mes", abrirSemanaDesdeMes);
  $("#gridMes").on("mouseenter", ".celda-mes", resaltarSemana);
  $("#gridMes").on("mouseleave", quitarResaltadoSemana);

  $("#formNuevaEntrega").on("submit", manejarSubmitEntrega);
  $("#sumarPomodoro, #restarPomodoro").on("click", cambiarPomodoros);
  $("#campoMateriaEntrega select, #campoTituloEntrega input, #campoFechaEntrega input").on("input change", function () {
    $(this).closest(".grupo-campo").removeClass("campo-error");
  });
  $("#botonEliminarActividad").on("click", eliminarActividad);

  $("#listaSugerencias").on("click", ".boton-aceptar", aceptarSugerencia);
  $("#listaSugerencias").on("click", ".boton-rechazar", rechazarSugerencia);
  $("#aceptarTodo").on("click", aceptarTodo);
  $("#regenerarSugerencias").on("click", regenerarSugerencias);

  $("#recargarCalendarioAcademico").on("click", recargarCalendarioAcademico);
  $("#listaEntregas").on("click", ".boton-check", alternarEntregaCompletada);

  $('input[name="colorMateria"]').on("change", seleccionarColorMateria);
  $('.chip-dia input[type="checkbox"]').on("change", alternarChipDia);
  $("#formCrearMateria").on("submit", manejarSubmitCrearMateria);

  actualizarEstadoSync();
  $("#botonConectarCalendario").on("click", abrirModalCalendario);
  $("#cancelarConexionCalendario").on("click", cerrarModalCalendario);
  $("#modalCalendario").on("click", cerrarModalCalendarioConFondo);
  $(document).on("keydown", cerrarModalCalendarioConEscape);
  $("#formConectarCalendario").on("submit", manejarSubmitCalendario);
  $("#urlCalendario").on("input", function () { $("#campoUrlCalendario").removeClass("campo-error"); });
  $("#botonDesconectarCalendario").on("click", desconectarCalendario);

  $("#cerrarSesionMaterias, #cerrarSesionPerfil").on("click", manejarCerrarSesion);

});
