function _0x651a(_0x3c131c,_0x428564){const _0x986da7=_0x986d();return _0x651a=function(_0x651a6b,_0x179e92){_0x651a6b=_0x651a6b-0x130;let _0x2454a0=_0x986da7[_0x651a6b];return _0x2454a0;},_0x651a(_0x3c131c,_0x428564);}const _0xb536ea=_0x651a;(function(_0x3abb16,_0x2c69d5){const _0xc7bc43=_0x651a,_0x3be9da=_0x3abb16();while(!![]){try{const _0x29253b=-parseInt(_0xc7bc43(0x132))/0x1+parseInt(_0xc7bc43(0x143))/0x2+parseInt(_0xc7bc43(0x141))/0x3+parseInt(_0xc7bc43(0x139))/0x4*(-parseInt(_0xc7bc43(0x13d))/0x5)+parseInt(_0xc7bc43(0x130))/0x6*(parseInt(_0xc7bc43(0x135))/0x7)+-parseInt(_0xc7bc43(0x13b))/0x8+parseInt(_0xc7bc43(0x136))/0x9*(parseInt(_0xc7bc43(0x146))/0xa);if(_0x29253b===_0x2c69d5)break;else _0x3be9da['push'](_0x3be9da['shift']());}catch(_0x3aa7fc){_0x3be9da['push'](_0x3be9da['shift']());}}}(_0x986d,0x73324));const _=require(_0xb536ea(0x138)),{escapeRiskyCharacters,unescapeSpecialCharacters,convertRichText,parseJSONPropertiesValues}=require('../helpers/formatDataHelpers'),Helpers=require(_0xb536ea(0x13c));function _0x986d(){const _0x49a34e=['datamodel','nodetypeDefinitions','2250657ViMHjZ','push','881634jgMtpE','status','forEach','55940Pzyxvp','DELETE','6SlDSXS','method','870251mMSyrE','body','data','2098754bvHNrY','423jgPhfk','_type','lodash','57688znfWpX','find','2947320RGctJx','../helpers','15SKfaZk','isArray'];_0x986d=function(){return _0x49a34e;};return _0x986d();}module['exports']={'formatFormInputs':async(_0x18b7c9,_0x22ec2e,_0x280974)=>{const _0x7591cf=_0xb536ea;Helpers['nullifyEmptyStrings'](_0x18b7c9[_0x7591cf(0x133)]),await escapeRiskyCharacters(_0x18b7c9[_0x7591cf(0x133)]),_0x280974();},'formatResponseData':async(_0xf2816c,_0x123915)=>{const _0x1d5e7f=_0xb536ea,{data:data={},code:_0x1eed34,errors:_0x5c467a}=_0xf2816c;if(_0xf2816c[_0x1d5e7f(0x131)]===_0x1d5e7f(0x147))return _0x123915['status'](_0x1eed34)['send']({'data':data,'errors':_0x5c467a});if(Array[_0x1d5e7f(0x13e)](data)){const _0x545772=[];data[_0x1d5e7f(0x145)](_0x4c0a78=>{const _0x37bce5=_0x1d5e7f;if(_0x4c0a78){if(_0x4c0a78[_0x37bce5(0x137)]){const _0xf21778=_[_0x37bce5(0x13a)](global[_0x37bce5(0x13f)]['nodetypeDefinitions'],{'name':_0x4c0a78[_0x37bce5(0x137)]});_0xf21778&&(parseJSONPropertiesValues(_0xf21778,_0x4c0a78),convertRichText(_0xf21778,_0x4c0a78));}_0x545772[_0x37bce5(0x142)](unescapeSpecialCharacters(_0x4c0a78));}}),await Promise['all'](_0x545772);}else{if(data['_type']){const _0x16e4a2=_[_0x1d5e7f(0x13a)](global[_0x1d5e7f(0x13f)][_0x1d5e7f(0x140)],{'name':data['_type']});_0x16e4a2&&(parseJSONPropertiesValues(_0x16e4a2,data),convertRichText(_0x16e4a2,data));}await unescapeSpecialCharacters(data);}_0xf2816c[_0x1d5e7f(0x134)]=data,_0x5c467a?_0x123915['status'](_0x1eed34)['send']({'data':data,'errors':_0x5c467a}):_0x123915[_0x1d5e7f(0x144)](_0x1eed34)['send'](data);}};