<img src="https://user-images.githubusercontent.com/22210428/27618960-af79900e-5c02-11e7-916f-e56725ff3d13.png" width="200" align="left"> ## Jot Server




Jot server allows to work with any number of domains with UNA **Jot Messenger** module and Profiles on each domain.





### How to install server

1. Install the latest stable Node js version (up to **6.x.x** version) on your server. More details about node js installation you may read here https://nodejs.org/
2. Upload **Jot Server** files to any folder on your server
3. Edit **Jot Server** config file ```config/config.json```. You need to be careful and keep jason format rules to change it.

```js
{
        /* Port on which you would like to run the server */
        "port":3000,
       
        /* development mode allows to see details of request and response in real time when server is running,
        you may leave it empty when run the server in production */
        "mode":"development",
       
        /* This file will be used as log file for errors and warnings which may occur */
        "log":"log.log",
       
        /* Domains list of allowed domains connected to the server.
        You may put domains one by one as "127.0.0.1","127.0.0.2" or just use "*"
        (in this case any domain may use your server for Jot Messenger module) */
        "domains":["*"],
       
        /* It is transformer which is used for Primus by default. We chosen sockjs,
        because it most stable in our opinion. You may read more about transformers on
        primus page https://github.com/primus/primus */
        "transformer":"sockjs",
       
        /* If you have https servers (recommended) you need to fill 3 fields below */
        root: '/folder/with/https/cert/files',
        cert: 'myfilename.cert',
        key: 'myfilename.cert',
       
        /* Profile Status constants, don't need to change them */
        "OFFLINE":0,
        "ONLINE":1,       
        "AWAY":2
 }
 ```
 4. All server's dependencies must be installed. You need to go to the Jot Server root folder (where ```package.json``` file is located)
 and run command
 
 ```npm install```
 
 5. Now server can be started by running the **app.js** file.
 You may use any of available for node js tools, which allow to run application permanently.
 
 Example: **forever** (https://github.com/foreverjs/forever).
 Install it globally on the server and then you may run the server using this command
 
 ```forever start app.js```
