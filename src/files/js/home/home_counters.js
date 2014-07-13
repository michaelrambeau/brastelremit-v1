/*
Code for "Brastel Remit Counter" page, created by Michael in 2013/04
Googlemaps API is used to display maps inside fancybox dialog.
*/
$(document).ready(function(){
	
	/*
	MAP #1: TOKYO
	*/
	new CounterMap(
		$("#tokyo-map-link"),
		$("#tokyo-map-info-window"),
		{
			latitude:35.700913699799806,
			longitude: 139.79456797242165
		}
	);//CounterMap constructor
	
	
	/*
	MAP #2: NAGOYA
	*/	
	new CounterMap(
		$("#nagoya-map-link"),
		$("#nagoya-map-info-window"),
		{
			latitude:35.169017651853544,
			longitude: 136.89916491508484
		}
	);//CounterMap constructor
	
	/*
	TEST
	*/	
	new CounterMap(
		$("#my-link"),
		$("#my-info-window"),
		{
			latitude: 34.653862303712856,//osaka
			longitude: 135.50384491682053
		}
	);//CounterMap constructor
	
});

/*

CounterMap class
used to display a GoogleMap inside a fancybox dialog

Example of mark-up :


Parameters :
- html link jQuery object (the link the user clicks to display the window)
- info window jQuery objcet
- an object with all settings, including latitude and longitude of the point used at the center of the map

*/

var CounterMap=function(linkNode,bubbleNode,options){
	var defaultSettings={
		longitude: 0,
		latitude: 0,
		zoom:15,
		title: "Brastel Remit Counter"
	};
	var settings=$.extend(defaultSettings,options);
	
	var xy=	new google.maps.LatLng(settings.latitude, settings.longitude); //point used at the center of the map
	var mapOptions = {
          center: xy,
          zoom: settings.zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP
    };
	
	this.mapNode=$(linkNode.attr("href"));//look for the node that will be filled with the map
	this.map=new google.maps.Map(this.mapNode[0],mapOptions);
	var myMap=this.map;
	
	var marker = new google.maps.Marker({
	    position:xy,
    	title: settings.title
	});

	marker.setMap(myMap);	
	
	//Add the bubble with Brastel address
	var info=new google.maps.InfoWindow({
		position: xy,
		content: bubbleNode.show()[0]
	});
	
	linkNode.fancybox({
		autoSize:false,
		width : '70%', 	
		height: '70%',
		beforeShow: function(){
		},	
		onUpdate:function(){
			//fancybox resize event
			google.maps.event.trigger(myMap, 'resize');
			myMap.setCenter(xy);
		},
		afterShow:function(x,y){
			google.maps.event.trigger(myMap, 'resize');
			myMap.setCenter(xy);
			info.open(myMap);
		}
	}); 
	
	google.maps.event.addListener(marker, 'click', function(event) {
      info.open(myMap)
	});
	
	//following click event is used to read latitude and longitude in 
	google.maps.event.addListener(myMap, 'click', function(event) {
      if(window.console) console.log("click event",event.latLng);
	})
	
}//CounterMap class