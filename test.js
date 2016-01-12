
var pmp = require('./lib/pmp');
var gateway;
// this should return your external ip address as reported by your gateway - not from an external site

// the first parameter is your gateway if you know it - otherwise it will try to find it.


pmp.findGateway("",function(err,gateway){
    ///console.log(err,gateway.ip);
    if(err){
        console.log('Gateway not found',err);
    }
    else{
        console.log('gateway found: '+ gateway.ip + ", External IP: "+ gateway.externalIP);
        pmp.portMap(gateway,7870,7870,0,'label',function(err,rslt){

            if(!err) {
                    console.log("Sucessfully forwarded port: "+ gateway.externalIP + ": " + gateway.publicPort + " to this ip address port:" + gateway.privatePort + " gateway ip : " +gateway.ip ) ;
            }
            else{
                console.log(err,rslt);
            }


        });
    }
});


//pmp.portMap(gateway,8888,8888,20,"DESCRIPTION',function(err,rslt){
//    console.log(err,rslt);
//});

//todds comments
