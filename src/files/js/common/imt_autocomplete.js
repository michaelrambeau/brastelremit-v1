/*****************************************************************
Description: Allows for easily adding autocomplete functionality to an input
Date created: 2012-10-11
Author: Andrew
Usage:

var autoComp = new IMTAutoComplete(fld_text, fld_value, o_opts);
	
	fld_text: 		the field displaying the label/text of the autocomplete search results
	fld_value:		the field storing the value of the autocomplete search results
	o_opts:			Optional arguments to configure the autocomplete. Options are as follows:
	{
		autoFocus: 		true 					- If set to true the first item will automatically be focused when the menu is shown
		action:			'GetAgentBranchList3' 	- the method to call when search parameters are entered
		minLength:		2						- The minimum number of characters a user must type before a search is performed. 
													Zero is useful for local data with just a few items
		delay:			150						- The delay in milliseconds between when a keystroke occurs and when a search is performed.
		data: 			{} 						- data to pass to the ajax request
		ajaxType:		'XML'					- the type of Ajax call, either 'XML' or 'JSON'
		nmSearchParam:	'searchParameters'		- name of the parameter to pass with the search term when making the ajax call. 
													It will be placed into the 'data' object
		nmDataPath: 	"WIMSUser"				- When ajaxType is 'XML' nmDataPath is the XPath to the node in the XML for the individual 
													items returned from the search . For ajaxType 'JSON' this is the name of the property 
													in the returned object that contains the array of search results
		nmTextTag:		"Name"					- XML tag name for the text field from the returned XML
		nmValueTag:		"UserName"				- XML tag name for the value field from the returned XML
		dataMap: 		{						- maps the label and value fields of the data returned from xml. Other fields can be added so that
							"label": "Name"			they are retrieved as well. If if more than one values are found for the node in XML then an
							,"value": "UserName"	array is returned for that value
						}
		useDefaultValidation: false 			- whether or not to use the built in validation which makes sure the value 
													field filled in. This requires that the form already has validate() called on it
		useValidationPlugin: false 				- Whether or not to validate the input field
		loadingIndicator: true					- This can be either:
													* false (don't use a loading Indicator)
													* true (use one)
													* or pass an element that will serve as the loading indicator
		url: wimsURL							- url for ajax requests
		fnChange: function(event) { }
			called on the 'change' event of the text field. By default it will clear the contents of the text and value field if 
			the text field text does not match the last selected value from the autocomplete drop down
		blur: function(event){ }
			Triggered when the text field loses focus.
		fnFocus: function(event, ui) { return false }
			called from the 'focus' method below in order to cause the scope of the call to be the IMTAutoComplete object
			
		focus: function(event, ui){ return othis.options.fnFocus.apply(othis, arguments) }
			Triggered when focus is moved to an item (not selecting) though only if the event was triggered by a keyboard interaction
			
		fnSelect: function(event, ui) {return false;}
			called from the 'select' method below in order to cause the scope of the call to be the IMTAutoComplete object

		select: function(event, ui){ return othis.options.fnSelect.apply(othis, arguments) }
			function called when an item is selected from the menu of items shown
			ui contains ui.item.label and ui.item.value
			
		fnSource: function( request, response ) {}
			called from the 'source' method below in order to cause the scope of the call to be the IMTAutoComplete object
		
		source: function( request, response ) { return othis.options.fnSource.apply(othis, arguments) }
			Defines the data to use, must be specified. 
			Can be any of the following:
			- Array
			- Function( Object request, Function response( Object data ) )
			- String

		callbackSuccessJson: function(result, status, xhr){	}
			callback for JSON AJAX requests
			
		callbackSuccessXml: function(xml, xhr){}
			callback for XML AJAX requests
			
		showAutoCompleteMenu: function(aResults, xhr){}
			called once the results come back in order to show the menu using the 'response' method
	}
	
Example:
	
	this.autoCompleteSearchByPerson = new IMTAutoComplete(
		this.fldSearchByPerson // the field displaying the label/text of the autocomplete search results
		,this.fldAssign // the field storing the value of the autocomplete search results
		,{ // optional options for the autocomplete
			action: 'SearchForWIMSUsers' // the method to call when search parameters are entered
			,data: {status: 0} // data to pass to the ajax request
			// name of the parameter to pass with the search term when making the ajax call. It will be placed into the 'data' object
			,nmSearchParam: 'searchParameters' 
			,nmDataXpath: "WIMSUser" // XPath to the node in the XML for the individual items returned from the search 
			,dataMap: {
				"label": "Name" // XML tag name for the text field from the returned XML
				,"value": "UserID" // XML tag name for the value field from the returned XML
				,"groups": "UserGroup" // XML tag name to retrieve another piece of data from XML
			}
			//,loadingIndicator: this.elSpinner
			,loadingIndicator: true
		}
	);

*****************************************************************/

