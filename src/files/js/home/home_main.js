/*
JS code for home_main.xsl
Last update : Michael 2013/06/18 no more exchange rates in the home page.
*/

var carousel=null;

$(document).ready(function(){	
	carousel=new Carousel($(".carousel"),{
		seconds:5
	});
	adjustFeedBlockHeight();
});

function adjustFeedBlockHeight(){
//Just after the side column has been loaded	 (by ajax), adjust the feed block height.
	var a=$("#side").outerHeight(true)
	var b=$(".carousel").outerHeight(true);
	var h=a - b - 66;
	$("#msgFeed").height(h);
}



/*

Carousel class

used to display picture every n seconds

The html code must contain an element with several pictures.
Only one picture must be displayed, other must be hidden.

*/

var Carousel=function(element,options){
	var defaultOptions={
		seconds:5,//seconds before displaying the next image, if 0, no automatic switch
	}
	var settings=$.extend(defaultOptions,options);
	var o=this;
	var index=1;
	var timestamp=(new Date()).getTime();
	var key="carousel"+timestamp
	$(window).data(key,o);
	
	o.container=element
	o.slides=o.container.find(".slide");
	o.noAnimation=false;
	var count=o.slides.length;
	
	this.update=function(next){
		if(o.noAnimation==true) return false;
		if (settings.seconds>0){
			 o.timeoutID=window.setTimeout("$(window).data('"+key+"').update(true)",settings.seconds*1000);	
		}
		if(next) o.displayNextImage();		
	}
	
	this.displayNextImage=function(){
		index++;
		if(index==count+1) index=1;
		o.displayImage(index);				
	}
	
	this.displayPreviousImage=function(){
		index--;
		if(index==0) index=count;
		o.displayImage(index);				
	}

	this.displayImage=function(i){
		var img=$(o.slides[i-1])
		if(img.is(":visible")) return;
		o.container.find(".slide:visible").hide();
		img.fadeToggle("slow");
	}

	this.update(false);
		
	/*mouse over: stop temporally the animation*/
	o.container.mouseenter(function(){
		window.clearTimeout(o.timeoutID);
	});
	o.container.mouseleave(function(){
		o.update(false);
	});	
	
	/*Previous and next buttons */
	o.previousButton=o.container.find(".previous-slide span").click(function(){										
		o.displayPreviousImage();
	});
	o.nextButton=o.container.find(".next-slide span").click(function(){
		o.displayNextImage();
	});
	
	
}//End of Carousel class