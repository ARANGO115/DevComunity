# Integración de usuarios, autenticación y roles

## Contrato propuesto

El repositorio no contiene `CONTRATO_INTEGRACION.md`. Hasta que el equipo confirme otro esquema, esta implementación establece una relación de un rol por usuario. Las entidades usan las tablas `users` y `roles`; `User` tiene `id`, `name`, `email`, `passwordHash`, `role` y `createdAt`. `Role` usa `id` y `name`. Los identificadores son enteros autogenerados y `email` es único y normalizado a minúsculas.

Los valores de rol son exactamente `ADMIN`, `MODERADOR` y `USUARIO`. El registro público siempre asigna `USUARIO`; el cliente no puede enviar un rol. Los tres registros se crean/actualizan al iniciar la aplicación, después de aplicar la migración.

## Rutas

- `POST /auth/register`: recibe `{ "name": "...", "email": "...", "password": "..." }`; devuelve `201` y `{ "id", "name", "email", "role" }`. La contraseña requiere entre 8 y 72 caracteres, y no puede exceder 72 bytes UTF-8.
- `POST /auth/login`: recibe `{ "email": "...", "password": "..." }`; devuelve `200` con `{ "access_token": "...", "token_type": "Bearer", "user": { "id", "name", "email", "role" } }`.

Las respuestas no incluyen la contraseña ni el hash. Se conserva el formato de error HTTP predeterminado de Nest (`{ "statusCode": ..., "message": ..., "error": "..." }`); por ejemplo, una validación fallida usa `400` y un arreglo `message`, credenciales inválidas/token inválido usan `401`, correo duplicado `409` y rol requerido no autorizado `403`. El login usa un mensaje genérico para credenciales incorrectas. No se introduce un filtro global de errores propio.

## Protección en los módulos

Importa `AuthModule` y `RolesModule` en el módulo que protege los controladores. `JwtAuthGuard` valida el bearer token y `RolesGuard` compara `request.user.role` con los roles del decorador:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERADOR)
@Get('recurso-protegido')
findProtectedResource() {
  // request.user está disponible en los handlers mediante @Req().
}
```

`request.user` es `{ id: number, name: string, email: string, role: UserRole }`. La estrategia vuelve a consultar al usuario en la base de datos en cada petición, de modo que las bajas y cambios de rol tienen efecto aunque el token no haya expirado.

Sin `@Roles()`, `RolesGuard` permite el acceso y la autenticación queda a cargo de `JwtAuthGuard`. Las rutas de registro e inicio de sesión son públicas.

El módulo no ofrece una ruta pública para conceder `ADMIN` o `MODERADOR`. El equipo debe acordar un mecanismo privilegiado de aprovisionamiento de esos roles antes de desplegar funcionalidades administrativas.

## Entorno y base de datos

Copia `.env.example` a `.env` y configura `PORT`, `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SYNCHRONIZE`, `DB_LOGGING`, `JWT_SECRET` y `JWT_EXPIRES_IN`. `JWT_SECRET` debe ser un secreto aleatorio propio de al menos 32 caracteres; no uses el texto de ejemplo ni lo guardes en el repositorio. `DB_SYNCHRONIZE` se mantiene en `false`.

Con la base de datos MySQL configurada, ejecuta `npm run migration:run` para crear las tablas antes de iniciar el servicio. La aplicación no ejecuta migraciones automáticamente. `RolesService` asegura los tres roles al arrancar; el inicio falla explícitamente si el esquema no está instalado o la base de datos no está disponible.

Swagger está publicado en `/docs`; se puede autorizar una sesión usando el esquema bearer JWT.
