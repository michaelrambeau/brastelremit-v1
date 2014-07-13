﻿ /*
Common tools used by both IMT web site and CRM
- IMTDialog : used to display popup 
- IMTAjax : used to call WIMS web methods that return XML
Last update : Michael 2012-08-15 hideLoading() call
*/


/*
HTML markup used by IMTDialog :

<div id="dialog-XXXX" style="display:none;">
	<div class="imt-dialog imt-dialog-success">
		<form>
		<h2>MY TITLE</h2>
		<div class="icon"><xsl:comment>icon</xsl:comment></div>
		<div class="text">
			<h3>Thank you!<br/>Your request has been received.</h3>
			<p>Your deposit card will be delivered to your</p>
		</div>
		<div class="buttons">
			<button type="button" class="button action2 button-close">Cancel</button>
			<button type="submit" class="button action1">OK</button>			
		</div>
		</form>
	</div><!--.imt-dialog-->
</div>

Example of call :
new IMTDialog($("#dialog-delete-account-step1"),options)

*/

$(document).ready(function(){
	//fancybox associated to all <a> links with "dialog-link" class
	//Example of use:
	//<a href="my popup" class="dialog-link"> will automatically open in a popup the html node which id is "my-popup"
	$(".dialog-link").fancybox();
});

//To avoid any browser cache issue with JSON ajax calls (specially in IE)
$.ajaxSetup({
  cache: false
});

