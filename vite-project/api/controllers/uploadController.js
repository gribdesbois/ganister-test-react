const _0x464a3e=_0x20cc;function _0x1a25(){const _0x17fe7a=['287294ITacle','run','./assets/uploads/','.pdf','now','signatureVersion','records','close','length','Requested\x20an\x20image\x20with\x20null\x20id','53isWrZf','Not\x20Found','local','assign','data','source','Location','getFullYear','nodeId','../helpers/controllerHelpers','./assets/','replace','vault','MATCH\x20(file:file\x20{_id:$nodeId})\x20RETURN\x20file','1278rwswdX','Sorry,\x20cannot\x20identify\x20%s\x20file\x20source','code','getObject','copyObject','finish','existsSync','261039VsiJCi','catch','amazonS3','application/pdf','json','createWriteStream','query','18CHrhAr','file','getSignedUrl','defaultUpload','true','region','464745GSjptz','createReadStream','uploads/','promise','Profile\x20Pict\x20not\x20found','upload','mkdirSync','join','https','body','session','pipe','Requested\x20File\x20not\x20found\x20in\x20database','filename','config','bucket','34514HitsDm','uploadController.js','10376CjenOH','docx','convertApiSecret','save','headers','status','get','error','message','send','48TXuYMN','stack','includes','4830518TkBgGJ','slice','sourceKey','doc','params','path','pdf','Null\x20_id','name','then','split','File\x20fetch\x20error','url','generatePublicURL','convertapi','title','6993430CAJORM'];_0x1a25=function(){return _0x17fe7a;};return _0x1a25();}(function(_0x2926ff,_0x2e8172){const _0x4fdef7=_0x20cc,_0x5250a2=_0x2926ff();while(!![]){try{const _0x43affb=parseInt(_0x4fdef7(0x1b9))/0x1*(parseInt(_0x4fdef7(0x18f))/0x2)+-parseInt(_0x4fdef7(0x172))/0x3*(parseInt(_0x4fdef7(0x19b))/0x4)+parseInt(_0x4fdef7(0x17f))/0x5+parseInt(_0x4fdef7(0x179))/0x6*(parseInt(_0x4fdef7(0x1af))/0x7)+-parseInt(_0x4fdef7(0x191))/0x8*(-parseInt(_0x4fdef7(0x16b))/0x9)+parseInt(_0x4fdef7(0x1ae))/0xa+-parseInt(_0x4fdef7(0x19e))/0xb;if(_0x43affb===_0x2e8172)break;else _0x5250a2['push'](_0x5250a2['shift']());}catch(_0x3f5f22){_0x5250a2['push'](_0x5250a2['shift']());}}}(_0x1a25,0x819e7));const path=require(_0x464a3e(0x1a3)),fs=require('fs'),AWS=require('aws-sdk'),https=require(_0x464a3e(0x187)),Busboy=require('busboy'),config=require('../../config/config'),helpers=require(_0x464a3e(0x166)),uploadFolder='assets/uploads';!fs[_0x464a3e(0x171)](uploadFolder)&&fs[_0x464a3e(0x185)](uploadFolder);const driver=config['db'],{S3Vault}=config,{logAndReturn}=helpers,wordDocTypes=[_0x464a3e(0x1a1),_0x464a3e(0x192)];function _0x20cc(_0x24b69b,_0x123a78){const _0x1a254c=_0x1a25();return _0x20cc=function(_0x20ccfe,_0x52904a){_0x20ccfe=_0x20ccfe-0x165;let _0x28b394=_0x1a254c[_0x20ccfe];return _0x28b394;},_0x20cc(_0x24b69b,_0x123a78);}let S3bucket;S3Vault&&(S3bucket=new AWS['S3']({'accessKeyId':S3Vault[_0x464a3e(0x18d)]['accessKeyId'],'secretAccessKey':S3Vault[_0x464a3e(0x18d)]['secretAccessKey'],'Bucket':S3Vault[_0x464a3e(0x18d)][_0x464a3e(0x18e)],'region':S3Vault[_0x464a3e(0x18d)][_0x464a3e(0x17e)],'signatureVersion':S3Vault[_0x464a3e(0x18d)][_0x464a3e(0x1b4)]}));let convertapi;config[_0x464a3e(0x193)]&&(convertapi=require(_0x464a3e(0x1ac))(config['convertApiSecret'],{'conversionTimeout':0x3c,'uploadTimeout':0x3c,'downloadTimeout':0x3c}));const convDocToPdf=async(_0x3dd0d5,_0xdb00b3)=>{const _0x438947=_0x464a3e,_0x4d60a0=_0x3dd0d5[_0x438947(0x1a8)]('.')[_0x438947(0x19f)](-0x1)[0x0];if(wordDocTypes[_0x438947(0x19d)](_0x4d60a0)){if(config['convertApiSecret'])try{const _0xfb45e6=generateAmazonS3PublicURL(_0xdb00b3),_0x3a56f2=await convertapi['convert'](_0x438947(0x1a4),{'File':_0xfb45e6}),_0x56a774=await _0x3a56f2[_0x438947(0x17a)][_0x438947(0x194)](_0x438947(0x1b1)+_0x3dd0d5+_0x438947(0x1b2)),_0x3fcd74=fs[_0x438947(0x180)](_0x56a774);return await S3bucket['upload']({'Key':_0xdb00b3+_0x438947(0x1b2),'Body':_0x3fcd74,'ContentType':_0x438947(0x175),'Bucket':S3Vault[_0x438947(0x18d)][_0x438947(0x18e)]})[_0x438947(0x182)](),_0x3fcd74;}catch(_0x2ce5f6){return console['error'](_0x2ce5f6),![];}return![];}return![];},local=(_0x25e5a5,_0x262a4f)=>{const _0x57a89c=_0x464a3e,_0x141795=new Busboy({'headers':_0x25e5a5['headers']});let _0x5b897c,_0xa5913d,_0x2d7648,_0xa7a21a,_0x12aab2=0x0,_0x152bb5='';const _0x25fe89=Date[_0x57a89c(0x1b3)]();return _0x141795['on'](_0x57a89c(0x17a),(_0x1c01f8,_0x343024,_0x166528,_0x1fc651,_0x4731c4)=>{const _0x441a55=_0x57a89c;_0x343024['on'](_0x441a55(0x1bd),_0x490490=>{const _0x387c88=_0x441a55;_0x12aab2+=_0x490490[_0x387c88(0x1b7)];}),_0x5b897c=_0x441a55(0x181)+_0x25fe89+'-'+_0x166528,_0x152bb5=path[_0x441a55(0x186)](_0x441a55(0x167),_0x5b897c),_0x343024['pipe'](fs['createWriteStream'](_0x152bb5)),_0xa5913d=_0x1fc651,_0x2d7648=_0x4731c4,_0xa7a21a=_0x166528;}),_0x141795['on']('finish',()=>{const _0x524380=_0x57a89c;_0x262a4f[_0x524380(0x196)](0xc8)[_0x524380(0x176)]({'url':_0x5b897c,'encoding':_0xa5913d,'mimetype':_0x2d7648,'filename':_0xa7a21a,'filesize':_0x12aab2,'source':_0x524380(0x1bb),'sourceKey':_0x5b897c});}),_0x25e5a5[_0x57a89c(0x18a)](_0x141795);},localImages=(_0x375fe7,_0x465b74)=>{const _0x380690=_0x464a3e,_0x14bdf1=new Busboy({'headers':_0x375fe7[_0x380690(0x195)]});let _0x34d45a,_0x3a580f,_0x504082,_0xb3cdd2,_0x3d42d3,_0xae38bd=0x0;const _0x398c32=Date[_0x380690(0x1b3)]();return _0x14bdf1['on'](_0x380690(0x17a),(_0x32da8b,_0x425d0a,_0x472e18,_0x340a0b,_0x27bec8)=>{const _0x3f9384=_0x380690;_0x425d0a['on'](_0x3f9384(0x1bd),_0x56fdc6=>{const _0x32c3bc=_0x3f9384;_0xae38bd+=_0x56fdc6[_0x32c3bc(0x1b7)];}),_0x34d45a='images/'+_0x398c32+'-'+_0x472e18[_0x3f9384(0x168)](/\s/g,''),_0x3d42d3=path[_0x3f9384(0x186)](_0x3f9384(0x167),_0x34d45a),_0x425d0a[_0x3f9384(0x18a)](fs[_0x3f9384(0x177)](_0x3d42d3)),_0x3a580f=_0x340a0b,_0x504082=_0x27bec8,_0xb3cdd2=_0x472e18['replace'](/\s/g,'');}),_0x14bdf1['on'](_0x380690(0x170),()=>{const _0x13d48e=_0x380690;_0x465b74[_0x13d48e(0x196)](0xc8)[_0x13d48e(0x176)]({'url':_0x34d45a,'encoding':_0x3a580f,'mimetype':_0x504082,'filename':_0xb3cdd2,'filesize':_0xae38bd,'source':_0x13d48e(0x1bb),'sourceKey':_0x34d45a});}),_0x375fe7[_0x380690(0x18a)](_0x14bdf1);},generateAmazonS3PublicURL=_0x1add3e=>{const _0x341583=_0x464a3e;let _0x393058='';if(S3Vault){const _0x1e1ed6={'Bucket':S3Vault[_0x341583(0x18d)][_0x341583(0x18e)],'Key':_0x1add3e,'Expires':0x3c};try{return _0x393058=S3bucket[_0x341583(0x17b)](_0x341583(0x16e),_0x1e1ed6),_0x393058;}catch(_0x15a8d3){return null;}}},downloadAmazonS3File=async(_0x384579,_0x5a026d)=>{return new Promise((_0x3ba103,_0x358c04)=>{const _0x4e3d9e=_0x20cc;if(config[_0x4e3d9e(0x169)]==='amazonS3'){const _0x1f0ac4=generateAmazonS3PublicURL(_0x384579),_0x4bddce=fs[_0x4e3d9e(0x177)](uploadFolder+'/'+_0x5a026d);try{https[_0x4e3d9e(0x197)](_0x1f0ac4,_0x3d345f=>{const _0x1e053a=_0x4e3d9e;_0x3d345f[_0x1e053a(0x18a)](_0x4bddce),_0x3ba103({'filename':_0x5a026d});});}catch(_0xa32060){_0x3ba103({'error':!![],'title':__(_0x4e3d9e(0x183)),'message':_0xa32060});}}else _0x3ba103({'filename':_0x5a026d});});},uploadFileStream=async({filename:_0x234f56,file:_0x60a08b,mimetype:_0x12d06b})=>{const _0x5de483=_0x464a3e,_0x459d48={'filename':_0x234f56,'filesize':0x0,'source':config['vault']};_0x60a08b['on'](_0x5de483(0x1bd),_0x1a0c6d=>{const _0x4132ea=_0x5de483;_0x459d48['filesize']+=_0x1a0c6d[_0x4132ea(0x1b7)];});if(!config[_0x5de483(0x169)]){}if(config[_0x5de483(0x169)]==='amazonS3'){const _0x4ba740=Date[_0x5de483(0x1b3)](),_0x1609c0=new Date(),_0x55b0d2=_0x1609c0[_0x5de483(0x1c0)](),_0x4792fe=_0x1609c0['getMonth']()+0x1,_0x2e4116=_0x55b0d2+'/'+_0x4792fe+'/'+_0x4ba740+'-'+_0x234f56,_0x559024={'Bucket':S3Vault[_0x5de483(0x18d)][_0x5de483(0x18e)],'Key':_0x2e4116,'ContentType':_0x12d06b,'Body':_0x60a08b},_0x5d1e28=await S3bucket[_0x5de483(0x184)](_0x559024)['promise']();return await convDocToPdf(_0x234f56,_0x2e4116),Object[_0x5de483(0x1bc)](_0x459d48,{'sourceKey':_0x2e4116,'url':_0x5d1e28[_0x5de483(0x1bf)]});}if(config[_0x5de483(0x169)]===_0x5de483(0x1bb)){const _0x49cd4c='uploads/'+_0x234f56,_0x3b676e=fs['createWriteStream'](uploadFolder+'/'+_0x234f56);return _0x60a08b['pipe'](_0x3b676e),Object[_0x5de483(0x1bc)](_0x459d48,{'sourceKey':_0x49cd4c,'url':_0x49cd4c});}};module['exports']={'uploadFileStream':uploadFileStream,'duplicateS3File':async _0x2f2061=>{return new Promise(_0x28e92c=>{const _0x59730c=_0x20cc,_0x2df799=Date['now'](),_0x355819={'Bucket':S3Vault[_0x59730c(0x18d)][_0x59730c(0x18e)],'CopySource':'/'+S3Vault['config'][_0x59730c(0x18e)]+'/'+_0x2f2061,'Key':_0x2df799+'_'+_0x2f2061};S3bucket[_0x59730c(0x16f)](_0x355819,(_0x270284,_0x3014db)=>{const _0x407156=_0x59730c;_0x270284&&console[_0x407156(0x198)](_0x270284,_0x270284[_0x407156(0x19c)]),_0x28e92c(_0x3014db);});});},'localUpload':async(_0xaa93c1,_0x2bcf90)=>{local(_0xaa93c1,_0x2bcf90);},'localImagesUpload':async(_0xa03d75,_0x270d6d)=>{localImages(_0xa03d75,_0x270d6d);},'defaultUpload':async(_0x3a2026,_0x5f17f4)=>{const _0x564657=_0x464a3e;try{const _0x1cc789=new Busboy({'headers':_0x3a2026[_0x564657(0x195)]});_0x1cc789['on']('file',async(_0x59d179,_0x163e4,_0x1006e7,_0x2cbd4c,_0x3bb207)=>{const _0x81189=_0x564657,_0x2e4982={'fieldname':_0x59d179,'file':_0x163e4,'filename':_0x1006e7,'encoding':_0x2cbd4c,'mimetype':_0x3bb207},_0x469f26=await uploadFileStream(_0x2e4982);Object['assign'](_0x2e4982,_0x469f26),_0x5f17f4[_0x81189(0x196)](0xc8)[_0x81189(0x176)](_0x2e4982);})['on'](_0x564657(0x198),_0x17857f=>{throw _0x17857f;}),_0x3a2026['pipe'](_0x1cc789);}catch(_0x33840c){return logAndReturn(_0x564657(0x190),!![],_0x5f17f4,0x1f4,_0x564657(0x17c),__('Vault\x20Configuration\x20failed'),_0x33840c[_0x564657(0x199)],'',{});}},'downloadAmazonS3File':(_0xb83a45,_0x4c1bb4)=>{const _0x406846=_0x464a3e;downloadAmazonS3File(_0xb83a45,_0x4c1bb4)['then'](_0x5da164=>{const _0x54ed54=_0x20cc;if(_0x5da164['error'])return{'title':_0x5da164[_0x54ed54(0x1ad)],'message':_0x5da164[_0x54ed54(0x199)]};return _0x5da164;})[_0x406846(0x173)](_0xb89ab7=>{return _0xb89ab7;});},'generatePublicURLFromSourceKey':(_0x35b311,_0x9777ba)=>{const _0x38c63f=_0x464a3e,{sourceKey:_0xd0eff1,filename:_0x3a948e}=_0x35b311[_0x38c63f(0x188)];downloadAmazonS3File(_0xd0eff1,_0x3a948e)[_0x38c63f(0x1a7)](_0x445d04=>{const _0x215316=_0x38c63f;if(_0x445d04[_0x215316(0x198)])return _0x9777ba[_0x215316(0x196)](_0x445d04[_0x215316(0x16d)])[_0x215316(0x19a)]({'title':_0x445d04[_0x215316(0x1ad)],'message':_0x445d04[_0x215316(0x199)]});return _0x9777ba[_0x215316(0x196)](0xc8)[_0x215316(0x176)](_0x445d04);})[_0x38c63f(0x173)](_0x236f63=>{const _0x4a993d=_0x38c63f;return _0x9777ba[_0x4a993d(0x196)](0x1f4)[_0x4a993d(0x176)](_0x236f63);});},'generatePublicURL':(_0x23c697,_0x22ac28)=>{const _0x2b8c28=_0x464a3e,_0x4abe3e=driver[_0x2b8c28(0x189)]();let _0x3e18e4=!![];if(_0x23c697[_0x2b8c28(0x178)]['viewable']!==undefined)_0x3e18e4=_0x23c697[_0x2b8c28(0x178)]['viewable']===_0x2b8c28(0x17d);if(_0x23c697['params']['nodeId']&&_0x23c697[_0x2b8c28(0x1a2)][_0x2b8c28(0x165)]!==null&&_0x23c697[_0x2b8c28(0x1a2)]['nodeId']!=='null'){const _0x4e6f1f=_0x2b8c28(0x16a);_0x4abe3e[_0x2b8c28(0x1b0)](_0x4e6f1f,{'nodeId':_0x23c697[_0x2b8c28(0x1a2)][_0x2b8c28(0x165)]})[_0x2b8c28(0x1a7)](_0xa34a7a=>{const _0x320eab=_0x2b8c28;_0x4abe3e[_0x320eab(0x1b6)]();if(_0xa34a7a[_0x320eab(0x1b5)][_0x320eab(0x1b7)]===0x0)return _0x22ac28[_0x320eab(0x196)](0x194)[_0x320eab(0x19a)]({'error':!![],'title':__(_0x320eab(0x1ba)),'message':__(_0x320eab(0x18b))});const _0x47d6e7=_0xa34a7a[_0x320eab(0x1b5)][0x0][_0x320eab(0x197)](_0x320eab(0x17a))['properties'],_0x1a6532=_0x47d6e7[_0x320eab(0x18c)]||_0x47d6e7[_0x320eab(0x1a6)],_0x859a6b=_0x1a6532[_0x320eab(0x1a8)]('.')[_0x320eab(0x19f)](-0x1)[0x0];if(_0x47d6e7[_0x320eab(0x1be)]===_0x320eab(0x174)){let _0x3abf54;return wordDocTypes[_0x320eab(0x19d)](_0x859a6b)&&_0x3e18e4&&config[_0x320eab(0x193)]?(_0x3abf54=generateAmazonS3PublicURL(_0x47d6e7[_0x320eab(0x1a0)]+_0x320eab(0x1b2)),_0x47d6e7['mimetype']='application/pdf'):_0x3abf54=generateAmazonS3PublicURL(_0x47d6e7[_0x320eab(0x1a0)]),_0x22ac28[_0x320eab(0x196)](0xc8)[_0x320eab(0x176)]({'url':_0x3abf54,'mimetype':_0x47d6e7['mimetype']});}if(_0x47d6e7[_0x320eab(0x1be)]==='local')return _0x22ac28['status'](0xc8)[_0x320eab(0x176)]({'url':_0x47d6e7[_0x320eab(0x1aa)]});return logAndReturn(_0x320eab(0x190),!![],_0x22ac28,0x1f4,_0x320eab(0x1ab),_0x320eab(0x1a9),__(_0x320eab(0x16c),_0x47d6e7[_0x320eab(0x18c)]),_0x4e6f1f,{});})[_0x2b8c28(0x173)](_0x392845=>logAndReturn(_0x2b8c28(0x190),!![],_0x22ac28,0x1f4,'generatePublicURL',_0x2b8c28(0x1a5),_0x392845[_0x2b8c28(0x199)],_0x4e6f1f,_0x392845));}else return logAndReturn('uploadController.js',!![],_0x22ac28,0x1f4,_0x2b8c28(0x1ab),_0x2b8c28(0x1a5),__(_0x2b8c28(0x1b8)),'',{});}};