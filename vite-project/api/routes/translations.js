function _0x211c(){const _0x228e17=['1128288sGvVpQ','removeProps','resetDefaultLangNodetypeTranslation','../controllers/translationController','apikey','getLanguages','requireAdmin','route','updateWholeLanguage','/clearNodetypeTranslation/:nodetypeName','post','exports','/resetTranslationForCoreProperties','updatePropertyName','resetTranslationForCoreProperties','4733300rTCfnu','addLanguage','862292TEvdZY','/updateConfig/','get','117RpKQAY','866780pmuFdo','updateLanguage','updateConfigLanguages','322168xpLugZ','authenticate','/resetDefaultLangNodetypeTranslation/:nodetypeName','jwt','/languages','/add/:lang','clearNodetypeTranslation','699544eqmCoi','/removeProps','2576781ZmlJrm','express-promise-router','66FBFVCb'];_0x211c=function(){return _0x228e17;};return _0x211c();}function _0x15c2(_0x29785c,_0xc973a8){const _0x211c00=_0x211c();return _0x15c2=function(_0x15c25f,_0x55d42c){_0x15c25f=_0x15c25f-0x144;let _0x3d79ca=_0x211c00[_0x15c25f];return _0x3d79ca;},_0x15c2(_0x29785c,_0xc973a8);}const _0x5d0f49=_0x15c2;(function(_0x2e10d7,_0x36ca92){const _0x3c8c74=_0x15c2,_0x12d651=_0x2e10d7();while(!![]){try{const _0x39fd46=parseInt(_0x3c8c74(0x151))/0x1+parseInt(_0x3c8c74(0x164))/0x2+parseInt(_0x3c8c74(0x161))/0x3+-parseInt(_0x3c8c74(0x155))/0x4+-parseInt(_0x3c8c74(0x14f))/0x5+-parseInt(_0x3c8c74(0x163))/0x6*(-parseInt(_0x3c8c74(0x158))/0x7)+-parseInt(_0x3c8c74(0x15f))/0x8*(parseInt(_0x3c8c74(0x154))/0x9);if(_0x39fd46===_0x36ca92)break;else _0x12d651['push'](_0x12d651['shift']());}catch(_0x2e4dc0){_0x12d651['push'](_0x12d651['shift']());}}}(_0x211c,0x77ff9));const router=require(_0x5d0f49(0x162))(),passport=require('passport'),accesses=require('../middlewares/accesses'),passportJWT=passport[_0x5d0f49(0x159)]([_0x5d0f49(0x15b),_0x5d0f49(0x144)],{'session':![]}),translationController=require(_0x5d0f49(0x167));router['route'](_0x5d0f49(0x15c))[_0x5d0f49(0x153)](translationController[_0x5d0f49(0x145)]),router[_0x5d0f49(0x147)](_0x5d0f49(0x15d))['post'](passportJWT,accesses['requireAdmin'],translationController[_0x5d0f49(0x150)]),router[_0x5d0f49(0x147)](_0x5d0f49(0x152))['post'](passportJWT,accesses[_0x5d0f49(0x146)],translationController[_0x5d0f49(0x157)]),router[_0x5d0f49(0x147)](_0x5d0f49(0x160))['post'](passportJWT,accesses[_0x5d0f49(0x146)],translationController[_0x5d0f49(0x165)]),router[_0x5d0f49(0x147)](_0x5d0f49(0x14c))[_0x5d0f49(0x153)](passportJWT,accesses[_0x5d0f49(0x146)],translationController[_0x5d0f49(0x14e)]),router[_0x5d0f49(0x147)](_0x5d0f49(0x149))[_0x5d0f49(0x153)](passportJWT,accesses[_0x5d0f49(0x146)],translationController[_0x5d0f49(0x15e)]),router['route']('/updatePropertyName/:nodetypeName')['post'](passportJWT,accesses['requireAdmin'],translationController[_0x5d0f49(0x14d)]),router[_0x5d0f49(0x147)]('/:lang')[_0x5d0f49(0x153)](passportJWT,translationController['readLanguage'])['put'](passportJWT,accesses[_0x5d0f49(0x146)],translationController[_0x5d0f49(0x156)])[_0x5d0f49(0x14a)](passportJWT,accesses[_0x5d0f49(0x146)],translationController[_0x5d0f49(0x148)]),router[_0x5d0f49(0x147)](_0x5d0f49(0x15a))[_0x5d0f49(0x14a)](passportJWT,accesses[_0x5d0f49(0x146)],translationController[_0x5d0f49(0x166)]),module[_0x5d0f49(0x14b)]=router;