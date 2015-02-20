var url     = require("url");
var http    = require("http");
var dgram   = require("dgram");
var Buffer = require("buffer").Buffer;

// some const strings - dont change
const SSDP_PORT = 1900;
const bcast = "239.255.255.250";
const ST    = "urn:schemas-upnp-org:device:InternetGatewayDevice:1";
const STA = "ssdp:all";
const req   = "M-SEARCH * HTTP/1.1\r\nHost:239.255.255.250:1900\r\n\ST:"+ST+"\r\nMAN:\"ssdp:discover\"\r\nMX:1\r\n\r\n";
//const req   = "M-SEARCH * HTTP/1.1\r\nHost:239.255.255.250:1900\r\n\ST:"+ST+"\r\nMX:10\r\nMAN:ssdp:discover\r\n\r\n";
const WANIP = "urn:schemas-upnp-org:service:WANIPConnection:1";
const OK    = "http/1.1 200 ok";
const SOAP_ENV_PRE = "<?xml version=\"1.0\"?>\n<s:Envelope \
 xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" \
 s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body>\n";
const SOAP_ENV_POST = "</s:Body>\n</s:Envelope>\n";

function searchGateway(gateway, callback) {
    console.log("upnp search gateway");
    var self    = this;
    var reqbuf  = new Buffer(req, "ascii");
    var socket  = new dgram.Socket('udp4');
    var clients = {};
    var t;
    //===============
    var os = require('os');
    var ifaces = os.networkInterfaces();
    var myIp;
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0
            ;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
                gateway.myIp = iface.address;

            }
        });
    });
    //===============
        console.log("setting timeout!");
        t = setTimeout(function() {


            console.log("time out function");
            //socket.close();


           // onerror(new Error("searchGateway() timed out"));
 //+++++++++         //  socket.close() ;
            clearTimeout(t);
            gateway.error = "PMP and UPN failed";
            callback(-1,gateway);

        }, 3000);


    var onlistening = function() {
        console.log("UDP Socket Listening at "+socket.address().address+":"+socket.address().port);
        socket.unref();
        //socket.setBroadcast(socket.fd, true);
        //socket.setMulticastTTL(128);
        //socket.addMembership(bcast);
        // send a few packets just in case.
        socket.send(reqbuf, 0, reqbuf.length, SSDP_PORT,bcast, function(err, bytes) {
                if (!err) {
                    console.log("discover sent bytes:" + bytes);
                }else{
                    console.log("error-socket not listening:"+err);
                }
            }
            //

        );
    };

    var onmessage = function(message, rinfo) {
        console.log("on message from :" + rinfo.address);
        msg = message.toString(); // keep case of incoming message
        message = msg.toLowerCase(); // changed to lower because different routers report different case in strings

        if (message.substr(0, 15) =="http/1.1 200 ok" && message.indexOf("urn:schemas-upnp-org:device:internetgatewaydevice:1") > 0 && message.indexOf("location:")>0) {
            console.log("Internet gateway device found at: "+rinfo.address);
            //socket.close();
        }else{
            console.log("got something we dont want back \r\n"+message);
            return;
        }
        gateway.supportsUPN = true;



        var l = url.parse(msg.match(/location:(.+?)\r\n/i)[1].trim()); // changed to incoming case for message
        //var l =url.parse("http://10.6.1.1:33030/rootDesc.xml");
        console.log("after l");
        console.log("UPNP URL:"+ l.href);


        if (clients[l.href]) return; // already did this
        var client = clients[l.href];
//        var client = clients[l.href] = http.createClient(l.port, l.hostname);
//        var request = client.request("GET", l.pathname, {"host": l.hostname});
        var options = {
            hostname: l.hostname,
            port: l.port,
            path: l.pathname,
            method: "GET"
        };
        var request = http.request(options);
        request.end();

        request.addListener('response', function (response) {
            console.log("got a http response ");
            if (response.statusCode !== 200)
            {
                console.log("bad status code"+response.statusCode);
                return;

            }

            var resbuf = "";
            response.addListener('data', function (chunk) { resbuf += chunk });
            response.addListener("end", function() {
                resbuf = resbuf.substr(resbuf.indexOf(WANIP) + WANIP.length);
                var ipurl = resbuf.match(/<controlURL>(.+?)<\/controlURL>/i)[1].trim()
                clearTimeout(t);
                console.log("ipurl:"+ipurl);
                socket.close();

                gateway.upnpPort = l.port;
                gateway.upnphostname = l.hostname;
                gateway.ipurl = ipurl;
              var  x =new Gateway(l.port, l.hostname, ipurl,gateway);
                x.getExternalIP(callback, gateway);

               // callback(null, gateway);
                //socket.close();
            });
        });
    }

    var onerror = function(err) {
        socket.close() ;
        clearTimeout(t);
        callback(err);
    }

    var onclose = function() {
        socket.removeListener("listening", onlistening);
        socket.removeListener("message", onmessage);
        socket.removeListener("close", onclose);
        socket.removeListener("error", onerror);
    }


    socket.addListener("message", onmessage);
    socket.addListener("close", onclose);
    socket.addListener("error", onerror);
    socket.addListener("listening", onlistening);
    //socket.bind(SSDP_PORT);
    socket.bind();

}




