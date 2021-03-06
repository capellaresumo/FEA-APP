angular.module('app_fea.controllers', [])

.controller('AppCtrl', function($scope) {})

.controller('BandejaoCtrl', function($scope, Cardapio_server, $ionicLoading) {
   $scope.cardapio = [];
   $scope.doRefresh = function() {
      Cardapio_server.get(function(data) {
         $scope.cardapio = data;
         $ionicLoading.hide();
         $scope.$broadcast('scroll.refreshComplete');
      }, function(error) {
         console.log(JSON.stringify(error));
         $ionicLoading.hide();
         $scope.$broadcast('scroll.refreshComplete');
         $ionicLoading.show({
            template: 'Verifique sua conexão.',
            duration: 1200
         });
      });
   };

   $scope.$on('$ionicView.enter', function() {
      $ionicLoading.show();
      $scope.doRefresh();
   });
})

.controller('CircularCtrl', function($scope, Post_login, Get_linha) {
      var aut = false;
      var markers = [];
      var map;
      try {
         var mapOptions = {
            center: new google.maps.LatLng(-23.5588, -46.7291),
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
         };

         map = new google.maps.Map(document.getElementById("mapc"), mapOptions);
         $scope.map = map;
         carregarMarkers();

         new google.maps.KmlLayer({
             url: 'http://fea.capella.pro/assets/circulares.kml',
             map: map,
             preserveViewport: true
         });

      } catch (err) {
         console.log(err);
      }

      function carregarMarkers() {
         Post_login.save({}, function(b) {
            onibus(2023);
            onibus(2085);
            setInterval(function() {
               onibus(2023);
               onibus(2085);
            }, 5000);
         });
      }

      function onibus(id) {
         for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
         }
         markers = [];
         Get_linha.query({
            code: id
         }, function(data) {
            angular.forEach(data.vs, function(value, key) {
               var marker = new google.maps.Marker({
                  map: map,
                  position: {
                     lat: value.py,
                     lng: value.px
                  },
                  icon: 'img/bus.png'
               });
               markers.push(marker);
            });
         });
      }

      $scope.change = function(linhanum) {
         carregarMarkers(linhanum);
      };

   })
   /* 1 2023
      2 2085
   */

.controller('EventosCtrl', function($scope, Eventos, $ionicLoading) {

   $scope.events = [];
   $scope.eventos_dia = [];
   $scope.options = {
      defaultDate: new Date(),
      dayNamesLength: 2, // 1 for "M", 2 for "Mo", 3 for "Mon"; 9 will show full day names. Default is 1.
      eventClick: function(date) {
         console.log(date);
         $scope.fulldate = date.date;
         $scope.eventos_dia = date.event;
      },
      dateClick: function(date) {},
      changeMonth: function(month, year) {
         get_date(month.index + 1, year);
      },
   };

   var get_date = function(mes, ano) {
      $ionicLoading.show({
         noBackdrop: true
      });
      Eventos.get(mes, ano, function(data) {
         $ionicLoading.hide();
         $scope.events = data;
      }, function(error) {
         $ionicLoading.hide();
         console.log(JSON.stringify(error));
         $ionicLoading.show({
            template: 'Verifique sua conexão.',
            duration: 1200
         });
      });
   };

   get_date($scope.options.defaultDate.getMonth() + 1, $scope.options.defaultDate.getFullYear());

})

.controller('EventoCtrl', function($scope, $stateParams, Eventos) {
   Eventos.get_id($stateParams.id, $stateParams.mes, $stateParams.ano, function(data) {
      $scope.evento = data;

      if ($scope.evento.lat) {
         try {
            var mapOptions = {
               center: new google.maps.LatLng($scope.evento.lat, $scope.evento.lon),
               zoom: 17,
               mapTypeId: google.maps.MapTypeId.ROADMAP,
               disableDefaultUI: true
            };

            var map = new google.maps.Map(document.getElementById("map"), mapOptions);

            var marker = new google.maps.Marker({
               map: map,
               position: mapOptions.center,
               title: $scope.evento.local
            });
            $scope.map = map;

         } catch (err) {
            console.log(err);
         }
      }
   });
})

.controller('NoticiasCtrl', function($scope, Noticias_server, $ionicLoading) {

   var page = 0;
   $scope.listanoticias = [];
   $scope.returnedNothing = false;

   $scope.fetchMore = function() {
      var send_data = {
         start: page * 10,
         number: 10
      };
      Noticias_server.query(send_data, function(data) {
         if (page == 0)
            $scope.listanoticias = [];
         page++;
         data.forEach(function(item) {
            item.time = moment(item.time).format("DD/MM/YYYY");
            $scope.listanoticias.push(item);
         });
         $ionicLoading.hide();
         $scope.$broadcast("scroll.infiniteScrollComplete");
         $scope.$broadcast('scroll.refreshComplete');
         $scope.returnedNothing = data.length == 0;
      }, function() {
         // erro
         $ionicLoading.hide();
         $scope.$broadcast('scroll.refreshComplete');
         $ionicLoading.show({
            template: 'Verifique sua conexão.',
            duration: 1200
         });
      });
   }

   $scope.doRefresh = function() {
      page = 0;
      $scope.returnedNothing = false;
      $scope.fetchMore();
   };

   $scope.doRefresh();
   $ionicLoading.show({
      noBackdrop: true
   });

})

.controller('RotasCtrl', function($scope, $state, Config_rotas) {

   $scope.canShowAlert = false;
   $scope.goToRoute = function(){
         var origin = document.getElementById('start').value;
         var destination = document.getElementById('end').value;
         var travelMode = document.getElementById('mode').value;
         Config_rotas.start = origin;
         Config_rotas.end = destination;
         Config_rotas.mode = travelMode;
         $state.go("app.mapa");
   };
})

.controller("MapaCtrl", function($scope, $ionicModal, Config_rotas){

   $scope.directions = "";
   $ionicModal.fromTemplateUrl('modal-rota.html', {
      scope: $scope,
      animation: 'slide-in-up'
   }).then(function(modal) {
      $scope.modal = modal;
   });
   $scope.openModal = function() {
      $scope.directions = document.getElementById("directionsPanel").innerHTML;
      $scope.modal.show();
   };
   $scope.closeModal = function() {
      $scope.modal.hide();
   };
   //Cleanup the modal when we're done with it!
   $scope.$on('$destroy', function() {
      $scope.modal.remove();
   });

   var directionsDisplay;
   var directionsService = new google.maps.DirectionsService();
   var map;

   directionsDisplay = new google.maps.DirectionsRenderer();
   var mapOptions = {
      center: new google.maps.LatLng(-23.55883742073552, -46.72914826248166),
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
   };
   map = new google.maps.Map(document.getElementById("map"), mapOptions);
   directionsDisplay.setMap(map);
   directionsDisplay.setPanel(document.getElementById("directionsPanel"));
   calculateAndDisplayRoute(directionsService, directionsDisplay);

   function calculateAndDisplayRoute(directionsService, directionsDisplay) {
      directionsService.route({
         origin: Config_rotas.start,
         destination: Config_rotas.end,
         travelMode: Config_rotas.mode,
      }, function(response, status) {
         if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
         } else {
            alert('Ocorreu um erro ao exibir o mapa: ' + status);
         }
      });
   }
});
