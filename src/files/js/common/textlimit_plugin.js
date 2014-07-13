/*
textlimit plugin
Used to limit field content to n characters (for <textarea> and <input type="text">)
Built from a plugin found at : http://unwrongest.com/projects/limit/
---------------
How to use it :
Call textlimit function on field jQuery object with 3 parameters :
- limit : max. number of characters
- elements : jQuery element displaying the number of characters left.
Modifications by Michael
I added the 3rd parameter : placeHolder, the placeHolder used in WIMS translations, to be replaced by the number of characters left.

Example : 	$("#my-field").textlimit(10,$("#nb-left"),"[n]");
-----------------
2012-09-25, Michael from Osaka for Brastel IMT project
*/

(function($){
	$.fn.extend({
	textlimit: function(limit,element,placeHolder) {
	var interval, f;
	var x="?";
	var self = $(this);
	var defaultText=element.html();
	
	$(this).focus(function(){
		interval = window.setInterval(substring,100);
	});
	$(this).blur(function(){
		clearInterval(interval);
		substring();
	});
	
	function substring(){ 
		//1. Truncate the textarea content
		var val = self.val();
		var length = val.length;
		if(length > limit){
			self.val(self.val().substring(0,limit));
		}
		
		//2. Update the element that displays the number of characters left, using a place holder for translations
		var nbLeft=(limit-length<=0) ? 0 : limit-length;
		if(typeof element == 'undefined') return;
		var html0=element.html();//current content of the element
		var html1="";
		if(placeHolder){
			var expr=new RegExp("\\["+placeHolder+"\\]");
			html1=defaultText.replace(expr,nbLeft.toString());
		}
		else{
			html1=nbLeft;
		}
		if(html1!=html0) element.html(html1);
	}
	
	substring();
	}
	});
})(jQuery);