<img src="https://user-images.githubusercontent.com/22210428/27618960-af79900e-5c02-11e7-916f-e56725ff3d13.png" width="100"> 

## Jot Server

Jot Server is the server-side component of UNA Messenger, designed to support multiple sites with the UNACMS **Messenger** module, enabling real-time messaging.

### How to Install the Jot Server

1. **Install Node.js and npm package manager**:
 - Ensure you have the latest stable Node.js version (up to **14.x.x**) and npm on your server. For more details, visit [Node.js](https://nodejs.org/).

2. **Download Jot Server**:
 - Download the latest release from [GitHub](https://github.com/unacms/jot-server/releases).
 - Downloaded and unzip file and upload the **jot-server** folder to your server.

3. **Configure Jot Server**:
 - Edit the `config/config.json` file in the **jot-server** folder. Ensure you follow the JSON format rules carefully.
```js
{
  /* The port number on which the server will run */
  "port": 5443,

  /* The mode in which the server runs.
     "development" mode allows real-time viewing of request and response details.
     Leave this empty for production environments. */
  "mode": "development",

  /* The file used to log errors and warnings that may occur */
  "log": "log.log",

  /* A list of allowed IP addresses that can connect to the server.
     Specify individual IPs like "127.0.0.1", "127.0.0.2", or use "*" to allow any IP to connect. 
     (Using "*" allows any domain to use your server for the Jot Messenger module) */
  "domains": ["*"],

  /* The transformer used by Primus, with "sockjs" selected as the default due to its stability.
     Learn more about transformers on the Primus page: https://github.com/primus/primus */
  "transformer": "sockjs",

  /* Fill in the fields below if you have an HTTPS server (recommended) */
  "root": "/folder/with/https/cert/files",
  "cert": "myfilename.cert",
  "key": "myfilename.key"
}
 ```
4. **Install Dependencies**:
 - Navigate to the Jot Server root folder (where the `package.json` file is located).
 - Run the following command to install all necessary dependencies:
   ```bash
   npm install
   ```

5. **Start the Server**:
 - Start the server by running the `app.js` file. You can use any tool that allows running a Node.js application as a background service (e.g., forever, PM2).
 - Example using **forever**:
  - Install forever globally on the server:
    ```bash
    npm install -g forever
    ```
  - Start the Jot Server:
    ```bash
    forever start app.js
    ```

 - If you are using an HTTPS server with certificates, make Jot Server watch for changes in the certificate folder:
   ```bash
   forever -w --watchDirectory=/path/to/certificates start app.js
   ```
   Ensure the path to the certificate folder matches the `root` parameter value in the `config.json` file.

### Docker

You can also run Jot Server in a Docker container:
```bash
docker run -p 5000:5000 -d unaio/jot-server:latest
```