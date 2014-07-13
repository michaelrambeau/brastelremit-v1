/* 
jQuery plugin : a drop-down menu to select language
From the theme switcher of the jQueryUI home
Michael @Osaka
Last version : 2011/11/10
*/
$.fn.switcher = function(settings){
	var options = jQuery.extend({
		data: null,
		initialText: 'Language',
		width: 200,
		height: 200,
		buttonPreText: '',
		closeOnSelect: true,
		buttonHeight: 14,
		cookieName: 'jquery-ui-theme',
		onOpen: function(){},
		onClose: function(){},
		onSelect: function(){}
	}, settings);

	//markup 
	$(this).addClass("switcher");
	var htmlData="";
	jQuery.each(options.data,function(index,element){
			htmlData+='<li><a rel="'+element.code+'"><span>'+element.text+'</span></a></li>'										   ;
	});
	var button = $('<a href="#" class="button-default"><span class="switcher-icon"></span><span class="switcher-title">'+ options.initialText +'</span></a>');
	var switcherpane = $('<div ><div class="switcherpane"><ul>'+htmlData+'</ul></div></div>').find('div').removeAttr('id');
	
	//button events
	button.click(
		function(){
			if(switcherpane.is(':visible')){ switcherpane.spHide(); }
			else{ switcherpane.spShow(); }
					return false;
		}
	);
	
	//menu events (mouseout didn't work...)
	switcherpane.hover(
		function(){},
		function(){if(switcherpane.is(':visible')){$(this).spHide();}}
	);

	//show/hide panel functions
	$.fn.spShow = function(){ 
		$(this).css({top: button.offset().top + options.buttonHeight + 6, left: button.offset().left}).slideDown(50);
		//button.css(button_active);
		button.addClass("button-active").removeClass("button-hover");
		options.onOpen();
	}
	$.fn.spHide = function(){ 
		$(this).slideUp(50, function(){options.onClose();}); 
		button.css(button_default);
		button.removeClass("button-active");
	}
	
		
	switcherpane.find('a').click(function(){
		var newAcr= $(this).attr('rel') ;
		
		var texte = $(this).find('span').text();
		button.find('.switcher-title').text( options.buttonPreText + texte);
		//$.cookie(options.cookieName, themeName);
		options.onSelect();
		if(options.closeOnSelect && switcherpane.is(':visible')){ switcherpane.spHide(); }
		
		//Loading a new URL
		switchLanguage(newAcr);
		return false;
	});
		
	/* Inline CSS 
	---------------------------------------------------------------------*/
	var button_default = {
		width: options.width - 11,//minus must match left and right padding 
	};
	
	
	//button css
	button.css(button_default)
	.hover(
		function(){ 
			$(this).addClass("button-hover").removeClass("button-active"); 
		},
		function(){ 
		 if( !switcherpane.is(':animated') && switcherpane.is(':hidden') ){	
		 	$(this).css(button_default); 
			//$(this).addClass("button-default"); 
			$(this).removeClass("button-hover").removeClass("button-active"); 
			}
		}	
	);	
	//pane css
	switcherpane.css({
		width: options.width-6//minus must match left and right padding

	})
	.find('ul').css({
		height: options.height
	}).end()
	.find('li').hover(
		function(){ 
			//in;
		},
		function(){ 
			//out
		}
	).css({
		//width: options.width-30,//<li> height
		width: options.width-14,//<li> height
	}).end();
	
	$(this).append(button);
	$('body').append(switcherpane);
	switcherpane.hide();
	/*if( $.cookie(options.cookieName) || options.loadTheme ){
		var themeName = $.cookie(options.cookieName) || options.loadTheme;
		switcherpane.find('a:contains('+ themeName +')').trigger('click');
	}*/

	return this;
};

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}