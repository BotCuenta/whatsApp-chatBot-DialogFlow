# WhatsApp Chatbot con API Oficial de Meta y Dialogflow ES de Google.

Este proyecto es un chatbot de WhatsApp desarrollado utilizando la API oficial de Meta y la integración con Dialogflow de Google para procesamiento de lenguaje natural, además de utilizar BuilderBot.

## Requisitos

- **Node.js**: Se necesita una versión de Node.js mayor a `v20.10.0`.
- **Claves de API**: Se requieren claves de API de Meta y Google para que el chatbot funcione correctamente.

## Configuración

### 1. Instalar dependencias

Primero, instala las dependencias necesarias ejecutando el siguiente comando en el directorio del proyecto:

```
npm install
```

### 2. Configurar las claves de la API de Meta

Para utilizar las APIs de Meta y Google, asegúrate de agregar tus claves de API correspondientes:

#### Clave de Meta

Primero debes crear tu aplicación en Meta en el <a target="_blank" href="https://developers.facebook.com/">Sitio Oficial</a> y Agrega las claves de Meta en un archivo .env de la siguiente manera:

```
PORT=3008
JWT_TOKEN=your_meta_jwt_token
NUMBER_ID=your_number_id
VERIFY_TOKEN=your_verify_token
```

#### Clave de Google

La clave de Google debe estar en un archivo JSON que se puede descargar desde la consola de <a target="_blank" href="https://console.cloud.google.com/">Google Cloud</a>. Guarda este archivo dentro de la carpeta raiz del proyecto y especifica la ruta en el archivo .env:

```
GOOGLE_APPLICATION_CREDENTIALS=./ruta/al/archivo_google_key.json
```

### 3. Iniciar el servidor en modo de desarrollo

Para ejecutar el chatbot en modo de desarrollo, utiliza:

```
npm run dev
```

Esto iniciará el servidor y habilitará el chatbot en el entorno de desarrollo.

## Uso

Una vez que el servidor esté en ejecución, el chatbot estará disponible para responder a los mensajes de WhatsApp mediante la API de Meta, utilizando las capacidades de Dialogflow para procesar las consultas y responder de manera inteligente.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar el proyecto, por favor haz un fork, realiza tus cambios y envía un pull request. 😎
