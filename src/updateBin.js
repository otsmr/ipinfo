const { DownloaderHelper } = require("node-downloader-helper");
const fs = require("fs");
const Zip = require('adm-zip');

const {
    getConfig,
    setNextUpdateDate,
    formatBytes
} = require("./utils/utils");

const updateReady = (callBack, status) => {

    const config = getConfig();
    const filePath = __dirname + "/../bin/";
    const fileName = `${config.ip2location.databasecode}.zip`;
    const zipFile = filePath + fileName;
    const binPath = filePath + `IP2LOCATION-LITE-DB9.IPV6.BIN`;

    try {
        fs.unlinkSync(binPath);
    } catch (error) {}
    
    setTimeout(() => {

        status("Update wird verarbeitet");
        try {

            const zip = new Zip(zipFile);
            
            zip.extractEntryTo("IP2LOCATION-LITE-DB9.IPV6.BIN", filePath, false);

            setTimeout(() => {
                fs.unlinkSync(zipFile);
                status("Update abgeschlossen");
                callBack();
                setNextUpdateDate();
            }, 1000);

        } catch (error) {
            console.log(error);
        }

    }, 100);

}

module.exports = (callBack, status = () => {}) => {

    const config = getConfig();
    const filePath = __dirname + "/../bin/";
    const fileName = `${config.ip2location.databasecode}.zip`;
    const zipFile = filePath + fileName;

    if (fs.existsSync(zipFile)) {
        updateReady(callBack, status);
        return;
    }

    status("Liste wird aktualisiert.");

    try {
        fs.unlinkSync(filePath + fileName);
    } catch (error) {}

    const downloadUrl = `https://www.ip2location.com/download/?token=${config.ip2location.token}&file=${config.ip2location.databasecode}`;
    
    const download = new DownloaderHelper(downloadUrl, filePath, {
        fileName
    });

    download.on("error", () => {
        status('Download fehlgeschlagen');
        callBack();
    })

    download.on('end', () => {
        status('Heruntergeladen');
        setTimeout(() => {
            updateReady(callBack, status);
        }, 500);
    })

    download.on("progress", (stats) => {
        status(`${formatBytes(stats.downloaded)}/${formatBytes(stats.total)}  (${Math.round(stats.progress)}% - ${formatBytes(stats.speed)}/s)`);
    });

    download.start();

}