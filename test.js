
var pmp = require('./lib/pmp.js');
// this should return your external ip address as reported by your gateway - not from an external site

// the first parameter is your gateway if you know it - otherwise it will try to find it.


pmp.findGateway("",function(err,rslt){
    console.log(err,rslt.toString());


    pmp.getExternalAddress(rslt.ip,function(err,rslt){
          console.log(err,rslt);
        //comment
    });


});


//pmp.getExternalAddress(upnphostname,function(err,rslt){
//    console.log(err,rslt);
//});
//
//
//
//pmp.portMap('',8888,8888,20,function(err,rslt){
//    console.log(err,rslt);
//});

