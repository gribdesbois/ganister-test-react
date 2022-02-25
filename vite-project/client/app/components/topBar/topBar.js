angular.module("app.ganister.topBar", [
    'ui-notification',
    'app.ganister.user.config'
])
    .controller('topBarController', function ($scope, $rootScope, $translate, Notification, languagesConfig, userlocal, userconf, socket) {
        $scope.topBarBackgroundColor = "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)";
        $scope.instanceType = '';

        $scope.openAccountModal = () => {
            $rootScope.$broadcast('openAccountModal');
        }
        $scope.setActiveLanguage = (lang) => {
            let language = $rootScope.appDefinition.app.languages.find(item => item.key === lang);
            $rootScope.appContext.user.language = language;
            $translate.use(lang);
            languagesConfig.setUserLanguage($rootScope.appContext.user._id, lang);
            Notification({ title: 'Language Changed', message: '<img src="images/flags/' + language.key + '.png" class="big-flag"></img> <span style="font-size: 16px;">' + language.name + '</span>', positionY: 'bottom', positionX: 'right', delay: 2000 });
        }

        //  Active Users
        $scope.users = $rootScope.activeUsers
        $scope.$on('activeUsers', () => {
            $scope.users = $rootScope.activeUsers
            $scope.$apply()
        })

        //  User Logout
        $scope.logout = () => {
            userlocal.removeToken();
            //  Force Socket to close on logout, even if the window is still open in login screen
            socket.close();
            $rootScope.appContext.logged = false;
        }
        $rootScope.$on("youGotMailUpdate", (e, youGotMail) => {
            $scope.yougotmail = youGotMail;
            $scope.users = $scope.users.map((user) => {
                user.youGotMail = false;
                const msgs = $scope.yougotmail.filter(m => m === user._id);
                if (msgs) {
                    user.youGotMail = true;
                    user.numOfMsgs = msgs.length;
                } else {
                    user.youGotMail = true;
                    user.numOfMsgs = 0;
                }
                return user;
            })
            $scope.$apply();

        })

        $scope.selectInterlocutor = (user) => {
            $rootScope.interlocutor = user;
            user.youGotMail = false;
            $rootScope.youGotMail = $rootScope.youGotMail.filter((mailSender) => {
                return user._id != mailSender;
            })
        }

        $scope.loginElectron = async () => {
            const result = await userconf.loginElectron();
            if (result && result.error) {
                return Notification.error({
                    title: 'Cannot login to Ganister File Sync',
                    message: result.message,
                });
            }
        }

        $scope.$on('datamodelLoaded', () => {
            $scope.instanceType = $rootScope.datamodel.instanceType;
            if ($scope.instanceType === 'DEV') {
                $scope.topBarBackgroundColor = "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)";

            } else if ($scope.instanceType === 'STAGING') {
                $scope.topBarBackgroundColor = "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)";
            }
        })
    })