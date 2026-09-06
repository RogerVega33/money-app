# Money app Backend

Money app te ayuda a llevar un registro de tus gastos

## Installation

### Node
Editar las variables de entorno en el archivo .env (o crearlo en caso de que no exista). El archivo .env.example sirve de guía.

#### Secreto de autenticación

Antes de iniciar el backend, configura `JWT_SECRET` en `.env` o en las variables
del entorno. Es obligatorio en todos los entornos, incluido desarrollo: el
servidor no arranca si falta, está vacío o tiene menos de 32 bytes sin contar
espacios en los extremos. La longitud mínima no garantiza aleatoriedad; 
para una mayor seguridad genera el valor con:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado en `JWT_SECRET` y mantenlo privado, fuera de Git. Usa el mismo
valor entre reinicios e instancias del backend. Al cambiarlo, las sesiones
existentes dejan de ser válidas y tendrás que iniciar sesión nuevamente.


Para iniciar el servidor ejecutar:

```bash
npm install
npm run start
```

### Docker compose
Editar las variables de entorno en el archivo .env.

Ejecutar:

```bash
docker-compose up
```

### Docker
Editar las variables de entorno en el archivo .env.

Ejecutar:

```bash
docker build -t money-app .
docker run -d --publish 3000:3000 --env-file ./.env money-app
```

## CORS
El backend utiliza un whitelist de orígenes permitidos para controlar el acceso mediante CORS cuando la variable de entorno API_ENV tiene un valor distinto a dev.

Para configurar la lista se debe modificar la variable de entorno CORS_ORIGIN definiendo los orígenes permitidos separados por comas.

Ejemplo:

```bash
CORS_ORIGIN=http://localhost:8080,https://miapp.com,https://admin.miapp.com
```
