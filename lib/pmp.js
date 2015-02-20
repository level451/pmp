/**
 * Created by Todd on 6/5/2014.
 */
var dgram = require('dgram'); // dgram is UDP
var upnp = require('./upnp');
/*
function listen(){  // Listen for pmp port change info
// code to listen for changes

// 3.2.1.  Announcing Address Changes
//
// Upon boot, acquisition of an external IPv4 address, subsequent change
// of the external IPv4 address, reboot, or any other event that may
// indicate possible loss or change of NAT mapping state, the NAT
// gateway MUST send a gratuitous response to the link-local multicast
// address 224.0.0.1, port 5350, with the packet format above, to notify
// clients of the external IPv4 address and Seconds Since Start of
// Epoch.


 //my router doesnt do this - or this code doesnt work - so for future use


    var monitor = dgram.createSocket("udp4");
    monitor.on("message", function (msg, rinfo) {
        console.log("brodacast", msg.toString(), rinfo)

    });
    monitor.on("listening",function(){

        monitor.setBroadcast(true);
        monitor.setMulticastTTL(128);
        monitor.addMembership('224.0.0.1');

        console.log("listening");
        var address = monitor.address();

        console.log("brodcast listen",address.address,address.port);

    });
    monitor.bind(5350,"10.6.1.138",function() {
        var address = monitor.address();

        console.log("brodcast bind",address.address,address.port);

    });

}
 */
