import React from 'react';
import { Handle, Position } from 'reactflow';

// Importa la imagen de la placa petri
// Asegúrate de que la ruta sea correcta según la ubicación real de tu carpeta assets
import petridishImage from 'C://Users/Jonathan/Desktop/mycotrack/src/assets/petri.png'; 

function CustomNode({
  data, // data contiene las propiedades del nodo guardadas en Firestore
  isConnectable, // propiedad de React Flow para indicar si el nodo es conectable
}) {
  const nodeType = data.tipo;

  return (
    <>
      {/* Handle para conexiones entrantes (arriba) */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

      {/* Renderizado condicional basado en el tipo de nodo */}
      {nodeType === 'Placa Petri' ? (
        // Si es Placa Petri, muestra la imagen
        <div style={{
            // Estilos para el contenedor de la imagen para que actúe como el nodo
            width: 80, // Ajusta el tamaño según necesites
            height: 80, // Ajusta el tamaño según necesites
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%', // Para darle forma redonda si la imagen es cuadrada
            overflow: 'hidden', // Asegura que la imagen respete el borde redondo
            border: '2px solid #555', // Borde opcional para visualización
            background: 'transparent', // Permite ver la transparencia de la imagen
            // Puedes añadir más estilos si es necesario
        }}>
          <img
            src={petridishImage}
            alt="Placa Petri"
            style={{
                display: 'block',
                maxWidth: '100%', // Asegura que la imagen quepa en el contenedor
                maxHeight: '100%',
                objectFit: 'contain', // Mantiene la relación de aspecto
            }}
          />
           {/* Puedes añadir el label u otra info superpuesta si quieres */}
           {/* <div style={{ position: 'absolute', fontSize: 12, color: '#fff', textShadow: '1px 1px 2px #000' }}>{data.label}</div> */}
        </div>
      ) : (
        // Para otros tipos de nodo, renderiza un estilo por defecto (como un rectángulo simple)
        <div style={{
            padding: 10,
            border: '1px solid #ddd',
            borderRadius: 5,
            background: '#fff',
            textAlign: 'center',
            minWidth: 100, // Ancho mínimo
        }}>
          {data.label} {/* Muestra el label del nodo */}
          {/* Puedes añadir más data aquí si es relevante para la vista por defecto */}
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
