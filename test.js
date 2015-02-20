
var pmp = require('./lib/pmp.js');
var gateway;
// this should return your external ip address as reported by your gateway - not from an external site

// the first parameter is your gateway if you know it - otherwise it will try to find it.


pmp.findGateway("",function(err,gateway){
    ///console.log(err,gateway.ip);
    if(err){
        console.log('Can not find gateway line 12');
      //  gateway.ip = 'unknown';
    }
    else{
        console.log('gateway found: '+ gateway.ip + ", External IP: "+ gateway.externalIP);
        pmp.portMap(gateway,7870,7870,5,'csx return',function(err,rslt){

            if(!err) {
                    console.log("Sucessfully logged port: "+ gateway.externalIP + ": " + gateway.publicport + " to " + gateway.ip + ": " + gateway.privateport) ;
            }
            else{
                console.log(err,rslt);
            }

            pmp.portMap(gateway,7871,7871,0,'csx return',function(err,rslt) {

                if (!err) {
                    console.log("Sucessfully logged port: " + gateway.externalIP + ": " + gateway.publicport + " to " + gateway.ip + ": " + gateway.privateport);
                }
                else {
                    console.log(err, rslt);
                }

                pmp.portMap(gateway,7872,7872,0,'csx return',function(err,rslt) {

                    if (!err) {
                        console.log("Sucessfully logged port: " + gateway.externalIP + ": " + gateway.publicport + " to " + gateway.ip + ": " + gateway.privateport);
                    }
                    else {
                        console.log(err, rslt);
                    }
                });
            });


        });
    }
});


//pmp.portMap(gateway,8888,8888,20,"DESCRIPTION',function(err,rslt){
//    console.log(err,rslt);
//});

//todds comments
