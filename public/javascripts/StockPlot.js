var app = angular.module('stock-plot', ['ngRoute','ngResource','ui.bootstrap','ngAnimate','highcharts-ng']);

app.config(function($routeProvider){
	$routeProvider
		.when('/', {
			templateUrl: 'main.html',
			controller: 'mainController'
		})
		.when('/login', {
			templateUrl: 'login.html',
			controller: 'mainController'
		})
		.when('/register', {
			templateUrl: 'register.html',
			controller: 'mainController'
		});
});

app.controller('mainController', function($scope, $http){
	$scope.searches = [];
	
	$scope.socket = io();

	$scope.socket.on('stocks', function(stocks){
		$scope.chartConfig.series = stocks.series;
		$scope.searches = stocks.searches;
		$scope.$apply();
	});


	$scope.chartConfig = {
		options: {
			chart: {
				zoomType: 'x'
			},
			rangeSelector: {
				enabled: true
			},
			legend:{
				enabled:true
			},
			navigator:{
				adaptToUpdatedData: true,
				enabled: true
			}
		},
		series: [],
		title: {text:'Stocks'},
		loading: false,
		useHighStocks: true,
		
	};
	$scope.checkChange = function(change){
		if (change > 0) {
			return true
		} else{
			return false
		}
	};
	$scope.round = function(val){
		val = Math.round(val * 100) / 100;
		return val
	}
	$scope.editStock = function(index){
		$scope.searches[index].found = false;
		$scope.searches[index].searched = false;
		$scope.searches[index].max = {};
		$scope.searches[index].min = {};
		$scope.searches[index].change = "";
		$scope.searches[index].heading = "";
	};
	$scope.addStock = function(){
		if ($scope.searches.length < 6){
			$scope.searches.push({
				found: false,
				searched: false,
				max:{},
				min:{},
				change:"",
				heading:"",
				symbol:""
			});
		}
	};
	$scope.removeStock = function(index){
		if($scope.searches[index].symbol === '' || $scope.searches[index].found === false){
			$scope.searches.splice(index,1);
		}
		else{
		for (var i = 0; i < $scope.chartConfig.series.length; i++) {
			if ($scope.chartConfig.series[i].name === $scope.searches[index].symbol){
				$scope.chartConfig.series.splice(i,1);
				$scope.searches.splice(index,1);
				$scope.socket.emit('stocks', {series: $scope.chartConfig.series, searches: $scope.searches});
				return
			} else{
				continue
			}
		}
	}
	};

	$scope.getChartData = function(symbol,index){
		$http.get('http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/json?parameters=%7B%22Normalized%22%3Afalse%2C%22NumberOfDays%22%3A367%2C%22DataPeriod%22%3A%22Day%22%2C%22Elements%22%3A%5B%7B%22Symbol%22%3A%22' + symbol + '%22%2C%22Type%22%3A%22price%22%2C%22Params%22%3A%5B%22c%22%5D%7D%5D%7D')
			.then(function(data){
				var dates = data.data.Dates.map(Date.parse);
				var seriesData = [];
				for (var i = 0; i < dates.length; i++) {
					seriesData.push([dates[i],data.data.Elements[0].DataSeries.close.values[i]]);

				}
				$scope.chartConfig.series.push({'name':symbol,'data':seriesData});
				$scope.searches[index].found = true;
				$scope.searches[index].searched = true;
				$scope.searches[index].max = {value:data.data.Elements[0].DataSeries.close.max, date:data.data.Elements[0].DataSeries.close.maxDate.slice(0,10)};
				$scope.searches[index].min = {value:data.data.Elements[0].DataSeries.close.min, date: data.data.Elements[0].DataSeries.close.minDate.slice(0,10)};
				$scope.searches[index].change = $scope.round(data.data.Elements[0].DataSeries.close.values[dates.length - 1] - data.data.Elements[0].DataSeries.close.values[dates.length - 2]);
				$scope.searches[index].heading = symbol;


			}, function(response){
				$scope.searches[index].searched = true;
				$scope.searches[index].found = false;
				$scope.searches[index].heading = symbol + " was not found";
			})
	};
	$scope.makeChartLocal = function(){
		$scope.makeChart();
		window.setTimeout(function(){$scope.socket.emit('stocks', {series: $scope.chartConfig.series, searches: $scope.searches})},200);
		

	};
	$scope.makeChart = function(){
		$scope.chartConfig.series = [];
		for (var i = 0; i < $scope.searches.length; i++) {
			if ($scope.searches[i].symbol === ''){
				continue
			} else{
			$scope.searches[i].symbol = $scope.searches[i].symbol.toUpperCase();
			$scope.getChartData($scope.searches[i].symbol,i);
			}
		}
		
	};
	$scope.makeChart();
});