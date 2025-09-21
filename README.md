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
sudo docker build -t money-app .
sudo docker run -d --publish 3000:3000 --env-file ./.env money-app
```

