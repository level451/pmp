/**
 * Created by Todd on 6/5/2014.
 */
var dgram = require('dgram'); // dgram is UDP

// Listen for responses
function portmap(gateway,privateport,publicport,ttl,callback) {
    var server = dgram.createSocket("udp4");
    server.on("message", function (msg, rinfo) {
        if (rinfo.address == gateway) {
            clearTimeout(timeout);
            if (callback) {
                switch (msg[3]) {
                    case 0:
                        callback(0, "ok?");
                        break;
                    case 1:
                        callback(1, "Unsupported Version");
                        break;
                    case 2:
                        callback(2, "Not Authorized/Refused (e.g. box supports mapping, but user has turned feature off)");
                        break;
                    case 3:
                        callback(3, "Network Failure (e.g. NAT box itself has not obtained a DHCP lease)");
                        break;
                    case 4:
                        callback(4, "Out of resources (NAT box cannot create any more mappings at this time)");
                        break;
                    case 5:
                        callback(5, "Unsupported opcode");
                        break;

                }


            }
        }
        else
        {
            console.log("Response not from gateway ",rinfo.address);

        }
//        if (rinfo.address == "10.6.1.1"){
//            console.log("server got: " + msg[8] +" "+msg[9]+ " from " + rinfo.address + ":" + rinfo.port);
//        }
    });

    server.bind("5351",function(){
        console.log("server bind")
        timeout = setTimeout(function(){
            if (callback)
            {
                callback(-1,"Unable to connect to gateway")
            }
            console.log("Finished waiting");
            server.close();
        },1000);
        var message = new Buffer(12);
        message[0] = 0x00; // version pmp(rfc3886) =0 pcp(rfc3887) = 2
        message[1] = 0x02; //opcode 2 is tcp port mapping
        message[2] = 0x00; //reserved
        message[3] = 0x00; // reserved

        message[5] = privateport  & (255);
        privateport = privateport>>8;
        message[4] = privateport  & (255);
        message[7] = publicport  & (255);
        publicport = publicport>>8;
        message[6] = publicport  & (255);
        message[11] = ttl &(255); // ttl byte 0
        ttl = ttl>>8;
        message[10] = ttl &(255); // ttl byte 1
        ttl = ttl>>8;
        message[9] = ttl &(255); // ttl byte 2
        ttl = ttl>>8;
        message[8] = ttl &(255); // ttl byte 3
        server.send(message, 0, 12, 5351, gateway,function(err, bytes) {
            if (err) throw err;
            console.log('UDP message sent ',bytes);
        });
    });



}
function getexternaladdress(gateway,callback) {
    var server = dgram.createSocket("udp4");
    server.on("message", function (msg, rinfo) {
        if (rinfo.address == gateway) {
            clearTimeout(timeout);
            if (callback) {
                switch (msg[3]) {
                    case 0:
                        callback(0, msg[8] + "." + msg[9] + "." + msg[10] + "." + msg[11]);
                        break;
                    case 1:
                        callback(1, "Unsupported Version");
                        break;
                    case 2:
                        callback(2, "Not Authorized/Refused (e.g. box supports mapping, but user has turned feature off)");
                        break;
                    case 3:
                        callback(3, "Network Failure (e.g. NAT box itself has not obtained a DHCP lease)");
                        break;
                    case 4:
                        callback(4, "Out of resources (NAT box cannot create any more mappings at this time)");
                        break;
                    case 5:
                        callback(5, "Unsupported opcode");
                        break;

                }


            }
        }
        else
        {
            console.log("Response not from gateway ",rinfo.address);

        }
//        if (rinfo.address == "10.6.1.1"){
//            console.log("server got: " + msg[8] +" "+msg[9]+ " from " + rinfo.address + ":" + rinfo.port);
//        }
    });

    server.bind("5351",function(){
        console.log("server bind")
        timeout = setTimeout(function(){
            if (callback)
            {
                callback(-1,"Unable to connect to gateway")
            }
            console.log("Finished waiting");
            server.close();
        },1000);
        var message = new Buffer(2);
        message[0] = 0x00; // version pmp(rfc3886) =0 pcp(rfc3887) = 2
        message[1] = 0x00; //opcode 0 is request external ip address
        server.send(message, 0, 2, 5351, gateway,function(err, bytes) {
            if (err) throw err;
            console.log('UDP message sent ',bytes);
        });
    });



}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var network = require('network');

network.get_gateway_ip(function(err, ip) {
    getexternaladdress(ip,function(err,rslt){
        console.log(err,rslt);
    });

     console.log(err || ip); // err may be 'No active network interface found.'
})

//
//portmap("10.6.1.1",8080,8080,20,function(err,rslt){
//    console.log(err,rslt);
//});
//
