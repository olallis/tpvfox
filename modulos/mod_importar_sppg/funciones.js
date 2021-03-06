/*
 * @version     0.1
 * @copyright   Copyright (C) 2017 Catalogoproductos - Funciones sincronizar.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 * @author      Ricardo Carpintero - SolucionesVigo
 * @Descripcion	Javascript necesarios para modulo importar DBF.
 * Las funciones que tienen prefijo:
 *  "Import" es que se utilizan solo en importacion de DBF
 *  "Sincro" es que se utilizan solo para sincronizar los datos importados con la base de datos actual..
 * 
 * DEBUG:
 * Una forma de textear el funciomamiento los fallos son :
 * 	- Eliminando algún dbf ¿que no existe?.. 
 * 	- Si cambiamos la estructura de BDFImportar de alguna de las tablas.
 * */
var pulsado = 'Inicio';
var LimiteActual = 0;
var LimiteFinal = 0;
var iconoCargar = '<span><img src="../../css/img/ajax-loader.gif"/></span>';
var iconoCorrecto = '<span class="glyphicon glyphicon-ok-sign"></span>';
var iconoIncorrecto = '<span class="glyphicon glyphicon-remove-sign"></span>';
var campos = [];
var ficheroActual = '';
var estadoImportacion = [];




// Funcion para mostrar la barra de proceso..
function BarraProceso(lineaA,lineaF) {
	// Esta fucion debería ser una funcion comun , por lo que se debería cargar el javascript comun y ejecutar...
	// Script para generar la barra de proceso.
	// Esta barra proceso se crea con el total de lineas y empieza mostrando la lineas
	// que ya estan añadidas.
	// NOTA:
	// lineaActual no puede ser 0 ya genera in error, por lo que debemos sustituirlo por uno
	if (lineaA == 0 ) {
		lineaA = 1;
	}
	if (lineaF == 0) {
	 alert( 'Linea Final es 0 ');
	 return;
	}
	var progreso =  Math.round(( lineaA *100 )/lineaF);
	$('#bar').css('width', progreso + '%');
	// Añadimos numero linea en resultado.
	document.getElementById("bar").innerHTML = progreso + '%';  // Agrego nueva linea antes 
	return;
	
}

function ControlPulsado (pulsado) {
	// Lo que pretendo es tener un proceso que controle y cambio de proceso según sea necesarios.
	// la variable que va controlar es pulsado.
	
	switch(pulsado) {
						
			case 'import_inicio':
				// Acaba de cargar javascript, por lo que inicia proceso.
				//llamar func que hace bucle de la matriz de nombres tabla (fichero)
				bucleFicheros();
				break;
	} 
	return;
}


//matriz en variables
function bucleFicheros(){
	console.log( '========================== Entramos en bucle  =============================================');
	// Reiniciamos Barra proceso 
	LimiteActual = 0;
	LimiteFinal = 0;
	// Reiniciamos campos 
	campos = []; 
	tablaActual= '';
	// Quitamos los ultimos cuatro caracteres al fichero actual si lo hay.... (.dbf)
	tablaActual = ficheroActual.slice(0, -4); 
	// Buscamos numero index que estamos.
	idFichero = nombretabla.indexOf(tablaActual);
	nuevoIndice = idFichero + 1; // Nuevo indice... 
	console.log('Nombretabla');
	numFicheros = nombretabla.length; // Obtenemos el indice mayor que puede ser...
	if (nuevoIndice < numFicheros ){
		ficheroActual = nombretabla[nuevoIndice]+'.dbf';
		console.log ( 'Fichero Actual:'+ ficheroActual)
		$("#idCabeceraBarra").html('<b>Importando fichero: '+ficheroActual+'</b>');
		//~ ImportEstrucTabla (nombretabla[nuevoIndice]);
		ImportEstrucTabla();
	} else {
		// termino...
		alert('termino de importar fichero');
		$(".btn-actualizar").css("display", "block");
	}
	
}


