import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';

// Esta función se usará para guardar una planificación de placas con nodos asociados
export async function guardarPlanificacion({ nutrientes, placas, nodosAsociados }) {
  try {
    // Crear el documento con la estructura especificada
    const docRef = await addDoc(collection(db, 'planificacionesPlacas'), {
      fecha: Timestamp.now(),
      nutrientes: {
        alto: nutrientes.alto,
        medio: nutrientes.medio,
        bajo: nutrientes.bajo
      },
      placas: placas.map(placa => ({
        id: placa.id,
        tipo: placa.tipo,
        nodoAsociado: placa.nodoAsociado
      })),
      nodosAsociados: nodosAsociados
    });

    // Retornar el ID del documento creado
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar la planificación:', error);
    throw new Error('No se pudo guardar la planificación');
  }
}
