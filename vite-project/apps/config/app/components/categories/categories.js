/* globals angular */
angular.module('app.ganister.config.models.categories', [
  'app.ganister.config.models',
])
  .controller('categoriesController', ($scope, datamodelModel, Notification, $location) => {
    $location.search({ page: 'categories' });
    $scope.categories = [];
    const move = (arr, oldIndex, newIndex) => {
      while (oldIndex < 0) {
        oldIndex += arr.length;
      }
      while (newIndex < 0) {
        newIndex += arr.length;
      }
      if (newIndex >= arr.length) {
        let k = newIndex - arr.length;
        while (k + 1) {
          k -= 1;
        }
      }
      arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
      return arr;
    };

    datamodelModel.getDatamodel()
      .catch((e) => {
        console.log(e);
      })
      .then((result) => {
        $scope.categories = result.categories;
        $scope.nodetypes = result.nodetypes;
      });

    $scope.addCategory = async () => {
      await Swal.fire({
        title: 'Add Category Name below',
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something'
          } else {
            const item = {
              catid: $scope.categories.length,
              name: value.replace(/ /g, ''),
              label: value,
              icon: '',
              hidden: true,
            };
            $scope.categories.push(item);
            $scope.$apply();
          }
        }
      })
    };

    $scope.saveCategories = () => {
      Swal.fire({
        title: 'Are you sure you want to save categories?',
        type: 'warning',
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          datamodelModel.categories.update($scope.categories)
            .then((updateResult) => {
              if (updateResult.status === 200 || updateResult.status === 304) {
                Notification.success('Categories Updated');
                const translations = $scope.categories.map((category) => {
                  if (category.name && category.label) {
                    return {
                      path: `default.category.${category.name}`,
                      value: category.label
                    }
                  }
                })
                console.info(translations);
                if (translations.length > 0) {
                  datamodelModel.translations.update('default', translations).then((result) => {
                    if (result.status === 200) {
                      Notification.success('Categories updated in translation file')
                    } else {
                      Notification.error('Categories not updated in translation file')
                    }
                  })
                }

              } else {
                Notification.success('Categories Not Updated! Read client\'s console for more info');
              }
            })
            .catch(error => console.log(error));

        }
      });
    };

    $scope.removeCategory = (category) => {
      //  Find all nodetype definitions that have this category
      const foundItems = $scope.nodetypes.filter(item => item.category === category.catid);
      let foundItemsMessage = '';
      if (foundItems.length > 0) {
        foundItemsMessage = `This category has ${foundItems.length} nodetypes`;
      }
      Swal.fire({
        title: `${foundItemsMessage}. Are you sure you want to remove ${category.label} category?`,
        type: 'warning',
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          $scope.categories = $scope.categories.filter(item => item.catid !== category.catid);
          $scope.$apply();
        }
      })
    };

    $scope.updateCategoryLabel = async (category) => {
      const categoryIndex = $scope.categories.findIndex(item => item.catid === category.catid);
      await Swal.fire({
        title: 'Add Category Label below',
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something'
          } else {
            $scope.categories[categoryIndex].label = value;
            $scope.$apply();
          }
        }
      })
    };

    $scope.updateCategoryIcon = async (category) => {
      const categoryIndex = $scope.categories.findIndex(item => item.catid === category.catid);
      await Swal.fire({
        title: 'Add new Category Font Awesome Icon below',
        input: 'text',
        inputValue: $scope.categories[categoryIndex].icon,
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something'
          } else {
            $scope.categories[categoryIndex].icon = value;
            $scope.$apply();
          }
        }
      })
    };

    $scope.toggleCategoryVisibility = (category) => {
      const categoryIndex = $scope.categories.findIndex(item => item.catid === category.catid);
      $scope.categories[categoryIndex].hidden = !$scope.categories[categoryIndex].hidden;
    };

    $scope.orderCategoryUp = (category) => {
      //  Find Category Index
      const index = $scope.categories.findIndex(item => item.catid === category.catid);
      if (index > -1) {
        const newIndex = index - 1;
        move($scope.categories, index, newIndex);
      }
    };

    $scope.orderCategoryDown = (category) => {
      //  Find Category Index
      const index = $scope.categories.findIndex(item => item.catid === category.catid);
      if (index > -1) {
        const newIndex = index + 1;
        move($scope.categories, index, newIndex);
      }
    };
  });