exports.findGateway = function(gatewayip,callback) {
    gateway = {}
    if (!gatewayip) { //will be true for '', null, undefined, 0, NaN and false.
        // gateway not given attempt to get
        var network = require('network');
        network.get_gateway_ip(function (err, ip) {
            //console.log(err,ip);
            if (err) { // couldn't determine gateway ip addres -- try upnp
                var upnp = require("./upnp");
                gateway.ip =null;
               upnp.searchGateway(gateway,callback);

            } else {
                // no error appears we have a valid gateway now
                gateway.ip = ip

               natpmpgetexternaladdress(gateway, callback);
            }

        });

    }
}
function natpmp(rslt,ip,privateport,publicport,ttl,callback){
    var server = dgram.createSocket("udp4");
    server.on("error", function (err) {
        server.close();
        clearTimeout(timeout);
        if (callback) {
        //    rslt = {};
            rslt.error = "*Socket Error sending to gateway address " + ip + ":" + err;
            rslt.gateway = ip;
            callback(-3, rslt);
            return;
        }
    });

    server.on("message", function (msg, rinfo) {

        if (rinfo.address == ip) {
            clearTimeout(timeout);
            //console.log(rinfo);
            if (callback) {
              //  var rslt={};

                switch (msg[3]) {
                    case 0:


                        rslt.privatePort=msg[8]*256+msg[9];
                        rslt.publicPort=msg[10]*256+msg[11];
                        rslt.ttl=msg[12]*16777216+msg[13]*65536+msg[14]*256+msg[15];
                        rslt.portMappingInitialized=msg[4]*16777216+msg[5]*65536+msg[6]*256+msg[7];
                        rslt.gateway = rinfo.address;
                        rslt.error = "";
                        callback(0, rslt);
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
            server.close();

        }
        else
        {
            //would be weird
            console.log("Response not from gateway ",rinfo.address);

        }

    });

    server.bind("",function(){
        //console.log("server bind");
        timeout = setTimeout(function(){
            if (callback)
            {
                rslt={};
                rslt.error="Unable to connect to gateway - gateway may not support nat-pmp";
                rslt.gateway = ip;
                callback(-1,rslt);
            }
            //console.log("Finished waiting");
            server.close();
        },3000);
        /**
        **/

        ttl = ttl * 60; //convert ttl minutes to seconds
        if ((ttl == 0 && publicport != 0) || ttl >  4294967280) //if ttl is 0 set it to max (136 years) unless the public port is 0
        // if the public port is 0 and the ttl is 0 the router will remove the port mapping
        {ttl = 424967280

        }


        console.log("ttl:"+ttl);


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
            server.send(message, 0, 12, 5351, ip, function (err, bytes) {
                // if there is an error it is not handled in on error
              });

    });


}
exports.portMap =function(gateway,privateport,publicport,ttl,description,callback) {
/*++
    if (!gateway){ //will be true for '', null, undefined, 0, NaN and false.
        // gateway not given attempt to get
        var network = require('network');
        network.get_gateway_ip(function(err, ip) {
            //console.log(err,ip);
            if(err){ // couldn't determine gateway ip addres
                var rslt={};
                if (callback){
                    rslt={};
                    rslt.error = err;
                    callback(-2,rslt);

                }
                return -1;
            }else{
                // no error appears we have a valid gateway now
                natpmp(gateway.ip,privateport,publicport,ttl,callback);
            }

        });
 ++*/
    console.log("at pmp portmap function");
    if(gateway.supportsUPN ==true) {

        gateway.protocol = "TCP";
        gateway.ttl = ttl;
        gateway.publicPort = publicport;
        gateway.privatePort = privateport;
        gateway.description = description;

        upnp.AddMapping(callback,gateway);
    }
    else{
       // appears valid gateway - go ahead and try natpmp

        natpmp(gateway,gateway.ip,privateport,publicport,ttl,callback);}

};
exports.getExternalAddress=function(gateway,callback) {
    if (!gateway) { //will be true for '', null, undefined, 0, NaN and false.
        // gateway not given attempt to get
        var network = require('network');
        network.get_gateway_ip(function (err, ip) {
           // console.log(err, ip);
            if (err) { // couldn't determine gateway ip addres
                rslt = {};
                rslt.error = err;
                if (callback) {
                    callback(-2, rslt);
                }
                return -1;

            } else {
                // appears valid gateway - go ahead and try natpmp
                natpmpgetexternaladdress(ip, callback);
            }
        });


    }else
    {
        // gateway given  - go ahead and try natpmp
        natpmpgetexternaladdress(gateway, callback);

    }
};

function natpmpgetexternaladdress (gateway,callback){
    var server = dgram.createSocket("udp4");
    server.on("error", function (err) {
        server.close();
        clearTimeout(timeout);
        if (callback) {
            rslt = {};
            rslt.error = "*Socket Error sending to gateway address " + gateway + ":" + err;
            rslt.gateway = gateway;
            callback(-3, rslt);
            return;
        }
    });
    server.on("message", function (msg, rinfo) {
        if (rinfo.address == gateway.ip) {

            clearTimeout(timeout);
           server.close();
            if (callback) {
                rslt = {};
                switch (msg[3]) {
                    case 0:
                        gateway.externalIP =msg[8] + "." + msg[9] + "." + msg[10] + "." + msg[11];
                        gateway.error='';
                       // callback(0,gateway );
                        break;
                    case 1:
                        gateway.error="Unsupported Version";
                       // callback(1,rslt);
                        break;
                    case 2:
                        gateway.error="Not Authorized/Refused (nat-pmp disabled or trying to map port below 1024)";
                      //  callback(2, rslt);
                        break;
                    case 3:
                        gateway.error="Network Failure (e.g. NAT box itself has not obtained a DHCP lease)";
                      //  callback(3, rlst);
                        break;
                    case 4:
                        gateway.error="Out of resources (NAT box cannot create any more mappings at this time)";
                     //   callback(4, rslt);
                        break;
                    case 5:
                        gateway.error="Unsupported opcode";
                      //  callback(5, gateway);
                        break;

                }
               if (msg[3] == 0) {
                   gateway.supportsPMP = true;
                   callback(msg[3], gateway);

               }   else

               {
                   // pmp failed try upnp


               }

            }
        }
        else
        {
            //weird
            console.log("Response not from gateway ",rinfo.address);

        }
    });

    server.bind("",function(){
        console.log("server bind");
        timeout = setTimeout(function(){
//++            server.close();
            console.log("unable to open pmp port on router - doesnt support pmp");
            var upnp = require("./upnp");
            upnp.searchGateway(gateway,callback);

//           if (callback)
//            {
//                rslt={};
//                rslt.error="Unable to connect to gateway - gateway may not support nat-pmp";
//                rslt.gateway = gateway;
//                callback(-1,rslt);
//            }
            console.log("Finished waiting");
            server.close();
        },3000);
        var message = new Buffer(2);
        message[0] = 0x00; // version pmp(rfc3886) =0 pcp(rfc3887) = 2
        message[1] = 0x00; //opcode 0 is request external ip address
        server.send(message, 0, 2, 5351, gateway.ip,function(err, bytes) {  // this is the correct port
//        server.send(message, 0, 2, 5352, gateway.ip,function(err, bytes) { //this forces pmp failure

                if (err) {
               // console.log("Error sending:",err);
                clearTimeout(timeout);
                if (callback)
                {
                    rslt={};
                    rslt.error="Socket Error sending to gateway address "+gateway+":"+err;
                    rslt.gateway = gateway;
                    server.close();
                    callback(-1,rslt);
                }
            }
           // console.log('UDP message sent ',bytes);
        });
    });



}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


