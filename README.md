NODE Implementation of the NAT-PMP port mapping protocol 

SEE http://miniupnp.free.fr/nat-pmp.html

Unlike some similar packages this one should work on all platforms including windows.

Commands:

getExternalAddress([gateway],function(error,results) - returns the external ip address

    gateway is optional (just pass an empty string or null if you don't know the address)
    If you do know the address it does speed things up - otherwise it will try to find it.

    error returns an error number or 0 if successful


    result is an object

    result.externalIP = the external IP address
    result.error = error text if any

    usage

    var pmp = require('pmp');
    pmp.getExternalAddress('',function(err,rslt){
        console.log(err,rslt);
    });

portMap([gateway],localport,externalport,ttl,function(error,results) - maps an external port to a local port

    gateway is optional (just pass an empty string or null if you don't know the address)
    If you do know the address it does speed things up - otherwise it will try to find it.

    localport is the port on the local machine you want to map to - sometimes know as the private port.

    externalport is the port of the externalIP that you want the local port mapped to.

    ttl is the time in seconds you want this mapping to remain effective.

    pmp.portMap('',3000,3000,20,function(err,rslt){1
        console.log(err,rslt);
    });