var IMTDialog=function(content,options,validationOptions){
	$(":focus").blur();//remove the focus on the button that called the popup, to be able to use Espace key
	var o=this;	
	o.defaultOptions={
		modal: false,
		onClose: function(){/*empty function, do not use null for fancybox*/},
		onSubmit: null,//called when the popup is submitted
		reloadOnClose: false,//Reload the page after having closed the popup (useful to refresh content for example)
		plugin: "fancybox",
		debug: false,//a "fake" web method is called when the debug mode is activated
		
		/*options to call a webmethod when the form inside the popup is submitted*/
		webMethod:"",//web method called
		data:null,//data submitted, if null, form data is submitted
		onSuccess :null,//callback of the web method
		useValidationPlugin:true,//is the form submitted used the jquery.validation plugin ?
		
		/*options to build the popup, if the content attribute is a string (html code) and not a jQuery node*/
		title:"",
		showOkButton:true,
		buttonLabel: "OK",
		className:""
	};
	
	o.settings=$.extend(o.defaultOptions,options);
	
	//The validation plugin is used if the option is set to true and if the plugin is included.
	o.useValidationPlugin=o.settings.useValidationPlugin && $.validator;
	if(o.useValidationPlugin){
		o.defaultValidationOptions={
			debug:false,//when validation debug option is set to true, the form is never submitted, even if a JS error occurs.
			submitHandler:function(){
				if(o.settings.webMethod) o.launchWebMethod();
				if(o.settings.onSubmit) o.settings.onSubmit(o.form);
			},
			
			errorPlacement: function(error, element) { 
				if(element.is(".checkbox-container input")){
					//For check-boxes : there is no error message to display
					return;
				}
				if(element.is("input[type=radio]")){
					return;
				}
				//by default, just after the input
				element.after(error);
			},
			errorClass: "field-validation-error",
			highlight: fnHighlightNextCell,
			unhighlight: fnUnhighlightNextCell
		};
		o.settingsValidation=$.extend(o.defaultValidationOptions,validationOptions);
	}//if(o.useValidationPlugin)
	
	o.timestamp=new Date().getSeconds();
	

	
	o.success=false;//local variable updated by the ajax success callback, used in afterClose callback.
	
	var fancyboxOptions={
		modal:this.settings.modal,
		showCloseButton:true,
		afterClose:function(){
			if(o.settings.onClose) o.settings.onClose();
			if(o.success && o.settings.onSuccess!=null) o.settings.onSuccess();
			if(o.settings.reloadOnClose==true){
				if(typeof(reloadWindow)=='function'){
					reloadWindow();
				}
				else{
					self.location.reload();
				}
			}
		}
	};
	
	o.log=function(message){
	//LOG method	
		if(this.settings.debug && window.console) console.log(message);
	};
	
	
	//content parameter can be a jQuery object (the HTML node to be displayed) or HTML code.
	var html=(typeof(content)=="string") ? content : content.html();
	if(this.settings.title!=""){
		html='<div class="imt-dialog'+((this.settings.className=="") ? "" : " "+this.settings.className)+'">';
		html+='<h2>'+this.settings.title+'</h2><p>'+content+'</p>';
		if(o.settings.showOkButton) html+='<div class="buttons"><button class="button action1 ui-corner-all button-close">'+this.settings.buttonLabel+'</div>';
		html+='</div>';
	}
	
	var x=(typeof(content)=="string") ? html : content;
	$.fancybox.open(x,fancyboxOptions);
	
	var container=$(".fancybox-inner");//the container generated by the dialog component.

	o.container=container;
	
	//Launch a web method if the form embedded in the dialog is submitted.
	o.form=this.container.find("form");
	
	//Put the focus on the first visible field (caution : you cannot use Espape key to close the popuup in this case!)
	var elements=o.form.find("input,textarea").filter(":visible");
	if(elements.length>0) $(elements[0]).focus();
	
	//method used to launch a WIMS web method when the form inside the dialog is submitted
	o.launchWebMethod=function(){
		var webMethodData=o.form.serialize();
		if(o.settings.data) webMethodData+="&"+jQuery.param(o.settings.data);
		
		o.showLoading();
		o.form.find("button").css("opacity",0.5).attr("disabled","disabled");//to prevent the user from submitting a second time the form
		new IMTAjaxXMLRequest(
			o.settings.webMethod,
			webMethodData,
			{
				callbackSuccess: function(xml){
					o.hideLoading();
					o.success=true;
					o.close();
				},
				
				callbackComplete: function(resultCode,imtAjaxObject){
					o.form.find("button").css("opacity",1).removeAttr("disabled");
					if(resultCode!="0" && o.settings["onError"+resultCode]){
						//Launch the error callback specified for the error onErrorXXXX
						o.settings["onError"+resultCode]();
						imtAjaxObject.options.disableErrorManager=true;
					}
				},

				debug: o.settings.debug
			}
		);//AjaxXMLRequest object used in IMT application	
		return false;
	};
	
	
	if(this.form.length>0){
		
		if(!o.useValidationPlugin){
			this.form.unbind("submit");//required if IMTDialog is called several times
			o.form.submit(function(){
				if(o.settings.webMethod) o.launchWebMethod();
				if(o.settings.onSubmit){
					o.settings.onSubmit(o.form);
					o.close();					
				}
				return false;//to avoid "normal" submission
			});
		}
		
		//validation plugin is used to manage the checkbox field in the popup
		else{
			//the 2 following lines are necessary because a validator object may already exists if the dialogbox has been opened before.
			//in this case, we have to remove the previous validator object, stored in data, and unbind the submit event.
			//Otherwise, when we call o.launchWebMethod through the submitHandler callback, o will not be the expected object.
			o.form.unbind("submit");
			o.form.data("validator",null);
			o.form.validate(o.settingsValidation);
		}
	}
		
	$(".button-close").click(function(){//search for a close button
		o.close();
	});
	
	o.close=function(){
	//CLOSE method
		if(this.settings.plugin=="fancybox") $.fancybox.close();
		if(this.settings.plugin=="nyromodal") $.nmTop().close();//Nyromodal
	};
	
	this.showLoading=function(){
	//Display a loading picture inside the dialogbox
		$.fancybox.showLoading();
	};
	this.hideLoading=function(){
		//Display a loading picture inside the dialogbox
		$.fancybox.hideLoading();
	};
	this.toString=function(){
		var strLog="IMTDialog class";
		if(content.length>0) strLog+=" "+content[0].id;
		return strLog;
	};
	//if(window.console) console.log(this.toString());
	
}//end of the class!

$.fancybox.showActivity=$.fancybox.showLoading;//for compatibility with Fancybox v1
$.fancybox.hideActivity=$.fancybox.hideLoading;//for compatibility with Fancybox v1





