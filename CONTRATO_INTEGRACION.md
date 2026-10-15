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

En el código actual, la entidad equivalente se denomina `Reaccion` y se persiste
en `reacciones`, manteniendo la convención en español ya existente. Sus
relaciones son `user` y `publication`; no debe crearse una segunda entidad
`Like`.

Si el proyecto ya utiliza entidades en español u otra convención coherente, no renombrarlas automáticamente: acordar una única convención y reflejarla aquí.

### Implementación vigente de publicaciones
- La clase TypeScript existente es `Publicacion`, mapeada a la tabla `publications`.
- Sus propiedades son `id`, `title`, `content`, `createdAt` y `author`; la FK `authorId` referencia `users.id`.
- Los DTO permiten `title` de hasta 255 caracteres y `content` de hasta 16 000 caracteres, sin permitir que el cliente establezca el autor.

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

### Usuarios y roles (integrante 1)
- `POST /users` — crear una cuenta como ADMIN; si se omite el rol se asigna `USUARIO`.
- `GET /users` — listar usuarios como ADMIN.
- `GET /users/:id` — consultar un usuario como ADMIN.
- `PATCH /users/:id` — actualizar nombre, correo, contraseña o rol como ADMIN.
- `DELETE /users/:id` — eliminar un usuario como ADMIN; se rechaza el borrado propio o si hay publicaciones, comentarios o reacciones asociadas.
- `GET /roles` — listar los roles disponibles como ADMIN.

Los roles son los valores fijos de `UserRole` (`ADMIN`, `MODERADOR`, `USUARIO`); no se crean, modifican ni eliminan por API. Las respuestas administrativas de usuarios no incluyen contraseña ni hash. El registro público continúa en `POST /auth/register` y no permite elegir un rol privilegiado.

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

El módulo de comentarios implementa estas rutas. El cuerpo de creación y edición contiene `content` (cadena no vacía de hasta 2000 caracteres); el autor se obtiene de `request.user`. La respuesta solo expone `id`, `content`, `publicationId`, `author` (`id`, `name`) y `createdAt`. Solo el autor puede editar; el autor o MODERADOR puede eliminar. La consulta por publicación es pública.

### Likes
- `POST /publications/:publicationId/likes`
- `DELETE /publications/:publicationId/likes`
- `GET /publications/:publicationId/likes/count`

La implementación actual devuelve `409` para un like repetido, `404` para una
publicación inexistente y `204` al retirar correctamente el like propio.

Todas las rutas de escritura requieren autenticación. Las lecturas pueden ser públicas si el equipo confirma que no contradice otros requisitos.

## 6. Relaciones y consistencia

- Un `User` puede crear muchas `Publication`.
- Un `User` puede crear muchos `Comment`.
- Una `Publication` puede tener muchos `Comment`.
- `Like` relaciona un `User` con una `Publication`.
- Un usuario puede dar como máximo un like a una publicación.
- La base de datos debe imponer una restricción única por usuario y publicación.
- Al eliminar una publicación, sus comentarios deben eliminarse mediante cascada o lógica controlada y segura. Definir también el borrado de likes para evitar registros huérfanos.
- El módulo de publicaciones no define relaciones con comentarios ni reacciones mientras esas entidades estén pendientes. Los módulos responsables deben usar FK con `ON DELETE CASCADE` o acordar una eliminación transaccional antes de crear esas tablas; la migración de publicaciones por sí sola no resuelve esa dependencia.
- No usar sincronización destructiva de TypeORM en una base de datos con datos importantes. Coordinar migraciones.
- El módulo integrado usa `Publicacion` (`publicaciones`) y `Comentario` (`comentarios`) con una relación muchos-a-uno. La migración `CreatePublicationsCommentsAndReactions1760400000000` crea ambas tablas y configura `ON DELETE CASCADE` de publicación a comentarios. El servicio de comentarios valida y consulta publicaciones mediante el repositorio de `Publicacion`; no mantiene una entidad paralela ni una tabla redundante.

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

No asumir que estas decisiones están implementadas hasta verificarlas.
