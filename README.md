# DevCommunity

API REST tipo foro para publicaciones, comentarios y likes, desarrollada con NestJS, TypeScript, TypeORM y MySQL.

## Requisitos

- Node.js compatible con la versión de NestJS del proyecto.
- npm.
- MySQL.
- Git.

## Preparación local

1. Clona el repositorio y entra en su carpeta.
2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` como `.env` y configura tus valores locales.
4. Crea la base de datos indicada por `DB_DATABASE` y configura el usuario de MySQL.
5. Revisa la configuración real de TypeORM y ejecuta las migraciones o el procedimiento de base de datos definido por el proyecto.
6. Inicia el modo desarrollo:

   ```bash
   npm run start:dev
   ```

Consulta `package.json` antes de usar comandos si los scripts del repositorio tienen otros nombres.

## Documentación de la API

Swagger debe habilitarse en el código de NestJS. Cuando esté configurado, consulta la ruta que defina `src/main.ts` (por ejemplo, `/api` o `/api-docs`). No se asume una ruta hasta verificarla en el código.

## Documentos de equipo

- `.github/copilot-instructions.md`: contexto y reglas compartidas para Copilot.
- `CONTRATO_INTEGRACION.md`: acuerdos de entidades, roles, rutas y relaciones.
- `Caso Práctico 4.pdf`: enunciado original del ejercicio, si el equipo lo conserva en el repositorio.
- `Análisis e implementación DevCommunity.txt`: guía general de implementación, si el equipo la conserva en el repositorio.

## Responsabilidades del equipo

- Integrante 1: usuarios, autenticación, JWT y roles.
- Integrante 2: publicaciones.
- Integrante 3: comentarios.
- Integrante 4: likes, revisión del modelo de datos, documentación y apoyo de integración.

Cada integrante debe trabajar sobre una copia actualizada del repositorio y respetar el contrato compartido.

## Seguridad

- No subas `.env` ni secretos.
- No uses contraseñas reales en documentación.
- No ejecutes migraciones destructivas sobre bases de datos con información que debas conservar.
- Verifica pruebas y compilación antes de declarar una tarea terminada.