/*

#######################

IMTAjaxXMLRequest class

used to launch WIMS web method and deal with the XML response 

########################

*/

var IMTAjaxXMLRequest=function(methodName,data,options){
	
	this.toString=function(){
		return "IMTAjaxXMLRequest class";
	};
	
	this.disableButton=function(){
		//When an ajax request is called, disable the submit button to avoid a new submission
		if(!o.options.container) return;
		if(o.options.showLoading && typeof(showLoading)=="function") showLoading();
		o.options.container.find("[type=submit]").attr("disabled","disabled").css("opacity",0.5);//prevent the user from submitting twice.
	};
	
	this.enableButton=function(){
		//Restore the buttons after the request
		if(!o.options.container) return;
		if(o.options.showLoading && typeof(hideLoading)=="function") hideLoading();			
		if(o.options.container) o.options.container.find("[type=submit]").removeAttr("disabled").css("opacity",1);				
	};
		
	/* An example of callback function called when XML response is OK */
	this.defaultCallbackSuccess=function(xml){
		if(window.console) console.log("IMTAjaxXMLRequest object / "+methodName+" web method / result is OK!");
	};
		
	var defaultOptions={
		callbackSuccess: this.defaultCallbackSuccess,//function to be launched when XML response is OK
		callbackError: null,//callback used each an error occurs
		callbackComplete: null,	
		defaultCallbackError: function(errorCode,errorMessage){
			new IMTDialog(errorMessage,{title:"Error number "+errorCode+" returned by "+methodName});
		},//callback used for errors that have not been trapped
		debug:false,
		/* HTML blocks to be displayed or hidden according to the result */
		container: null,//$("body"),//container for resultOk, resultError and loading blocks
		resultOk: ".ajax-result-ok",//element displayed when result is OK (inside the container).
		resultError: ".ajax-result-error",//element displayed when result is OK (inside the container).
		errorPrefix:".error-number-",
		loading: ".ajax-spinner",//element displayed  when request is loading (inside the container)
		type: 'post',
		disableErrorManager: false,
		restoreButton: true,//by default the submit button is not restored (displayed again) after the request
		showLoading: false
	};
	this.options=$.extend(defaultOptions,options);
	var o=this;
	
	o.spinner=null;
	o.container=null;
	o.resultOk=null;

	
	if(o.options.container){
		o.container=o.options.container;	
		o.spinner=$(o.options.loading, o.container).fadeIn();
		o.resultOk=$(o.options.resultOk, o.container).hide();
		$(o.options.resultError, o.container).hide();
		o.disableButton();
	}

	if(o.options.debug==true && window.console) console.warn('DEBUG mode : a fake webmethod is used instead of "'+methodName+'"');
	var actionParameter=(o.options.debug==true) ? "GetLatestAllExchangeRefValues": methodName;
		
	var ajaxOptions={
	   type : o.options.type,
	   url : wimsURL+"&acr="+acr+"&action="+actionParameter+"&outputFormat=xml&xslFile=getwebmethodxml.xsl",
	   data : data,
	   cache: false,
	   
	   complete : function(xhr,textStatus){
			o.xhr=xhr;//the jQuery xhr object can be useful (see autocomplete component)
			if(textStatus=="error") return;//an error status can happen if the user is too fast when leaving a page, or if he pushes the escape key while the request is loading.
			var code=$(xhr.responseXML).find("Data > Result > Code").text();
							 
		   if(o.options.callbackComplete) o.options.callbackComplete(code,o);
		   
			if(code=="0"){
				//web method call is successfull
				if(o.resultOk) o.resultOk.fadeIn("slow");
				if(o.options.restoreButton) o.enableButton();
				o.options.callbackSuccess.apply(o,[$(xhr.responseXML),o.xhr]);
			}
			else{
				o.enableButton();
				var message=getMessageFromXML(xhr.responseXML);
				if(message=="ERROR"){//First case : wims returned an HTML error page (if the method is not registered for example)
					var dialog=new IMTDialog(xhr.responseText,{title:"Error returned by WIMS when calling "+methodName,showOkButton:false,className:"imt-dialog-error"});
					dialog.container.find("a").click();//trigger a click event in order to display the error message
					dialog.container.find("div").removeAttr("style");
				}
				else{
					//Common case : wims returned an XML page that contains the error code.
					if(!o.options.disableErrorManager) o.errorManager(code,message);
				}
			}
			//Hide the loading .gif after the callback is executed.
			if(o.spinner) o.spinner.hide();
		
	   }//complete		
	};
	$.ajax(ajaxOptions);//ajax
		
	this.errorManager=function(errorCode,errorMessage){
	//Method called when a given error has been returned by the WIMS method.
        if (typeof(hideLoading)) hideLoading();
		if(window.console) console.log("IMTAjaxXMLRequest object / "+methodName+" web method / error number "+errorCode);
		
		//1. check whether the user has not been disconnected
		if(errorCode==3000){
			this.disconnectCallback();
			return true;
		}
		
		//2. launchs a callback function (defined with the parameters)
		var specificErrorCallback=(errorCode && o.options["callbackError"+errorCode]);
		var callbackLaunched=false;
		if(specificErrorCallback){
			callbackLaunched=true;
			specificErrorCallback.apply(o,[errorMessage]);
		}
		else{
			if (o.options.callbackError){
				o.options.callbackError.apply(o,[errorCode,errorMessage]);
				callbackLaunched=true;
			}
		}


		//3. display error messages inside the container
		if(o.container){
			//1. Search for a specific HTML block related to the error number
			var errorBlock=$(o.options.errorPrefix+errorCode,o.container);
			//2. if not found, search for a generic block
			if(errorBlock.length==0) errorBlock=$(".all-errors",o.container);
			if(errorBlock.length>0){
				errorBlock.fadeIn("slow");
				return true;
			}
		}

		//Last, if no callback was launched and if no message was displayed we call the default	error callback
		if(!callbackLaunched){
			o.options.defaultCallbackError(errorCode,errorMessage);
		}

	};//errorManager() method
	
	this.disconnectCallback=function(){
		//Display a specific error message if the user has been disconnected	
		var title=translate("0001-0041-0004","Time-out");
		var msg=translate("0001-0041-0005","You have been disconnected.<br>Please click the OK button to log-in again.");
		var buttonText=translate("0001-0041-0006");
		var button='<div class="confirm-buttons"><button class="button action1 ui-corner-all ui-shadow button-reload">'+buttonText+'</div';
	
		new IMTDialog(msg,{
			title:title,
			reloadOnClose:true
		});		
	};
	
	
}//IMTAjaxRequest class	

