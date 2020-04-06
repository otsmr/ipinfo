const fs = require("fs");

const getConfig = exports.getConfig = () => {
    
    try {
        
        return JSON.parse(fs.readFileSync("./config.json").toString());

    } catch (error) {
        console.log(error);
        return {}
    }

}

function getRand(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

exports.setNextUpdateDate = () => {

    const config = getConfig();

    
    const date = new Date();
    date.setDate(1);
    const newDate = new Date(date.setMonth(date.getMonth()+1));

    config.nextUpdate.year = newDate.getFullYear();
    config.nextUpdate.month = newDate.getMonth();
    config.nextUpdate.day = getRand(2, 6);

    fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));

}

exports.formatBytes = (bytes,decimals) => {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.checkForUpdate = () => {

    const config = getConfig();

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    if (
        config.nextUpdate.year <= year &&
        config.nextUpdate.month <= month &&
        config.nextUpdate.day <= day
    ) {
        return true;
    }
    return false;

}