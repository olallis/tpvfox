
<?php
/* Fichero de tareas a realizar.
 * 
 * 
 * Con el switch al final y variable $pulsado
 * 
 *  */
/* ===============  REALIZAMOS CONEXIONES  ===============*/


$pulsado = $_POST['pulsado'];

include_once ("./../../configuracion.php");

// Crealizamos conexion a la BD Datos
include_once ("./../mod_conexion/conexionBaseDatos.php");

// Incluimos funciones
include_once ("./funciones.php");

switch ($pulsado) {
    
    case 'buscarProductos':
		$busqueda = $_POST['valorCampo'];
		$campoAbuscar = $_POST['campo'];
		//cuando busco dsde el popup el estado me es indiferente
		$deDonde = $_POST['dedonde'];
		//cambio conexion a tpv
		$respuesta = BuscarProductos($campoAbuscar,$busqueda,$BDTpv);
		// Si respuesta es incorrecta, entonces devuelvo html de respuesta
		//si dedonde == 'popup' 
		if ($respuesta['Estado'] !='Correcto' ){
			// Entramos aquí tanto si es listado como si no se encontro articulos.
			$respuesta['listado']= htmlProductos($respuesta['datos'],$campoAbuscar,$busqueda);
		}
		if ($respuesta['Estado'] === 'Correcto' && $deDonde === 'popup'){
			// Cambio estado para devolver que es listado.
			$respuesta['listado']= htmlProductos($respuesta['datos'],$campoAbuscar,$busqueda);
			$respuesta['Estado'] = 'Listado';
		}
		echo json_encode($respuesta);  
		break;
	
	case 'cobrar':
		//~ echo 'cobrar';
		$totalJS = $_POST['total'];
		$productos = $_POST['productos'];
		// Recalcular totales.
		$totales = recalculoTotales($productos);
		
		
		$respuesta = htmlCobrar($totalJS);
		$respuesta['recalculo'] = $totales;

		echo json_encode($respuesta);		
		
		break;
	//modal buscar por clientes
	case 'buscarClientes':
		$busqueda = $_POST['busqueda'];
		$tabla='clientes';
		//funcion de buscar clientes
		//luego html mostrar modal 
		if ($busqueda != ''){
			$res = array();
			//$res = BusquedaClientes($busqueda);
			$res = BusquedaClientes($busqueda,$BDTpv,$tabla);
		} 
		
		$respuesta = htmlClientes($busqueda,$res['datos']);
	
		echo json_encode($respuesta);
		break;
	case 'grabarTickes';
		$respuesta = array();
		$cabecera = array(); // Array que rellenamos de con POST
		$productos 					=$_POST['productos'];
		$total 						=$_POST['total'];
		$cabecera['idTienda']		=$_POST['idTienda'];
		$cabecera['idCliente']		=$_POST['idCliente'];
		$cabecera['idUsuario'] 		=$_POST['idUsuario'];
		$cabecera['estadoTicket'] 	=$_POST['estadoTicket'];
		$cabecera['numTicket'] 		=$_POST['numTicket'];

		$res 	= grabarTicketsTemporales($BDTpv,$productos,$cabecera,$total);
		$respuesta=$res;
		echo json_encode($respuesta);
		break;
		
	case 'HtmlLineaTicket';
		$respuesta = array();
		$product 					=$_POST['producto'];
		$num_item					=$_POST['num_item'];
		$CONF_campoPeso		=$_POST['CONF_campoPeso'];
		$res 	= htmlLineaTicket($product,$num_item,$CONF_campoPeso);
		$respuesta['html'] =$res;
		echo json_encode($respuesta);
		break;
	case 'CerrarTicket';
		$respuesta = array();
		$cabecera = array(); // Array que rellenamos de con POST
		$total 							=$_POST['total'];
		$entregado						=$_POST['entregado'];
		$formaPago						=$_POST['formaPago'];
		$cabecera['idTienda']			=$_POST['idTienda'];
		$cabecera['idCliente']			=$_POST['idCliente'];
		$cabecera['idUsuario'] 			=$_POST['idUsuario'];
		$cabecera['estadoTicket'] 		=$_POST['estadoTicket'];
		$cabecera['numTickTemporal'] 	=$_POST['numTickTemporal'];
		// Obtenemos ticket
		$ticket 	= ObtenerUnTicket($BDTpv,$cabecera['idTienda'],$cabecera['idUsuario'] ,$cabecera['numTickTemporal']);
		// Comprobamos que el resultado es correcto y recalculamos totales
		if (isset($ticket['error'])) { 
			$respuesta['error-ticket']['mensaje'] ='Error en al Obtener ticket';
			$respuesta['error-ticket']['datos'] = $ticket['error'];
			echo json_encode($respuesta); // Convierto a JSON.
			return $respuesta; // No continuamos,.
		}
		// Obtenermos los productos como array que con un JSOn por cada producto y este JSON contiene los campos de cada producto
		if (isset($ticket['productos'])){
			$productos = json_decode( json_encode( $ticket['productos'] ), true );
			$Datostotales = recalculoTotales($ticket['productos']);	
			if (number_format($Datostotales['total'],2) != number_format($total,2)){
				$respuesta['error-ticket']['mensaje']  = ' No coincidente TOTAL:'.$total.' con el Total recalculado';
				$respuesta['error-ticket']['datos'] = $Datostotales;
			}
		}
		$respuesta['ticket'] =$ticket;
		$respuesta['totales'] = $Datostotales;
		echo json_encode($respuesta);
		break;
}
 
/* ===============  CERRAMOS CONEXIONES  ===============*/

mysqli_close($BDImportDbf);

 
 
?>
