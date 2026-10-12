# Instrucciones de GitHub Copilot — DevCommunity

## Contexto del proyecto
DevCommunity es una API REST tipo foro para que usuarios autenticados publiquen contenido, comenten y reaccionen con likes. Debe implementar control de acceso por roles y persistencia en MySQL.

## Stack obligatorio del caso práctico
- NestJS y TypeScript.
- MySQL con TypeORM.
- `@nestjs/jwt` y `@nestjs/passport`.
- bcrypt para contraseñas.
- DTOs para creación y actualización.
- `class-validator` y `class-transformer`.
- `AuthGuard`, `RolesGuard` y decorador personalizado `@Roles()`.
- Variables de entorno.
- Swagger para documentar y probar la API.

## Antes de modificar código
1. Inspecciona la estructura y el código real del repositorio.
2. Lee `Caso Práctico 4.pdf`, `Análisis e implementación DevCommunity.txt` y `CONTRATO_INTEGRACION.md` si están disponibles.
3. Comprueba `package.json`, versiones de dependencias, entidades, módulos, controladores, servicios, DTO, Guards, configuración y pruebas.
4. Resume brevemente qué existe y qué falta antes de implementar.
5. No sustituyas archivos funcionales ni dupliques entidades sin una razón comprobable.

## Reglas compartidas
- Respeta el módulo asignado al integrante en el prompt particular.
- No supongas que el trabajo de otros integrantes ya existe en la copia local.
- No inventes nombres ni firmas que contradigan el contrato de integración.
- No crees una segunda entidad para Usuario/User, Publicación/Publication, Comentario/Comment o Like/Reaction si ya hay una entidad acordada.
- Si falta una interfaz de otro módulo, documenta la dependencia; no simules que ya existe.
- Coordina cambios a entidades, rutas, roles o relaciones compartidas antes de implementarlos.
- No afirmes que algo compila, funciona o pasó pruebas si no lo ejecutaste y verificaste.

## Seguridad
- Nunca guardes contraseñas en texto plano ni devuelvas hashes.
- No aceptes un rol privilegiado desde el registro público.
- Obtén la identidad del autor desde el usuario autenticado, no desde un identificador confiado del cuerpo de la petición.
- Protege todas las acciones de escritura con autenticación.
- Aplica autorización en el backend, no solo en el frontend.
- Valida entradas con DTO y `class-validator`.
- No subas `.env`, credenciales, tokens ni secretos al repositorio.
- Maneja errores HTTP de manera consistente sin exponer información sensible.
- La unicidad de likes debe estar protegida también por una restricción de base de datos.
- Respeta las reglas de borrado de comentarios y reacciones definidas en el contrato.

## Entrega de cada integrante
Al finalizar, informa:
1. Archivos creados y modificados.
2. Funcionalidades y endpoints implementados.
3. Contratos o interfaces que otros módulos necesitan.
4. Variables de entorno, migraciones y configuración necesarias.
5. Pruebas realmente ejecutadas y sus resultados.
6. Problemas o dependencias pendientes.

El prompt particular del integrante define su alcance. Si contradice el PDF o el contrato compartido, explica el conflicto antes de decidir.