// create the class
var IMTAutoComplete = function(fld_text, fld_value, o_opts) {
	//console.log('**NEW IMTAutoComplete**');
	
	// error checking
	if(typeof(fld_text) == 'undefined' || typeof(fld_value) == 'undefined') {
		var s_error = 'IMTAutoComplete error, the first 2 arguments "fld_text" and "fld_value" are required';
		if(window.console && window.console.error) console.error(s_error);
		return { 'error': s_error };
	}
	
	var othis = this;
	
	// startup code
	this.init = function(){
		this.cacheFlush(); // clear/set the cache
		
		var textTag = o_opts.nmTextTag || "Name";
		var valueTag = o_opts.nmValueTag || "UserName";

		this.o_default = {
			autoFocus: true // If set to true the first item will automatically be focused when the menu is shown
			,action: 'GetAgentBranchList3' // the method to call when search parameters are entered
			// The minimum number of characters a user must type before a search is performed. Zero is useful for local data with just a few items
			,minLength:2
			,delay: 150
			,data: {} // data to pass to the ajax request
			,fld_text: $(fld_text) // keep track of the text field for display
			,fld_value: $(fld_value) // and the field to hold the value
			// name of the parameter to pass with the search term when making the ajax call. It will be placed into the 'data' object
			,ajaxType: 'XML' // the type of Ajax call, either 'XML' or 'JSON'
			,nmSearchParam: 'searchParameters' 
			// When ajaxType is 'XML' nmDataPath is the XPath to the node in the XML for the individual items returned from the search 
			// for ajaxType 'JSON' this is the name of the property in the returned object that contains the array of search results
			,nmDataPath: "WIMSUser"
			,nmTextTag: textTag // XML tag name for the text field from the returned XML
			,nmValueTag: valueTag // XML tag name for the value field from the returned XML
			,dataMap: { // map a name to the tag name in the xml returned by the search method
				"label": textTag
				,"value": valueTag
			}
			,useValidationPlugin: false // whether or not to validate the input field
			,useDefaultValidation: false // whether or not to use the built in validation which makes sure the value field is filled
			// this can be either:
			//	- false (don't use a loading Indicator)
			//	- true (use one
			//	or
			//	- Pass an element that will serve as the loading indicator
			,loadingIndicator: false 
			,url: wimsURL // url for ajax requests
			// called on the 'change' event of the text field. By default it will clear the contents of the text and value field if 
			// the text field text does not match the last selected value from the autocomplete drop down
			,fnChange: function(event) {
				//console.log('change');
				// clear the value if user has changed the text to something without selecting a value from the search
				if(this.options.fld_text.val() != this.options.selectedText){
					this.options.fld_text.val('');
					this.options.fld_value.val('');
				}
				//this.options.fld_value.val(''); // clear the selected value
				//return false;
			}
			// called from the 'focus' method below in order to cause the scope of the call to be the IMTAutoComplete object
			,fnFocus: function(event, ui) {
				//console.log('focus');
				//this.options.fld_text.val(ui.item.label); // place the text into the text box
				//this.options.fld_value.val(''); // clear the selected value
				return false;
			}
			// Triggered when focus is moved to an item (not selecting) though only if the event was triggered by a keyboard interaction
			,focus: function(event, ui){ return othis.options.fnFocus.apply(othis, arguments); }
			// called from the 'select' method below in order to cause the scope of the call to be the IMTAutoComplete object
			,fnSelect: function(event, ui) {
				//console.log('in select');
				//console.log(this);
				this.options.fld_text.val(ui.item.label);
				this.options.fld_value.val(ui.item.value);
				this.options.selectedText = ui.item.label; // update selected value
				//console.log(this.options.fld_text, ui.item.label);
				if(this.options.useValidationPlugin) this.options.fld_text.valid();
						
				return false;
			}
			// function called when an item is selected from the menu of items shown
			// ui contains ui.item.label and ui.item.value
			,select: function(event, ui){ return othis.options.fnSelect.apply(othis, arguments); }
			// called from the 'source' method below in order to cause the scope of the call to be the IMTAutoComplete object
			,fnSource: function( request, response ) {
				//console.log('fnSource');
				this.options.fld_value.val(''); // clear the selected value
				var term = request.term;
				var key = term;
				this.options.data[this.options.nmSearchParam] = term;
				//console.log('cache',this.cache);
				if (key in this.cache ) {
					response( this.cache[key] );
					//if(window.console) console.log("Result loaded from the cache for '"+key+"'");
					return;
				}
				this.options['key'] = key;
				this.options['request'] = request;
				this.options['response'] = response;
				if(this.options.loadingIndicator){ 
					//console.log('loadingIndicator fadeIn');
					this.options.loadingIndicator.fadeIn();	
				}
				var cbs; // pointer to callback success method
				var oAutoThis = this; // create closure
				if(this.options.ajaxType == 'XML'){
					cbs = this.options.callbackSuccessXml;
					lastXhr = new IMTAjaxXMLRequest(
						this.options.action,
						this.options.data,
						{
							callbackSuccess: function(xml, xhr){ cbs.apply(oAutoThis, [xml, this, xhr]); }
							,type: 'get'
						}
					);
				} else {
					cbs = this.options.callbackSuccessJson;
					var data = $.extend({ action: this.options.action }, this.options.data);
					lastXhr = $.getJSON( this.options.url, data, function( result, status, xhr ) {
								cbs.apply(oAutoThis, arguments);
							});
				}
                if(this.options.loadingIndicator) this.options.loadingIndicator.fadeOut();//added by Michael to hide the spinner when nothing is found.
			}
			// Defines the data to use, must be specified. 
			// Can be any of the following:
			// 	- Array
			//	- Function( Object request, Function response( Object data ) )
			//	- String
			,source: function( request, response ) { return othis.options.fnSource.apply(othis, arguments); }
			// callback for JSON AJAX requests
			,callbackSuccessJson: function(result, status, xhr){
				//console.log('callbackSuccessJson',this);
				//console.log(arguments);
				//console.log('callbackSuccessJson',arguments);
				var aResults = result[this.options.nmDataPath];
				this.options.showAutoCompleteMenu.apply(this, [aResults, xhr]);
			}
			//callback for XML AJAX requests
			,callbackSuccessXml: function(xml, xhr){
				//console.log('callbackSuccessXml',this);
				//console.log(arguments);
				var autoOpts = this.options;
				//console.log('callbackSuccessXml args',arguments);
				var aResults = xmlToArray(
					xml
					,autoOpts.nmDataPath
					,autoOpts.dataMap
				);
				this.options.showAutoCompleteMenu.apply(this, [aResults, xhr]);
			}
			// called once the results come back in order to show the menu using the 'response' method
			,showAutoCompleteMenu: function(aResults, xhr){
				//console.log('results:',aResults);
				//console.log('xhr:',xhr);
				//console.log('lastXhr:',lastXhr);
				//console.log('this.xhr === lastXhr.xhr:',xhr === lastXhr);
				//console.log('showAutoCompleteMenu:',this);
				var autoOpts = this.options;
				this.cache[autoOpts.key] = aResults;
				if ( xhr === lastXhr ) {
					this.options.response( aResults );
				}
				if(this.options.loadingIndicator){ 
					//console.log('loadingIndicator fadeOut');
					this.options.loadingIndicator.fadeOut(); 
				}
				if(this.options.useValidationPlugin) this.options.fld_text.valid();
			}
		};
		
		this.options = $.extend({}, this.o_default, o_opts); // override the default options with the passed ones
				
		// if we are to use a loadingIndicator then use the one passed or create one
		if(this.options.loadingIndicator){
			// if no element was passed then create one
			if(this.options.loadingIndicator == true){
				this.options.fld_text.wrap('<div class="autocomplete-wrapper"></div>');
				this.options.loadingIndicator = $('<div class="ajax-spinner autocomplete-loading" />');
				//Set the container width equal to the input field, in order to use right:0px for spinner position.
				//var w=this.options.fld_text.css("width");
				//console.log(this.options.fld_text);
				//console.log('box width:',w);
				//console.log('box width (parseInt):',parseInt(w));
				/* setTimeout(function(){
					var el = $('#searchByPerson'); 
					console.log('border width again:',el.css("width"));
					el.focus();
				}, 2000); */
				//this.options.fld_text.parent().css("width",w);
				//this.options.fld_text.parent().css("width",w+0);
				this.options.loadingIndicator.insertBefore(this.options.fld_text);
			} else { // use the existing element
				this.options.loadingIndicator = $(this.options.loadingIndicator);
			}
			//console.log(this.options.loadingIndicator);
		}
		
		this.options.selectedText = this.options.fld_text.val(); // keep track of the currently selected text
		
		//The autocomplete field is valid if a value has been selected
		if(this.options.useValidationPlugin && this.options.useDefaultValidation){
			if(typeof(autoCompleteMap)=='undefined') // build global map to keep track of fields
				autoCompleteMap = {};
				
			var key = this.options.fld_text.attr('id') || this.options.fld_text.attr('name');
			autoCompleteMap[key] = this; // map the field to the autocomplete component
			/*this.options.fld_value.parents('form').validate({
				errorClass:"field-validation-error"
				,highlight: fnHighlightNextCell
				,unhighlight: fnUnhighlightNextCell
			});*/
			if(!$.validator.methods['autoCompleteValidation']){
				$.validator.addMethod("autoCompleteValidation", function(value, element) { 
					var key = $(element).attr('id') || $(element).attr('name');
					//console.log('this',this,'value',$(element).val(),'selectedText',autoCompleteMap[key].options.selectedText);
					//console.log(element);
					return this.optional(element) || $(element).is("hidden") || (autoCompleteMap[key].options.fld_value.val()!='' && $(element).val()==autoCompleteMap[key].options.selectedText); 
				}, "Invalid!!");
			}
			// if there is validation on the form then add this rule to the field
			if(this.options.fld_value.closest('form').data('validator')){
				this.options.fld_text.rules("add", "autoCompleteValidation");
			} else if(window.console && window.console.warn){
				console.warn("'useValidationPlugin' and 'useDefaultValidation' attributes were set to true for the IMTAutocomplete component but validate() was NOT called on the form containing the field:", this.options.fld_text);
			}
			$.validator.messages.autoCompleteValidation = "";
		}
		
		// add change event
		this.options.fld_text.change(function(event){ othis.options.fnChange.apply(othis, arguments); } );
		//this.options.fld_text.change(function(event){ console.log('change'); } );
		
		// Now let's rock and roll with the autocomplete
		this.options.fld_text.autocomplete(this.options);
	}; // end init
	
	// clear cache
	this.cacheFlush = function(){
		this.cache = {};
	};
	
	// create the object
	this.init(); 
	
}; // end IMTAutoComplete class