exports.searchGateway = searchGateway;

function Gateway(port, host, path, gatewayobject) {
    this.port = port;
    this.host = host;
    this.path = path;
   // this.gatewayobject = gatewayobject;
}

Gateway.prototype.getExternalIP = function(callback, gateway) {

    var s =
        "<u:GetExternalIPAddress xmlns:u=\"" + WANIP + "\">\
 </u:GetExternalIPAddress>\n";

    this._getSOAPResponse(s, "GetExternalIPAddress", function(err, xml) {
        if (err) callback(err);
        else

        {
            // var qq = xml.match(/<NewExternalIPAddress>(.+?)<\/NewExternalIPAddress>/i)[1];
            gateway.externalIP =  xml.match(/<NewExternalIPAddress>(.+?)<\/NewExternalIPAddress>/i)[1];
            callback(null,gateway);

        }
    });

}

exports.AddMapping = AddMapping;

function AddMapping(callback, gateway){

    var  x =new Gateway(gateway.upnpPort, gateway.hostname, gateway.ipurl,gateway);
    x.AddPortMapping(callback, gateway);
}

Gateway.prototype.AddPortMapping = function(callback,gateway) {
    var extPort = gateway.publicPort;
    var protocol = gateway.protocol;
    var intPort = gateway.privatePort;
    var host = gateway.myIp;
    var description = gateway.description;
    var ttl = gateway.ttl;

    var s =
        "<u:AddPortMapping \
        xmlns:u=\""+WANIP+"\">\
         <NewRemoteHost></NewRemoteHost>\
         <NewExternalPort>"+extPort+"</NewExternalPort>\
         <NewProtocol>"+protocol+"</NewProtocol>\
         <NewInternalPort>"+intPort+"</NewInternalPort>\
         <NewInternalClient>"+host+"</NewInternalClient>\
         <NewEnabled>1</NewEnabled>\
         <NewPortMappingDescription>"+description+"</NewPortMappingDescription>\
         <NewLeaseDuration>"+ttl+"</NewLeaseDuration>\
         </u:AddPortMapping>";
    this._getSOAPResponse(s, "AddPortMapping", callback);
}

Gateway.prototype._getSOAPResponse = function(soap, func, callback) {
    var s = [SOAP_ENV_PRE, soap, SOAP_ENV_POST].join("");
    var options = {
        hostname: gateway.upnphostname,
        port: gateway.upnpPort,
        path: gateway.ipurl,
        method: "POST",
        headers:  { "host"           : gateway.upnphostname
            , "SOAPACTION"     : "\"" + WANIP + "#" + func + "\""
            , "content-type"   : "text/xml"
            , "content-length" : s.length }
    }
    var request = http.request(options);
    request.end(s);
    request.addListener('response', function (response) {
        console.log("got a http  soap response ");
        if (response.statusCode !== 200) {
//++++           // response.close();
            callback(new Error("Invalid SOAP action"));
            return;
        }
        var buf = "";
        response.addListener('data', function (chunk) { buf += chunk });
        response.addListener('end', function () { callback(null, buf) });
    });
};


