const dns = require('dns')
const http = require('http');
const express = require("express");
const fs = require("fs");
const updateBin = require("./updateBin");
const ip2loc = require("./utils/ip2location");

const ipRegEx = /(^\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$)/
const hostNameRegEx = /|(^\s*((?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?)\s*$)/;

const {
    checkForUpdate
} = require("./utils/utils");

const binPath = __dirname + "/../bin/IP2LOCATION-LITE-DB9.IPV6.BIN";

ip2loc.IP2Location_init(binPath);

const getLocationForIP = (ip, callBack, res) => {

    if (!ipRegEx.test(ip)) {
        return res.send({
            status: "Keine gültige IP-Adresse"
        })
    }

    dns.lookupService(ip, 22, (err, hostname, service) => {
        if (hostname === "localhost") {
            return callBack({
                error: true
            });
        }
        getLocationForIP2(ip, hostname, callBack);
    });

}

const getLocationForIP2 = (ip, hostname, callBack) => {

    let result = { error: true }

    try {

        const data = ip2loc.IP2Location_get_all(ip);

        result = {
            error: false,
            ip: data.ip,
            ip_no: data.ip_no,
            country_short: data.country_short,
            country_long: data.country_long,
            region: data.region,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            zipcode: data.zipcode,
            elevation: data.elevation,
            hostname: hostname,
            status: data.status
        }

    } catch (error) {
        console.log(error);
    }

    callBack(result);
}

const startServer = () => {

    let isUpdating = false;
    let updateStatus = "Bitte warten";

    const app = express();
    app.use(express.json());

    app.use((err, req, res, next) => {
        console.error(err.stack)
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({
            error: 500
        }))
    })

    app.get("/update", (req, res) => {

        if (!isUpdating) return res.redirect("/");

        res.send(`
        <html> <head> <meta http-equiv="refresh" content="1"> </head> <body style="background:#111;color:#fff">
            Die Liste wird aktualisiert...<br>
            ${updateStatus}
        <body> </html>
        `);

    })

    app.get("/api/myip", (req, res) => {

        res.setHeader('Content-Type', 'application/json');

        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        res.send(JSON.stringify({ ip }))

    })

    app.post("/api/ip", (req, res) => {

        res.setHeader('Content-Type', 'application/json');

        const error = (msg) => {
            return res.send(JSON.stringify({
                error: true,
                status: msg
            })); 
        }

        if (isUpdating) return error(updateStatus);

        const notAllowed = [
            "::1",
            "localhost",
            "127.0.0.1",
            "::ffff:127.0.0.1"
        ]

        let ip = req.body.ip;

        if (typeof ip !== "string" || ip === "") {
            return error("Keine gültige IP-Adresse");
        }

        ip = ip.replace(/ /g, "g");
        if (notAllowed.indexOf(ip) > -1 || ip.startsWith("127.0.0.")) {
            return error("Keine gültige IP-Adresse"); 
        }

        if (hostNameRegEx.test(ip)) {
            return dns.lookup(ip, (err, result) => {
                getLocationForIP(result, (data) => {
                    res.send(JSON.stringify(data));
                }, res)
            })
        }
        getLocationForIP(ip, (data) => {
            res.send(JSON.stringify(data));
        }, res)

    })

    app.get("/", (req, res, next) => {
        
        if (checkForUpdate() || !fs.existsSync(binPath)) {
            isUpdating = true;
            
            ip2loc.closeFile();

            try {

                updateBin(() => {
                    isUpdating = false;
                    try {
                        ip2loc.IP2Location_init(binPath);
                    } catch (error) { }
                }, (status) => {
                    updateStatus = status;
                });

            } catch (error) {
                
            }
        }
        
        if (isUpdating) return res.redirect("/update");

        next();
        
    })
    
    app.use(express.static(__dirname + '/../public'));

    const port = 3000;
    app.set('port', port);

    const server = http.createServer(app);
    server.listen(port);

    server.on('listening', () => {

        const addr = server.address();
        if (typeof addr.address === "string" && addr.address === "::") addr.address += "1";

        console.log("http", `Server gestartet auf ${(addr.family === "IPv6") ? `[${addr.address}]` : addr.address}:${addr.port}`);

    })

    server.on('error', (error) => {

        if (error.syscall !== 'listen') throw error;
        const bind = (typeof port === 'string') ? `Pipe ${port}` : `Port ${port}`;

        switch (error.code) {
            case 'EACCES': console.log("server", `Der ${bind} erfordert erhöhte Berechtigungen`); process.exit(1);
            case 'EADDRINUSE': console.log("server", `Der ${bind} wird schon verwendet.`); process.exit(1);
            default: throw error;
        }

    })

}

startServer();