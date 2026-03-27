import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressorService {

  /**
   * Comprime una imagen usando Canvas de HTML5.
   * @param file El archivo original (File)
   * @param maxWidth Ancho máximo permitido (default: 1080)
   * @param quality Calidad JPEG de 0.0 a 1.0 (default: 0.8)
   * @returns Promesa con el archivo comprimido (File) o rechazo en caso de error
   */
  compressImage(file: File, maxWidth: number = 1080, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      // Validar que sea una imagen
      if (!file.type.match(/image.*/)) {
        reject(new Error('El archivo no es una imagen'));
        return;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Mantener el aspect ratio pero reducir la escala si es más ancha que maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2d del Canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como blob JPEG comprimido
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Error al generar el Blob de la imagen'));
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.onerror = (err) => reject(new Error('Error al cargar la imagen nativa.'));
    });
  }
}
