# Money app Backend

Money app te ayuda a llevar un registro de tus gastos

## Installation

### Node
Editar las variables de entorno en el archivo config.js.

Ejecutar:

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