/*
Postal Code plugin used to search address data form a given postal code
This file is used by the following pages :
- Registration form
- Edit personal information
- CRM Account
- CRM Customer Registration
------------------------------------
Last update Michael 2012-10-03 prefecture. city, area field is editable
-----------------------------------------------
Example
-----------------------------------------------
$(".postal-code-container").postalCodePlugin({
  callback:function(){
  	$("input[name=postalCode]").valid();
  }
}) 
*/

(function($){

	var DEBUG=true;	
			
	// private function for debugging
	function debug(txt) {
		if (DEBUG && window.console && window.console.log)
		  window.console.log(txt);
	};
	  
	function numbersOnlyKeypress(event){
		var key = event.which;
		//48-57 (0-9)
		//8 - bckspace
		//13 - enter (for double width chars)
		if ((key < 48 || key > 57) && key!=8 && key!=13 && key!=0 && key!=86) return false;
		return true;	
	}
  	  
	$.fn.postalCodePlugin = function(options,dateObject) {  
  
	var defaults = {
		//input used to store data (type="hidden")
		inputPostalCode:$("input[name=postalCode]"),
		inputCity:$("input[name=cityward]"),
		inputArea:$("input[name=area]"),
		inputPrefecture: $("[name=prefecture]"),
		inputPrefectureKanji: $("input[name=prefectureKanji]"),
		
		//DOM elements  used to display data
		displayPrefecture:$("#display-prefecture"),
		displayArea:$("#display-area"),
		displayCity:$("#display-city"),
		
		displayMessageNotFound:$("#postalCodeNotFound"),
		
		//Style
		inputClass:"txt",
		input1Css:{width:"30px"},
		input2Css:{width:"40px"},		
		buttonContent: '<div class="icon-search">&#160;</div></button>',
		buttonClass:"button action1 icon ui-corner-all",
		labelNotFound:"",//displayed when the postal code is not found in the prefecture, area and city blocks
		
		//Others...
		language:acr
	};  
  	var options = $.extend(defaults, options);  
      
 	 return this.each(function() {
  	  
  		obj = $(this);
		var defaultValue=options.inputPostalCode.val();
		debug("init postalCodePlugin "+defaultValue);
		var container=obj;//$('<div class="postal-code-container">').prependTo(obj);
		var code1=defaultValue.substr(0,3);
		var code2=defaultValue.substr(4,4);
		var spinner=$('<div class="ajax-spinner right"></div>').appendTo(container);
  		var inputPostalCode1=$('<input type="text" value='+code1+'>').appendTo(container).addClass(options.inputClass);;
		container.append(' - ');
		var inputPostalCode2=$('<input type="text" value='+code2+'>').appendTo(container).addClass(options.inputClass);;
		
		//($(inputPostalCode1,inputPostalCode2)).addClass(options.inputClass);
		inputPostalCode1.css(options.input1Css).addClass("postalcode1 ignore-validation");		
		inputPostalCode2.css(options.input2Css).addClass("postalcode2 ignore-validation");
		
		var button=$('<button type="button"/>').appendTo(container);
		button.css("margin-left","5px");
		button.html(options.buttonContent);
		button.addClass(options.buttonClass)
		
		var data=getDataFromHTML();
		updateHTMLFromData(data);
		
		button.click(function(){
			searchPostalCodeSplit();						   
		});
		
		inputPostalCode1.keyup(function(){
			if($(this).val().length==3){
				inputPostalCode2.focus();
				inputPostalCode2.select();
			}
		})//keyup
		
		inputPostalCode2.keyup(function(){
			if($(this).val().length==4 && inputPostalCode1.val().length==3) button.focus().click();
		})//keyup
		
		container.find("input[type=text]").change(function(){
			options.inputPostalCode.val("");//Postalcode hidden field should be empty if fields are empty
		})
		
		inputPostalCode1.keypress(numbersOnlyKeypress);
		inputPostalCode2.keypress(numbersOnlyKeypress);
		
		var searchPostalCodeSplit=function(){
			var postalCode1 = inputPostalCode1.val();
			var postalCode2 = inputPostalCode2.val();
			if(postalCode1.length != 3 || postalCode2.length != 4) {
				options.inputPostalCode.val("");//added 2012-09
				if(options.callback) options.callback();
				return false;
			}
			searchPostalCodeAjax(postalCode1 + '-' + postalCode2, lang)
		}//searchPostalCodeSplit()
		
		var searchPostalCodeAjax=function(postalCode){
		//Launches an Ajax request to send user's authentication code	
			spinner.show();
			button.hide();
			options.displayMessageNotFound.hide();
			var ajaxOptions={};
			ajaxOptions.callbackSuccess=function(xml){
					button.show();
					spinner.hide();
					var result={
						postalCode:postalCode,
						prefecture:xml.find("Prefecture").text(),
						prefectureKanji:xml.find("PrefectureKanji").text(),
						area:xml.find("Area").text(),
						areaKanji:xml.find("AreaKanji").text(),
						city:xml.find("Cityward").text(),
						cityKanji:xml.find("CitywardKanji").text()
					}
					updateHTMLFromData(result);
					if(options.callback) options.callback();
        	};
			ajaxOptions.callbackError560=function(xml){
					spinner.hide();				
					button.show();
					options.displayMessageNotFound.show();
					updateHTMLFromData(null);
					if(options.callback) options.callback();
        	}
			//ajaxOptions.spinner=spinner;
			ajaxOptions.container=obj;
			new IMTAjaxXMLRequest("PostalCodeSearch",{postalCode:postalCode},ajaxOptions);
		}//function
		
		//Update HTML (input type="hidden" and display blocks) from data
		function updateHTMLFromData(data){
			//For Japanese language, we display kanji data 
			if(data){
				var prefecture=	data.prefecture;			
				var area=	(options.language=="3" && data.areaKanji) ? data.areaKanji : data.area;			
				var city=	(options.language=="3" && data.cityKanji) ? data.cityKanji : data.city;			
			}
							
			updateDisplayElement(options.displayPrefecture,(data) ? prefecture : options.labelNotFound)
			updateDisplayElement(options.displayCity,(data) ? city : options.labelNotFound)
			updateDisplayElement(options.displayArea,(data) ? area : options.labelNotFound)
			
			options.inputPostalCode.val((data) ? data.postalCode : "");
			options.inputPrefecture.val((data) ? data.prefecture : "");
			options.inputArea.val((data) ? data.area : "");
			options.inputCity.val((data) ? data.city : "");
		}
		
		function getDataFromHTML(){
			var data={
				postalCode:options.inputPostalCode.val(),
				prefecture:options.inputPrefecture.val(),
				area:options.inputArea.val(),
				city:options.inputCity.val()
			}
			return data;
		}
		
		function updateDisplayElement(element,text){
		//Updating the element that displays a given value
			if(element.is("input,select")){
				element.val(text);
			}
			else{
				element.html(text);
			}
		}
		
		
 	});//each
  
 };//$.fn.  
})(jQuery);

