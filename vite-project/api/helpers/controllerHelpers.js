const _0x502672=_0x7c82;(function(_0x234175,_0x5eef0d){const _0x1ec428=_0x7c82,_0x170fb1=_0x234175();while(!![]){try{const _0x331fd3=-parseInt(_0x1ec428(0x173))/0x1+-parseInt(_0x1ec428(0x166))/0x2+parseInt(_0x1ec428(0x16d))/0x3*(parseInt(_0x1ec428(0x16f))/0x4)+-parseInt(_0x1ec428(0x176))/0x5*(parseInt(_0x1ec428(0x164))/0x6)+-parseInt(_0x1ec428(0x177))/0x7+parseInt(_0x1ec428(0x168))/0x8*(-parseInt(_0x1ec428(0x174))/0x9)+parseInt(_0x1ec428(0x16a))/0xa;if(_0x331fd3===_0x5eef0d)break;else _0x170fb1['push'](_0x170fb1['shift']());}catch(_0x32ff8e){_0x170fb1['push'](_0x170fb1['shift']());}}}(_0x2cf9,0xafb13));const fs=require('fs'),NODEU=require('uuid'),errorLogsFile=_0x502672(0x17a),createLog=_0x1ec400=>{const _0x19be94=_0x502672;let _0x79f2a1='',_0x335bbd='';if(_0x1ec400[_0x19be94(0x180)]){const _0x46151b=_0x1ec400[_0x19be94(0x180)][_0x19be94(0x165)](/\\/g,'/');[_0x79f2a1]=_0x46151b[_0x19be94(0x167)](/(?<=\/)(api.*?)(?=:)/g),[_0x335bbd]=_0x46151b[_0x19be94(0x167)](/(?<=at )(.*?)(?= \()/g);}const {title:title=_0x19be94(0x17b),message:_0x4189f2,functionName:functionName=_0x335bbd,statusCode:statusCode=0x1f4}=_0x1ec400,_0x4d5591={'_id':NODEU['v1'](),'filePath':_0x79f2a1,'statusCode':statusCode,'error':{'functionName':functionName,'title':title,'message':_0x4189f2},'time':Date[_0x19be94(0x175)]()};return _0x4d5591;};function _0x7c82(_0x351524,_0x13cbbd){const _0x2cf9cf=_0x2cf9();return _0x7c82=function(_0x7c820e,_0x43c2c0){_0x7c820e=_0x7c820e-0x164;let _0x5854a6=_0x2cf9cf[_0x7c820e];return _0x5854a6;},_0x7c82(_0x351524,_0x13cbbd);}module[_0x502672(0x16c)]={'saveLog':_0x2516d7=>{const _0x206bcd=_0x502672;try{process[_0x206bcd(0x17d)][_0x206bcd(0x169)]===_0x206bcd(0x170)&&console[_0x206bcd(0x16e)](_0x2516d7);const _0x355199=createLog(_0x2516d7),_0x30ef99=fs[_0x206bcd(0x179)](errorLogsFile,{'encoding':_0x206bcd(0x17c)}),_0x46f6c8=_0x30ef99?JSON['parse'](_0x30ef99):[];_0x46f6c8[_0x206bcd(0x171)](_0x355199);const _0x4efcac=JSON[_0x206bcd(0x16b)](_0x46f6c8,null,'\x09');fs['writeFileSync'](errorLogsFile,_0x4efcac,{'encoding':'utf8'});}catch(_0x146a52){console[_0x206bcd(0x17e)]('Error\x20writing\x20to\x20log\x20file'),console[_0x206bcd(0x16e)](_0x146a52);}},'logAndReturn':(_0x3476d1,_0x253a6e,_0x507469,_0x41b919=0x1f4,_0x1112d9,_0x50eaaf,_0x513189,_0x58f6a4='',_0x1f9825={})=>{const _0x1d3fc4=_0x502672;process['env']['NODE_ENV']==='dev'&&console['error'](_0x1f9825);if(_0x507469){const {message:message=_0x513189,statusCode:statusCode=_0x41b919}=_0x1f9825,_0x4e8fdb={'title':_0x50eaaf,'message':message,'error':!![]};_0x507469[_0x1d3fc4(0x178)](statusCode)[_0x1d3fc4(0x17f)](_0x4e8fdb);}_0x253a6e&&(_0x1f9825[_0x1d3fc4(0x172)]=_0x50eaaf,module['exports']['saveLog'](_0x1f9825));},'logAndRespond':(_0x2be974,_0x448f6a,_0x3c9c1a=_0x502672(0x17b),_0x4f87a0=!![])=>{const _0x298085=_0x502672;if(process[_0x298085(0x17d)]['NODE_ENV']==='test')console[_0x298085(0x16e)](_0x448f6a);if(_0x2be974){const {message:_0x190c14,statusCode:statusCode=0x1f4}=_0x448f6a,_0x3c10a8={'title':_0x3c9c1a,'message':_0x190c14,'error':!![]};_0x2be974['status'](statusCode)[_0x298085(0x17f)](_0x3c10a8);}_0x4f87a0&&(_0x448f6a[_0x298085(0x172)]=_0x3c9c1a,module['exports']['saveLog'](_0x448f6a));}};function _0x2cf9(){const _0x787f72=['38235BhzMFc','4738496QxuwGZ','status','readFileSync','./log/errorLog.json','Internal\x20Server\x20Error','utf8','env','log','json','stack','966CDrngo','replace','1160826LAlSgk','match','1194320zPBAHt','NODE_ENV','39877000UioWaK','stringify','exports','478671vXmJsg','error','16MlpsVB','dev','push','title','1119205jDBTER','18fyiHcm','now'];_0x2cf9=function(){return _0x787f72;};return _0x2cf9();}