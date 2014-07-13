/*
JS code used by all external pages : registration,home and customer pages
Used to display a popup for links in the footer, to translate content from etext...
Last update : Michael @Osaka 2013-08-02 Multibroker branch. showLoading function added.
*/

LOADING_LAYER_CLASSNAME = 'page-load-overlay';//used by showLoading() and hideLoadin() functions

$(document).ready(function(){

	//Open the footer links in a popup 
	$("#footer .links a").fancybox({
		type: 'ajax',
		autoSize:false,
		autoHeight: true,
		width		: '70%',
		'ajax': {
        	dataFilter: function(data) {
            	return $(data).find('.legal-document')[0];
        	}
    	},		
		afterShow:function(x,y){
			$(".legal-document").linkify();														
		}
	});
	
});//ready

function translate(eTextId,defaultText){
//Returns the translated text, related to a given eText Id
//eTextId must have one of the following formats : I0000-0000-0000 or 0000-0000-0000 (without the prefix"I")
//if eTextId is not found, returns the given defaultText.
	var isETextId=false;
	var strRegExp="\d{4}-\d{4}-\d{4}";
	if(/^I\d{4}-\d{4}-\d{4}$/.test(eTextId)) isETextId=true;
	if(/^\d{4}-\d{4}-\d{4}$/.test(eTextId)){
		eTextId="I"+eTextId
		isETextId=true;
	}
	
	var x=(defaultText) ? defaultText : eTextId;
	var translation="";
	var node=$("#"+eTextId);
	if(node.length>0) translation=node.html();
	//var translation=eText[eTextId];
	if(translation != ""){
		if(/.* <b>\(.*\)<\/b>/.test(translation)){
			var re=new RegExp("(.*) <b>\(.*\)<\/b>","g");
			var translation=translation.replace(re,'<span class="editable-translation" id="$2">$1</span>');					
		} 
	}
	return (translation != "") ? translation : x; 
}

function showLoading(){
    var loading=$('.'+LOADING_LAYER_CLASSNAME);
	if(loading.length==0){
        loading=$('<div class="'+LOADING_LAYER_CLASSNAME+'"><img src="'+imgRoot+'/external/loading.gif"></div>').appendTo($("body"));
    }
}
function hideLoading(){
    $('.'+LOADING_LAYER_CLASSNAME).remove();
}

/*

Linkify plugin, used to convert terms and conditons page URLs to links.

*/
(function($) {
  function replaceSubstitutions(str, array) {

    for (var i = 0; i < array.length; i++) {
      str = str.replace('{' + i + '}', array[i]);
    }

    return str;
  }


  $.fn.linkify = function() {

    function _linkify(s) {

      var re = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/im;
      var match, replacements = [],i = 0;
      while (match = re.exec(s)) {
        replacements.push('<a href="' + match[0] + '" target="_new">' + match[0] + '</a>');
        s = s.replace(re, '{' + i + '}');
        i++;
      }

      return i > 0 ? replaceSubstitutions(s, replacements) : s;
    }

	$(this).each(function(index,element){
		var node=$(element)	;			
		var html=_linkify(node.html());
		node.html(html);
	})

    return this;
  };//linkify plugin


})(jQuery);
