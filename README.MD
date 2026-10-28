# Guía de instalación y ejecución

Este proyecto necesita varias herramientas y servicios para funcionar correctamente.

## 1) Requisitos previos

### Node.js y npm
Instala la versión LTS de Node.js (recomendada 20.x o superior).

- Descargar: https://nodejs.org/
- Verificar instalación:
  ```bash
  node -v
  npm -v
  ```

### PostgreSQL
Este proyecto usa PostgreSQL como base de datos.

- Descargar PostgreSQL: https://www.postgresql.org/download/
- Durante la instalación, anota:
  - usuario: `postgres` (o el que configures)
  - contraseña
  - puerto: `5432`

Opcional pero muy útil:
- pgAdmin: https://www.pgadmin.org/download/

### Git (opcional pero recomendado)
- Descargar: https://git-scm.com/

## 2) Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd tp13Back
```

## 3) Instalar dependencias
Dentro de la carpeta del proyecto ejecuta:

```bash
npm install
```

Esto instalará todas las librerías necesarias del proyecto.

## 4) Crear la base de datos
Con PostgreSQL, crea una base de datos para el proyecto, por ejemplo:

```sql
CREATE DATABASE tp13final;
```

Luego crea el esquema necesario con las migraciones o con los scripts del proyecto. Si existe una migración SQL, ejecútala en la base de datos.

## 5) Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto con este contenido base:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/tp13final
JWT_SECRET=mi_clave_secreta_super_segura
OPEN_LIBRARY_API_KEY=
```

### Explicación de cada variable
- `PORT`: puerto en el que corre la API
- `DATABASE_URL`: conexión a PostgreSQL
- `JWT_SECRET`: clave para firmar tokens JWT
- `OPEN_LIBRARY_API_KEY`: clave opcional para la API de Open Library (si la usas con una cuenta de acceso)

## 6) Instalar PostgreSQL en Windows (si no lo tienes)
Si estás en Windows, normalmente debes:

1. Instalar PostgreSQL desde el instalador oficial.
2. Instalar la herramienta `pgAdmin` (opcional).
3. Iniciar el servicio de PostgreSQL.
4. Crear la base de datos y el usuario según tu configuración.

## 7) Ejecutar el proyecto
### Modo desarrollo
```bash
npm run dev
```

### Producción
Primero compilar:
```bash
npm run build
```
Y luego correr:
```bash
npm start
```

## 8) Verificar que funciona
Después de iniciar la app, puedes probar la API en:

```text
http://localhost:3000
```

## 9) Dependencias del proyecto
Estas son las librerías principales que se instalan con `npm install`:

- express
- dotenv
- jsonwebtoken
- pg
- typescript
- tsx
- @types/node
- @types/express
- @types/jsonwebtoken
- @types/pg

## 10) Comandos útiles
```bash
npm install
npm run dev
npm run build
npm run start
npm test
```

## 11) Posibles problemas comunes

### Error de conexión a PostgreSQL
Revisa que:
- PostgreSQL esté corriendo
- la base de datos exista
- `DATABASE_URL` sea correcta
- el usuario/contraseña estén bien

### Error de puerto ocupado
Cambia la variable `PORT` en el `.env`.

### Error de JWT o API key
Verifica que `JWT_SECRET` y `OPEN_LIBRARY_API_KEY` estén definidos correctamente.

## 12) Resumen rápido
Si todo está listo, en la raíz del proyecto debes hacer:

```bash
npm install
npm run dev
```

Y asegurarte de tener PostgreSQL corriendo con la base de datos configurada.
