# Contrato de integración — DevCommunity

> Documento compartido por los cuatro integrantes. Antes de cambiar una decisión de este contrato, conversen y actualicen este archivo en GitHub para que todos trabajen sobre la misma versión.

## 1. Stack y reglas generales

- API REST con NestJS y TypeScript.
- MySQL con TypeORM.
- JWT y Passport para autenticación.
- bcrypt para hashes de contraseña.
- DTO y `class-validator` para entrada de datos.
- Swagger para documentar los endpoints.
- No guardar secretos en Git.
- Las escrituras requieren autenticación.
- No se debe confiar en el `userId` enviado por el cliente para determinar al autor: se obtiene de `request.user`.

## 2. Convención de entidades propuesta

Antes de implementarla, comprobar si el repositorio ya tiene nombres establecidos. Si no existen, usar estos nombres TypeScript consistentes:

### User
- `id`: identificador.
- `username`: nombre de usuario, si se exige en el registro.
- `email`: único.
- `password`: hash bcrypt; nunca se devuelve en respuestas.
- `role`: `ADMIN`, `MODERADOR` o `USUARIO`.
- Relaciones con publicaciones, comentarios y likes.

### Publication
- `id`.
- `title`.
- `content`.
- `createdAt`.
- `author`: relación con `User`.

### Comment
- `id`.
- `content`.
- `createdAt`.
- `author`: relación con `User`.
- `publication`: relación con `Publication`.

### Like
- `id` (opcional si la estrategia de clave compuesta existente no lo necesita).
- `user`: relación con `User`.
- `publication`: relación con `Publication`.
- Restricción única sobre la pareja usuario-publicación.

Si el proyecto ya utiliza entidades en español u otra convención coherente, no renombrarlas automáticamente: acordar una única convención y reflejarla aquí.

## 3. Roles y permisos

| Acción | USUARIO | MODERADOR | ADMIN |
|---|---|---|---|
| Crear publicación | Sí, autenticado | Sí, autenticado | Sí, autenticado |
| Listar/ver publicaciones | Sí | Sí | Sí |
| Editar publicación propia | Sí | Sí, si es autor | Sí |
| Editar publicación ajena | No | No, salvo requisito explícito adicional | Sí |
| Eliminar publicación propia | Sí | Sí | Sí |
| Eliminar publicación ajena | No | Sí | Sí |
| Crear comentario | Sí, autenticado | Sí, autenticado | Sí, autenticado |
| Editar comentario propio | Sí | Sí, si es autor | Sí, si es autor |
| Editar comentario ajeno | No | No | No, según el caso práctico |
| Eliminar comentario propio | Sí | Sí | Sí |
| Eliminar comentario ajeno | No | Sí | Confirmar el alcance exacto del caso antes de ampliar permisos |
| Dar/quitar like propio | Sí, autenticado | Sí, autenticado | Sí, autenticado |

**Fuente de permisos:** el caso práctico indica que la edición de publicaciones corresponde al autor o ADMIN; la eliminación de publicaciones, al autor, MODERADOR o ADMIN; la edición de comentarios, solo al autor; y la eliminación de comentarios, al autor o MODERADOR. No ampliar permisos silenciosamente.

## 4. Contrato de autenticación

El integrante 1 debe definir e informar a los demás:
- Estrategia JWT y duración del token.
- Forma exacta de `request.user` (incluidos `id` y `role`).
- Cómo importar y aplicar `AuthGuard`, `RolesGuard` y `@Roles()`.
- Cómo se serializa el usuario en la respuesta sin la contraseña.
- Nombres exactos de los roles y formato de errores de autenticación.

No inventar una estructura diferente en cada módulo. Actualizar este apartado cuando el integrante 1 confirme la implementación.

## 5. Rutas REST propuestas

Estas rutas son una propuesta inicial; comprobar las rutas existentes y actualizarlas si el equipo acuerda otra convención.

### Autenticación
- `POST /auth/register`
- `POST /auth/login`

### Publicaciones
- `POST /publications`
- `GET /publications`
- `GET /publications/:id`
- `PATCH /publications/:id`
- `DELETE /publications/:id`

### Comentarios
- `POST /publications/:publicationId/comments`
- `GET /publications/:publicationId/comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`

### Likes
- `POST /publications/:publicationId/likes`
- `DELETE /publications/:publicationId/likes`
- `GET /publications/:publicationId/likes/count`

Todas las rutas de escritura requieren autenticación. Las lecturas pueden ser públicas si el equipo confirma que no contradice otros requisitos.

## 6. Relaciones y consistencia

- Un `User` puede crear muchas `Publication`.
- Un `User` puede crear muchos `Comment`.
- Una `Publication` puede tener muchos `Comment`.
- `Like` relaciona un `User` con una `Publication`.
- Un usuario puede dar como máximo un like a una publicación.
- La base de datos debe imponer una restricción única por usuario y publicación.
- Al eliminar una publicación, sus comentarios deben eliminarse mediante cascada o lógica controlada y segura. Definir también el borrado de likes para evitar registros huérfanos.
- No usar sincronización destructiva de TypeORM en una base de datos con datos importantes. Coordinar migraciones.
- **Dependencia de integración de comentarios:** el módulo de comentarios implementado usa la tabla `publications` con una columna `id` entera para comprobar la publicación al crear y listar comentarios. Como la entidad y la migración de publicaciones aún no están integradas, la migración actual de comentarios no crea todavía la clave foránea a `publications`. El módulo de publicaciones debe confirmar este nombre y tipo de ID, añadir/coordinar la clave foránea `comments.publicationId` con borrado en cascada y asegurar que su migración cree `publications` antes de añadir esa restricción.

## 7. Formato de errores y respuestas

- Usar códigos HTTP apropiados: `400`, `401`, `403`, `404`, `409` y los códigos de éxito correspondientes.
- Mantener respuestas consistentes con el patrón que ya tenga el proyecto.
- No exponer hashes, secretos, tokens ajenos ni detalles internos de errores.
- Documentar en Swagger los parámetros, DTO, respuestas y errores relevantes.

## 8. Propiedad y coordinación

- Integrante 1: autenticación, usuarios y roles.
- Integrante 2: publicaciones.
- Integrante 3: comentarios.
- Integrante 4: likes, revisión del modelo de datos, documentación y apoyo de integración.

Antes de modificar una interfaz compartida, comunicar el cambio, actualizar este contrato y coordinarlo con el responsable del módulo afectado.

## 9. Decisiones pendientes por confirmar

- Nombres definitivos de entidades, tablas y propiedades según el código real.
- Si el rol se guarda como enum/campo o entidad relacional.
- Campos exactos del registro.
- Prefijo global de rutas, si existe.
- Política de lecturas públicas o protegidas.
- Formato común de respuestas y errores.
- Estrategia de migraciones y entorno de pruebas.
- Integración de la entidad/tabla `publications` con `comments.publicationId`, incluida la clave foránea y la cascada de borrado descritas en la sección 6.

No asumir que estas decisiones están implementadas hasta verificarlas.
