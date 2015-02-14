
var pmp = require('./lib/pmp.js');
// this should return your external ip address as reported by your gateway - not from an external site

// the first parameter is your gateway if you know it - otherwise it will try to find it.


pmp.findGateway("",function(err,gateway){
    console.log(err,gateway.ip);

    pmp.portMap(gateway,8888,8888,0,'cs4 return',function(err,rslt){
        console.log(err,rslt);
    });

});


//pmp.portMap(gateway,8888,8888,20,"DESCRIPTION',function(err,rslt){
//    console.log(err,rslt);
//});

//todds comments
