/*
------------------------------------------
IMTAjaxXMLRequest object used to call WIMS WebMethod by Ajax and return XML
Last version : Michael@Osaka 2012-10-13 prevent the user from submitting twice
-------------------------------------------
This object implements a default callback if WIMS web method returns an error.
By default, error message is displayed in a jQueryUI dialog.
This behaviour can be overidden by providing your own callback function : options.callBackError(errorMessage)
You can also provide a jQuery selector to display error message in a DOM element : option.errorMessageBlock

------------------------------
Parameters
-------------------------------
- methodName : WIMS method name (action parameter of Ajax request)
- data : same parameter as for jQuery.ajax functions : can be an object or a query string.
- options : object settings
	most inportant option : callbackSucess(xml)
	
-----------------------	
Example
------------------------

new IMTAjaxXMLRequest(
	"RequestInquiry",
	$("form").serialize(),
	{
		callbackSuccess:function(xml){
			var number=xml.find("InquiryReferenceNumber").text();
			showFinalConfirmation(number);
		}
	}
);

*/


/*
Some useful functions...
*/


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
	return "ERROR"
}

/*Displaying error message in a jQueryUI  dialogbox */
function showJqueryUIDialog(msg,title,options){
		var div=$('<div>')
		div.attr("title",title);
		div.append("<p>"+msg+"</p>");
		var defaultOptions={
			width: 600,
			modal:true		
		}
		div.dialog($.extend(defaultOptions,options));
	}//method

function showDialogJqueryUIDisconnected(msg,title,options){
	var buttons=[
    {
        text: "Ok",
        click: function() { $(this).dialog("close");self.location.reload(); }
    }
	]
	var div=$('<div>')
		div.attr("title",title);
		div.append("<p>"+msg+"</p>");
		var defaultOptions={
			width: 400,
			modal:true,  
			buttons:buttons
		}
		div.dialog($.extend(defaultOptions,options));
}

function showDialogNyroModalDisconnected(options){
//Display a specific error message if the user has been disconnected	
	var title=translate("0001-0041-0004");
	var msg=translate("0001-0041-0005");
	var buttonText=translate("0001-0041-0006");
	var button='<div class="confirm-buttons"><button class="button action1 ui-corner-all ui-shadow button-reload">'+buttonText+'</div';
	$.nmData('<h2>'+title+'</h2><p>'+msg+'</p>'+button);
	$(".button-reload").click(function(){
		self.location.reload();
	});
}

function showDialogNyroModal(msg,title,options){
//Display the given message in a nodal popup window, with NyroModal plugin	
		var button='<div class="confirm-buttons"><button class="button action1 ui-corner-all ui-shadow nyroModalClose">OK</div>';
		if(typeof($.nmData)=="function"){
			$.nmData('<h2>'+title+'</h2><p>'+msg+'</p>'+button,{sizes: {minH:300}});
			return;
		}
		if(typeof($.fancybox)=="function"){
			$.fancybox('<h2>'+title+'</h2><p>'+msg+'</p>')
			return;
		}
		alert(title+"\n"+msg);//the basic alert if the plugin was not included		
	}//method

/*

Trap error system :
We search for a block id=error-number-XXXX where XXX is the error number returned by WIMS web method

*/

	
var IMTAjaxXMLRequest=function(methodName,data,options){
		
	/* An example of callback function called when XML response is OK */
	this.defaultCallbackSuccess=function(xml){
		if(window.console) console.log("IMTAjaxXMLRequest object / "+methodName+" web method / result is OK!");
	}
		
	var defaultOptions={
		callbackSuccess: this.defaultCallbackSuccess,//function to be launched when XML response is OK
		callbackError: null,//callback used each an error occurs
		defaultCallbackError: showDialogNyroModal,//callback used for errors that have not been trapped
		
		debug:false,
		delay: 2000,//when debug is true, delay (in milliseconds) before the Ajax call.
		
		/* HTML blocks to be displayed or hidden according to the result */
		container: null,//$("body"),//container for resultOk, resultError and loading blocks
		resultOk: ".ajax-result-ok",//element displayed when result is OK (inside the container).
		resultError: ".ajax-result-error",//element displayed when result is OK (inside the container).
		errorPrefix:".error-number-",
		loading: ".ajax-spinner",//element displayed  when request is loading (inside the container)
		type: 'post'
	}
	this.options=$.extend(defaultOptions,options)
	var o=this
	
	o.spinner=null;
	o.container=null;
	o.resultOk=null;
	
	o.buttons=null;
	
	if(o.options.container){
		o.container=	o.options.container;	
		o.spinner=$(o.options.loading, o.container).fadeIn();
		o.resultOk=$(o.options.resultOk, o.container).hide();
		$(o.options.resultError, o.container).hide();
		o.buttons=o.options.container.find("button,[type=submit],[type=button]");
		o.buttons.attr("disabled","disabled").css("opacity",0.5);//prevent the user from submitting twice.
	}

	if(o.options.debug==true && window.console) console.warn('DEBUG mode : a fake webmethod is used instead of "'+methodName+'"')
	var actionParameter=(o.options.debug==true) ? "GetLatestAllExchangeRefValues": methodName;
		
	var ajaxOptions={
		type : o.options.type,
		cache: false,		   
		url : wimsURL+"&acr="+acr+"&action="+actionParameter+"&v=2012-12&outputFormat=xml&xslFile=getwebmethodxml.xsl",//"&seeXmlFinish=true",
		data : data,
		complete : function(xhr,textStatus){
		   var code=$(xhr.responseXML).find("Result Code").text();
		   if(o.buttons) o.buttons.removeAttr("disabled").css("opacity",1)//enable the submit buttons
			if(code=="0"){
				if(o.resultOk) o.resultOk.fadeIn("slow");
				o.options.callbackSuccess($(xhr.responseXML));
			}
			else{
				var message=getMessageFromXML(xhr.responseXML)
				o.errorManager(code,message);
			}
			//Hide the loading .gif after the callback is executed.
			if(o.spinner) o.spinner.hide();
		}//complete		
	}

	var delay=(o.options.debug) ? o.options.delay : 0;
	setTimeout(function(){
		$.ajax(ajaxOptions)
	},delay);
	
	this.errorManager=function(errorCode,errorMessage){
	//Method called when a given error has been returned by the WIMS method.
	
		if(window.console) console.log("IMTAjaxXMLRequest object / "+methodName+" web method / error number "+errorCode);
		
		//1. check whether the user has not been disconnected
		if(errorCode==3000){
			showDialogNyroModalDisconnected("You have been disconnected.<br>Please click on OK button to log-in again.","Time-out");
			return true;
		}
		
		//2. launchs a callback function (defined with the parameters)
		var specificErrorCallback=(errorCode && o.options["callbackError"+errorCode]);
		var callbackLaunched=false;
		if(specificErrorCallback){
			callbackLaunched=true;
			specificErrorCallback(errorMessage);
		}
		else{
			if (o.options.callbackError){
				o.options.callbackError(errorCode,errorMessage);
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
			o.options.defaultCallbackError(errorMessage,"Error number "+errorCode+" returned by "+methodName);
		}

	}//errorManger() method
	
	
}//IMTAjaxRequest class	