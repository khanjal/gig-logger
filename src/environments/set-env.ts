const setEnv = () => {
    const fs = require('fs');
    const writeFile = fs.writeFile;
  // Configure Angular `environment.ts` file path
    const targetPath = './src/environments/environment.ts';
  // Load node modules
    const colors = require('colors');
    const appVersion = require('../../package.json').version;
    require('dotenv').config({
        path: 'src/environments/.env'
    });
  // `environment.ts` file structure
    console.log(`Client Email: ${process.env["client_email"]}`);
    const envConfigFile = `export const environment = {
    client_email: '${process.env["client_email"]}',
    private_key: '${process.env["private_key"]}',
    appVersion: '${appVersion}',
    production: true,
    };
    `;
    console.log(colors.magenta('The file `environment.ts` will be written with the following content: \n'));
    writeFile(targetPath, envConfigFile, (err: any) => {
        if (err) {
            console.error(err);
            throw err;
        } else {
            console.log(colors.magenta(`Angular environment.ts file generated correctly at ${targetPath} \n`));
        }
    });
};

setEnv();