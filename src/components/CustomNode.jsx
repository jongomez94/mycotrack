import React from 'react';
import { Handle, Position } from 'reactflow';

// Importa las imágenes necesarias
// Asegúrate de que la ruta sea correcta según la ubicación real de tus archivos de imagen
import petridishImage from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/petri.png'; 
import pp5grandeImage from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/pp5grande.png';
import pp5pequenoImage from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/pp5pequeno.png'; // Nuevo
import bolsaPP5Image from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/bolsapps5.png'; // Nuevo
import contenedorPP5Image from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/contenedorpp5.png'; // Nuevo
import honeyTekImage from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/honeytek.png'; // Nuevo
import jeringaImage from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/jeringa.png'; // Nuevo

function CustomNode({
  data, // data contiene las propiedades del nodo guardadas en Firestore
  isConnectable, // propiedad de React Flow para indicar si el nodo es conectable
}) {
  const nodeType = data.tipo;
  
  // Función para determinar el color del overlay según el estado
  const getOverlayColor = (estado) => {
    switch (estado) {
      case 'Descartada':
        return 'rgba(90, 90, 90, 0.86)'; // Gris
      case 'Contaminada pero limpiable':
        return 'rgba(255, 255, 0, 0.3)'; // Amarillo
      case 'Activa':
        return 'rgba(144, 238, 144, 0.3)'; // Verde claro
      case 'En Refrigerador':
        return 'rgba(173, 216, 230, 0.3)'; // Azul claro
      case 'Exhausta':
        return 'rgba(255, 255, 255, 0.3)'; // Blanco
        case 'Contaminada':
          return 'rgba(230, 17, 17, 0.3)'; // Rojo  
      default:
        return null;
    }
  };

  const overlayColor = getOverlayColor(data.estado);

  // Determina qué imagen usar y si es un tipo con imagen personalizada
  let displayImage = null;
  let isImageNode = false;

  if (nodeType === 'Placa Petri') {
    displayImage = petridishImage;
    isImageNode = true;
  } else if (nodeType === 'Bote PP5 Grande') {
    displayImage = pp5grandeImage;
    isImageNode = true;
  } else if (nodeType === 'Bote PP5 Pequeño') { // Nuevo caso
    displayImage = pp5pequenoImage;
    isImageNode = true;
  } else if (nodeType === 'Bolsa de PP5') { // Nuevo caso
    displayImage = bolsaPP5Image;
    isImageNode = true;
  } else if (nodeType === 'Contenedor de PP5') { // Nuevo caso
    displayImage = contenedorPP5Image;
    isImageNode = true;
  } else if (nodeType === 'Honey Tek') { // Nuevo caso
    displayImage = honeyTekImage;
    isImageNode = true;
  } else if (nodeType === 'Jeringa Original') { // Nuevo caso
    displayImage = jeringaImage;
    isImageNode = true;
  }

  return (
    <>
      {/* Handle para conexiones entrantes (arriba) */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

      {/* Renderizado condicional basado en si es un nodo con imagen personalizada o el tipo por defecto */}
      {isImageNode ? (
        // Si es un nodo con imagen personalizada (Placa Petri, Bote, Bolsa, etc.)
        <div style={{
            position: 'relative', // Necesario para el posicionamiento del overlay
            display: 'flex',
            flexDirection: 'column', // Apila los elementos verticalmente
            alignItems: 'center', // Centra horizontalmente los elementos apilados
            padding: 5, // Pequeño padding alrededor del contenido
            background: 'transparent', // Fondo transparente
            border: 'none', // Sin borde
        }}>
          {/* Overlay según el estado */}
          {overlayColor && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: overlayColor,
              borderRadius: '50%', // Para que coincida con la forma de la imagen
              zIndex: 1,
            }} />
          )}
          <img
            src={displayImage} // Usa la imagen determinada
            alt={nodeType} // Usa el tipo como alt text
            style={{
                display: 'block',
                maxWidth: '100%', // Asegura que la imagen quepa en el contenedor
                height: 'auto', // Mantiene la relación de aspecto
                objectFit: 'contain',
                position: 'relative', // Para que esté por encima del overlay
                zIndex: 2,
            }}
          />
           {/* Label debajo de la imagen en negrita */}
           <div style={{ 
             fontSize: 12, 
             fontWeight: 'bold', 
             color: '#ffffff', 
             marginTop: 5,
             position: 'relative',
             zIndex: 2,
           }}>
             {data.label}
           </div>
        </div>
      ) : (
        // Para otros tipos de nodo (los que no tienen imagen personalizada aún), renderiza un estilo por defecto
        <div style={{
            position: 'relative',
            padding: 10,
            border: 'none', // Sin borde
            borderRadius: 5,
            background: '#fff', // Puedes cambiar este fondo si quieres
            textAlign: 'center',
            minWidth: 100, // Ancho mínimo
        }}>
          {overlayColor && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: overlayColor,
              borderRadius: 5,
              zIndex: 1,
            }} />
          )}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {data.label} {/* Muestra el label del nodo */}
          </div>
        </div>
      )}

      {/* Handle para conexiones salientes (abajo) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a" // Se usa un ID si hay múltiples handles del mismo tipo en la misma posición
        isConnectable={isConnectable}
      />
    </>
  );
}

export default CustomNode;