//recibir nombre de la tabla
function ImportEstrucTabla (){
	console.log('=============Iniciando funcion de EstruTabla=============');
	//~ console.log('Nombre fichero:'+ nombrefichero);
	console.log(' Variable global ficheroActual:'+ficheroActual);
	console.log(' ficheroActual lo actualizamos en bucleficheros...');

	//estructura articulos
	var parametros = {
	"Fichero" 	: ficheroActual,
	"pulsado" 	: 'import_inicio'
			};
	$.ajax({
			data:  parametros,
			url:   'tareas.php',
			type:  'post',
			beforeSend: function () {
					$("#resultado").html('Obteniendo estructura de tabla'+ficheroActual);
			},
			success:  function (response) {			
					// Cuando se recibe un array con JSON tenemos que parseJSON
					var resultado =  $.parseJSON(response)
										
					if (resultado['Estado'] === 'Correcto') {
						console.log('tenemos estructura dbf para crear tabla');
						LimiteFinal = resultado['numeroReg'];
						console.log('Numero de registros tabla: '+ LimiteFinal);
						// Obtenemos numero campos
						NumCampos = resultado['NumCampos'];
						console.log(NumCampos);
						
						campos = []
						for (i = 1; i <= NumCampos; i++){
							campos[i]= {campo :resultado[i]['campo'],tipo :resultado[i]['tipo'],longitud :resultado[i]['longitud'],decimal :resultado[i]['decimal']};	
						 //consigo los campos de la tabla
						// console.log('estructura '+campos[i]['campo']+' '+campos[i]['tipo']+' '+campos[i]['longitud']+' '+campos[i]['decimal'] );
						 
						}					
					
						ImportcomprobarTabla();
						return;
					} else {	
						//Entra si se produce un error en lib/leerEstrucDBF2 de python.
						//en console lo mostamos.
						//Podemos provocar el error cambiando simplemente el nombre fichero en datos.
						//Por este error no para.
						tablaActual = ficheroActual.slice(0, -4); // Quitamos los ultimos cuatro caracteres... (.dbf)
						// Mostramos icho de error.
						PintarIcono(tablaActual, "CEstruct",false);
						// Como es un erro importante , lo que hacemos es cambiar el color icono pintado.
						$('#id'+tablaActual).css('color', 'red');
						estadoImportacion[tablaActual] = 'Incorrecto';

						console.log('Error en tabla '+estadoImportacion[tablaActual]);
						console.log(resultado);
						console.log('Mandamos bucle nuevamente aunque haya error en fichero actual:'+ ficheroActual);
						bucleFicheros();
						
					}					
			}
		});
}


function ImportcomprobarTabla(){
	// Comprobamos si existe tabla y si los campos son correctos  en la BDImportar.
	//		- Tabla existe:
	//				[SI] -> Ejecutamos ImportObtenerDatos()
	//				[NO] -> Marcamos con X (Estructura) y no continuamos con esa tabla, volvemos a bucle para siguiente.
	//		- Comprueba la estructura de MYSQL si es igual a la DBF
	//				[NO] -> Marcamos con X (Estructura), borramos tabla y la volvemos a crear en Mysql ( DBImport) ,
	//						marcando con X las casillas correspondiente de borrada y creada.
	//				[Si] -> Vamos Obtener DATOS ( ImportObtenerDatos)
 
	tablaActual = ficheroActual.slice(0, -4); // Quitamos los ultimos cuatro caracteres... (.dbf)
	var parametros = {
	"Fichero" 	: tablaActual,
	"pulsado" 	: 'Comprobar-tabla',
	'campos'	: campos
			};
	$.ajax({
		data:  parametros,
		url:   'tareas.php',
		type:  'post',
		beforeSend: function () {
			$("#resultado").html('Comprobamos la tabla si existe o es correcta.Nombre tabla:'+tablaActual);
			console.log('******** Comprobando la tabla '+tablaActual+ ' ****************');
		},
		success:  function (response) {
			// Cuando se recibe un array con JSON tenemos que parseJSON
			var resultado =  $.parseJSON(response);
			console.log('Respuesta accion-creado:'+resultado['accion-creado']+ ' Nombre tabla ' + tablaActual);
			//dropear tabla es boolean , cuando se borre tabla, el icono aparece en borrado. columna correspondiente
			if (resultado['dropear-tabla']){
				PintarIcono(tablaActual, "CEstruct", false);
				PintarIcono(tablaActual, "CBorrar");
			}

			if (resultado['accion-creado'] === 'Creada estructura tabla'){
				PintarIcono(tablaActual, "CCrear");
			} else if (resultado['accion-creado'] === ''){
				PintarIcono(tablaActual, "CEstruct");
			}
			
			if (resultado['accion-deleteDatos'] === 'Datos borrados'){
				PintarIcono(tablaActual, "CVaciar");
			}

			if (resultado['Estado'] === 'Correcto') {
				// Respuesta correcta...		
				console.log( 'EXISTE tabla '+ tablaActual+' vamos a obtener datos');
				ImportObtenerDatosDbf();
				return;
			} else {
				// Error en respuesta.
				console.log(' No existe tabla '+ tablaActual);
				console.log(response);
				return;
			}
		}
	});
}