function getMessageFromXML(responseXML){
//Get a message from an XML response :"OK" or error message
	var xml=$(responseXML);
	//First, look at <MessageInternal> that contains "OK" if everything is allright
	var message=$(xml).find('MessageInternal').text();
	if(message!="") return message;
	//If empty, error message can be in <message> node
	message=$(xml).find('Message').text();
	if(message!="") return message;
	//default
	return "ERROR";
}


function xmlToArray(xml,dataXpath,dataMap){
	/*
	Get an array of data from XML ajax response
	Parameters :
	- xml : ajax response xml
	- dataXpath : a jquery string to select data nodes from XML data
	- map : maps the return keyword to tag name to search for beneath the dataXpath
	Example : {valueTagName:"BankCode",textTagName:"BankName"}

	*/
	var defaultMap = { 
		"value": "value",
		"label": "label"
	};
	var map = dataMap || defaultMap;
	var data=$(dataXpath,xml);

	var x=[];
	var vals, val, obj;

	data.each(function(index,element){
		obj = {"index": index};
		for(var key in map){
			vals=$(element).find(map[key]);
			// if more than one results were found then pass back an array
			if(vals.length > 1){
				val = [];
				vals.each(function(i, el){
					val.push($(el).text());
				});
			} else {
				val = vals.text();
			}
			obj[key] = val;
		}
		x.push(obj);
	});

	return x;

}