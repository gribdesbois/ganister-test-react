function _0xe7b2(){const _0x46d3a4=['post','authSchema','local','../controllers/usersController','/changepassword/:token','route','invite','/refreshToken','14604lXcoSr','../middlewares/accesses','10Ilckkt','/test','1995376dzSRhG','requireAdmin','../middlewares/basics','formatDeprecatedUserRequest','signIn_2FA_2','../controllers/nodesController','status','properties','/signup','60002YEtKdE','../middlewares/params','JWT_EXPIRATION','getNodes','1219134JTnoFh','6305046eSbwbm','put','/:nodeId','deleteNode','testUser','/signin_2FA_2','getNode','apikey','../helpers/routeHelpers','../middlewares/nodes','5309997fEIWFn','getChangePasswordPage','checkNodetypes','exports','get','9tfacws','signToken','authenticate','passport','4IEpmuh','/signin','8650032uaOaeO','send','../../config/config','patch','/invite','express-promise-router','5CDnOxt','138DXaoMz','tokenExpiration','../middlewares/deprecated','addNode'];_0xe7b2=function(){return _0x46d3a4;};return _0xe7b2();}const _0x187542=_0x2437;function _0x2437(_0x3622b3,_0x5229be){const _0xe7b2f=_0xe7b2();return _0x2437=function(_0x243703,_0x23fff0){_0x243703=_0x243703-0x137;let _0x326f49=_0xe7b2f[_0x243703];return _0x326f49;},_0x2437(_0x3622b3,_0x5229be);}(function(_0x98a8b8,_0x5bfe3e){const _0x21ac3a=_0x2437,_0x3c0db9=_0x98a8b8();while(!![]){try{const _0x4065f3=parseInt(_0x21ac3a(0x16c))/0x1*(parseInt(_0x21ac3a(0x14a))/0x2)+parseInt(_0x21ac3a(0x153))/0x3*(parseInt(_0x21ac3a(0x15f))/0x4)+parseInt(_0x21ac3a(0x152))/0x5*(-parseInt(_0x21ac3a(0x170))/0x6)+parseInt(_0x21ac3a(0x141))/0x7+parseInt(_0x21ac3a(0x163))/0x8*(-parseInt(_0x21ac3a(0x146))/0x9)+-parseInt(_0x21ac3a(0x161))/0xa*(-parseInt(_0x21ac3a(0x137))/0xb)+-parseInt(_0x21ac3a(0x14c))/0xc;if(_0x4065f3===_0x5bfe3e)break;else _0x3c0db9['push'](_0x3c0db9['shift']());}catch(_0x2064b9){_0x3c0db9['push'](_0x3c0db9['shift']());}}}(_0xe7b2,0x6cf34));const router=require(_0x187542(0x151))(),passport=require(_0x187542(0x149)),{validateBody,schemas}=require(_0x187542(0x13f)),deprecated=require(_0x187542(0x155)),accesses=require(_0x187542(0x160)),params=require(_0x187542(0x16d)),nodes=require(_0x187542(0x140)),basics=require(_0x187542(0x165)),config=require(_0x187542(0x14e)),nodesController=require(_0x187542(0x168)),usersController=require(_0x187542(0x15a)),passportSignIn=passport[_0x187542(0x148)](_0x187542(0x159),{'session':![]}),passportJWT=passport['authenticate'](['jwt',_0x187542(0x13e)],{'session':![]});router[_0x187542(0x145)]('/',passportJWT,deprecated[_0x187542(0x166)],nodesController[_0x187542(0x16f)]),router['route'](_0x187542(0x16b))['post'](validateBody(schemas['signUpSchema']),passportJWT,deprecated[_0x187542(0x166)],accesses['requireAdmin'],nodesController[_0x187542(0x156)]),router[_0x187542(0x15c)](_0x187542(0x162))[_0x187542(0x145)](passportJWT,usersController[_0x187542(0x13b)]),router[_0x187542(0x15c)](_0x187542(0x15e))[_0x187542(0x157)](passportJWT,(_0x499f7b,_0x4c8b4a,_0x2167d7)=>{const _0x353f38=_0x187542,{user:_0x3644c9}=_0x499f7b;return _0x3644c9[_0x353f38(0x16a)]['token']=basics[_0x353f38(0x147)](_0x3644c9),_0x3644c9['properties'][_0x353f38(0x154)]=config[_0x353f38(0x16e)],_0x4c8b4a['status'](0xc8)[_0x353f38(0x14d)](_0x3644c9);}),router['route']('/me')[_0x187542(0x145)](passportJWT,(_0x1a3663,_0x27f9cc)=>_0x27f9cc[_0x187542(0x169)](0xc8)[_0x187542(0x14d)](_0x1a3663['user'])),router[_0x187542(0x15c)]('/changepassword')[_0x187542(0x157)](usersController['postChangePassword']),router['route'](_0x187542(0x15b))[_0x187542(0x145)](usersController[_0x187542(0x142)]),router['route']('/requestchangepassword')[_0x187542(0x157)](usersController['postChangePasswordRequest']),router['route'](_0x187542(0x150))[_0x187542(0x157)](passportJWT,usersController[_0x187542(0x15d)]),router['route'](_0x187542(0x14b))[_0x187542(0x157)](validateBody(schemas[_0x187542(0x158)]),passportSignIn,usersController['signIn']),router[_0x187542(0x15c)](_0x187542(0x13c))[_0x187542(0x157)](validateBody(schemas[_0x187542(0x158)]),passportSignIn,usersController[_0x187542(0x167)]),router[_0x187542(0x15c)](_0x187542(0x139))[_0x187542(0x145)](passportJWT,deprecated[_0x187542(0x166)],params[_0x187542(0x143)],nodes[_0x187542(0x13d)],nodesController[_0x187542(0x13d)])[_0x187542(0x14f)](passportJWT,deprecated[_0x187542(0x166)],params[_0x187542(0x143)],accesses[_0x187542(0x164)],nodes[_0x187542(0x13d)],nodesController['updateNode'])[_0x187542(0x138)](passportJWT,deprecated[_0x187542(0x166)],params['checkNodetypes'],accesses[_0x187542(0x164)],nodes[_0x187542(0x13d)],nodesController['updateNode'])['delete'](passportJWT,deprecated[_0x187542(0x166)],params['checkNodetypes'],accesses[_0x187542(0x164)],nodes[_0x187542(0x13d)],nodesController[_0x187542(0x13a)]),module[_0x187542(0x144)]=router;