function ImportObtenerDatosDbf(){
	// Funcion para obtener datos registro. 
	// le paso objetos
	if (LimiteActual < LimiteFinal) {
		BarraProceso(LimiteActual,LimiteFinal);
		diferencia = LimiteFinal - LimiteActual;
		// Ponemos tope para realizar bucle 5000 como máximo.
		if (diferencia >5000 ) {
			diferencia= 4999;
			TopeRegistro= LimiteActual + diferencia;
		} else {
			TopeRegistro = LimiteFinal;
		}
		console.log('Antes Ajax FicheroActual:' + ficheroActual);
		tablaActual = ficheroActual.slice(0, -4); 

		//.slice(0, -4)
		nombrefichero = ficheroActual;
		var parametros = {
			"lineaI" 	: LimiteActual,
			"lineaF" 	: TopeRegistro,
			"pulsado" 	: 'obtenerDbf',
			"Fichero" 	: nombrefichero,
			"campos" 	: campos
		};
		$.ajax({
			data:  parametros,
			url:   'tareas.php',
			type:  'post',
			beforeSend: function () {
				$("#resultado").html('Importacion : Obteniendo datos de '+ nombrefichero);
				// Pintamos icono de carga.. actualizar..
				PintarIcono(tablaActual, "CImportar",false,true);
				console.log('================  Obteniendo como muchos 5000 registros de tabla '+ nombrefichero +' iniciando en registro ' + LimiteActual+ '====================');
			},
			success:  function (response) {	
				// Cuando se recibe un array con JSON tenemos que parseJSON si es array.
				// se usa parseJSON para recoger el array asociativo (resultado['Estado']) estados entre php y js en respuestas web
				var resultado =  $.parseJSON(response);

				//Añado uno a limiteActula por si vuelve a bucle 
				LimiteActual = LimiteActual + diferencia + 1;
				
				if (resultado['Estado'] === 'Correcto') {
					console.log('entro en estado correcto '+LimiteActual);
					ImportObtenerDatosDbf();	
					return;			
				} else {
					estadoImportacion[tablaActual] = 'Incorrecto';
					console.log('error en importacion '+estadoImportacion);
					// Pienso que este error detiene el proceso bucle... aunque no se como reproducirlo... 
					return;
				}
				
			}
		});	
	
	} else {
		// Pintamos si fue correcto o incorrecto la Importacion.
		if (estadoImportacion[tablaActual] === 'Incorrecto'){
			PintarIcono(tablaActual, "CImportar", false);
		} else {
			PintarIcono(tablaActual, "CImportar");
		}
		// Damos por terminado el proceso de esa tabla y pasamos a la siguiente.
		BarraProceso(LimiteFinal,LimiteFinal); // Lo pintamos nuevamente, ya que muestra LimiteActual + 1, y se muestra 101%
		// Añadimos completado
		bucleFicheros();
	}
}


function PintarIcono(tablaActual, className, ok=true,cargando=false){
	// Funcion mostrar icono ok,incorrecto o cargando en tabla de Control de procesos importacion.
	// parametros:
	//  $tablaActual : Nombretabla sin extension..
	//  $className : nombre de la className a monstar y buscar..
	//  $ok-> true si fue correcto, false si no lo es..
	//  $cargando-> true si esta cargando o false.
	
	idMatrizFichero = nombretabla.indexOf(tablaActual);
	//~ console.log('idMatrizFichero: '+ idMatrizFichero);
	var x = document.getElementsByClassName(className);
	//~ console.log('x:' + x[2]);
	// Cambiar append por htmlinsert (creo)
	if (ok){
		$(x[idMatrizFichero]).html(iconoCorrecto);
	} else {
		$(x[idMatrizFichero]).html(iconoIncorrecto);
	}
	if (cargando){
		$(x[idMatrizFichero]).html(iconoCargar);

	}
}
function ActualizarInicio(actualizar){
	alert('Pendiente comprobar si empezo con actualizacion...');
	// Si no empezo entonces... empezamos con añadir campoNecesarios a BDImportar para hacer actualizacion
	ActualizarAgregarCanmpo();
	console.log(actualizar);
	};
function ActualizarAgregarCanmpo(){
	// Antes de enviar el array nombretabla
	// tengo eliminar aquellos que están mal.
	var tablasErroneas= Object.keys(estadoImportacion); 
	// fuente de código anterior: https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Object/keys
	tablasErroneas.forEach(function(element) {
		// Lo que hacemos dentro de esta funcion es enviar array nombretabla y element( que es el nombre tabla eliminar de array)
		//~ console.log('Nombre tabla a eliminar:')
		//~ console.log(element);
		removeItemFromArr ( nombretabla,element )
	});
		//eliminamos nombre tabla que esten erroneas.
		//~ removeItemFromArr ( nombretabla,erronea )
		//~ console.log('Nombre tabla a eliminar:'+erronea)

	var parametros = {
		"pulsado"	: "actualizar_agregar",
		"Ficheros" 	: nombretabla
		};
	
	$.ajax({
		data:  parametros,
		url:   'tareas.php',
		type:  'post',
		beforeSend: function () {
			$("#resultado").html('Agregando campos DBDImportar para actualizar ');
			console.log('================  Agregando campos DBDImportar para actualizar   ====================');
			
		},
		success:  function (response) {
			$("#resultado").html('Termino de agregando campos DBDImportar para actualizar ');
			console.log('================  Termino campos DBDImportar para actualizar   ====================');
		}
	});

}




function removeItemFromArr ( arr, item ) {
	// Funcion que encuentro en : http://www.etnassoft.com/2016/09/09/eliminar-un-elemento-de-un-array-en-javascript-metodos-mutables-e-inmutables/
	// en esa pagina encontramos varias formas de eliminar un item de una variable.
	// una mutable y otra no, en principio utilizo la mutable
    $('#id'+item).css('text-decoration', 'line-through');
    var i = arr.indexOf( item );
     
    if ( i !== -1 ) {
        arr.splice( i, 1 );
    }
}
