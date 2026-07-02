# C8L Music IA: Preparación de Sistema Operativo y Aplicación Android

Esta carpeta contiene la documentación, configuraciones y guías preliminares necesarias para empaquetar, compilar y ejecutar **C8L Music IA** de forma nativa en dispositivos Android, sentando las bases para una futura integración a nivel de sistema operativo (ROM o App del sistema).

## Estructura del Entorno

Para envolver la aplicación Next.js y dotarla de capacidades nativas en Android, utilizamos **Capacitor** de Ionic.

### Pasos Iniciales para Empaquetar
1. Instalar dependencias nativas en la raíz del proyecto:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
2. Inicializar Capacitor:
   ```bash
   npx cap init "C8L Music IA" "com.c8l.music.ia" --web-dir=out
   ```
3. Agregar la plataforma Android:
   ```bash
   npx cap add android
   ```
4. Generar el build estático de Next.js y sincronizarlo:
   ```bash
   npm run build
   npx cap sync
   ```
5. Abrir el proyecto en Android Studio:
   ```bash
   npx cap open android
   ```

## Características Nativas Requeridas para Música IA

Para lograr una experiencia de reproducción premium fluida (sin latencias ni microcortes):
1. **Background Audio**: Permitir que la música siga reproduciéndose cuando el usuario apague la pantalla o minimice la aplicación.
2. **Audio Cache Manager**: Almacenar localmente los archivos `.mp3` de los Stems (vocals, melody, bass, drums) para evitar llamadas de red repetitivas.
3. **Media Session Controls**: Mostrar la carátula de la canción, el título y los controles de reproducción (play, pause, next) directamente en el panel de notificaciones y la pantalla de bloqueo de Android.

Consulte el archivo `AndroidManifest_snippet.xml` para ver la declaración de permisos y servicios requeridos para estas capacidades.
