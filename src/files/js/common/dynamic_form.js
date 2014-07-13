var beneficiaryForm=null;
$(document).ready(function(){
	jQuery.each(rules,function(index,rule){
		if(rule.regexp.length==0) return;							   
		addDynamicRule(rule.name+"ValidationMethod", rule.regexp ,rule.etextid);
	});
	
	$("form").validate({
		debug:true,
		
		errorPlacement: function(error, element) {//the position of the label that contains the error msg ("invalid email format" for example)
			if(element.is("[name=depositType]")){
				var container=element.parents(".deposit-type-container");
				error.appendTo(container.find(".deposit-type-error"));
				return;
			}
			if(element.is("[name=assignMethod]")){//assignMethod radio button used in the CRM
				var container=element.parents(".radio-button-container");
				error.insertAfter(container);
				return;
			}
			if(element.is("[name=confirm]")) return;//label created for confirmation checkbox
			error.insertAfter(element);//by default the error msg is displayed just after the field itself
		}, 
			
		hightlight: fnHighlightNextCell,
		
		unhighlight: fnUnhighlightNextCell	
	});//validate()	
	
	beneficiaryForm=new BeneficiaryForm({},data);
	
})//ready()

function addDynamicRule(ruleMethod,regularExpression,etextID){
	console.log("add method",ruleMethod,regularExpression,etextID)
	
	jQuery.validator.addMethod(ruleMethod, function(source, element) {
													
		var preprocess=preprocessingFieldRules[ruleMethod];											
		if(preprocess) source=preprocess($(element));
		if(this.optional(element)) return true;
		
		var re=new RegExp(regularExpression);
		if(!re.test(source)) console.log(source,regularExpression);
		return (re.test(source));
	}, translate(etextID,"Invalid field!")); 			
}

var preprocessingFieldRules=[];
preprocessingFieldRules["phoneValidationMethod"] = function(field){
	var x= field.val().replace(/[^0-9]/g, "");
	//field.val(x); 
	return x;
}


function getFormHtml(){
//For a given country and delivery methods, launch an ajax request to get the html page.
	var url=wimsURL+"&acr=4&xslFile=test_dynamic_fields.xsl&xmlPreview=fields.xml&action=RemittanceRequestForm";
	var settings={
		success: function(data,textStatus,jqXhr){
			var html=jqXhr.responseText;
			var currentForm=$("form");
			var ajaxForm=$(html).find("form");			
			var data=currentForm.serializeArray();
			
			ajaxForm.find(".dynamic-form-table").each(function(index,element){
				var currentTable=$(".dynamic-form-table:eq("+index+")");
				currentTable.empty();
				currentTable.append($(element).contents());
			});
			updateForm(currentForm,data);
		}
	}
	$.ajax(url,settings) 

}

function updateForm(form,data){
	console.log(data);
	jQuery.each(data,function(index,element){
		var fieldName=element.name;
		var fieldValue=element.value;
		var field=form.find("[name="+fieldName+"]");
		console.log(fieldName,fieldValue,field);
		field.val(fieldValue);
	});
}

var BeneficiaryForm=function(options,data){
	
	var defaultOptions = { 
		isNewRecord: false,
		readOnly: false,
		useValidationPlugin: true,
		useHTMLdefaultText:false,
		selectCountry: $("#selectCountry"),
		selectDeliveryMethod: $("#selectDeliveryMethod"),
		selectBank: $("#selectBank"),
		
		//3 fields for the bank branch code...
		selectBankBranch: $("#selectBankBranch"),
		autocompleteBankBranch:$("#autocomplete-bank-branches"),
		inputHiddenBankBranch: $("input[name=bankBranchCode]"),//stored value
		branchListComboboxSize:100,
		
		inputBankAccountNumber: $("input[name=bankAccountNumber]"),
		noBranchCountries: ["MY","ID","PH"],
		separateNameFieldsCountries: ["PH"],
				
		//callback used  when the object is associated with the calculator
		callbackChangeCountry: null,
		callbackChangeDeliveryMethod:null,		
		callbackChangeBank:null,
		callbackChangeBankBranch:null // andrew 2012-08-27 added Branch callback
	}
	//data object used to pass initial values (when editing an existing record)
	var defaultData={
		id : "",
		countryCode:"",
		deliveryMethodCode: "",
		bankCode:"",
		bankBranchCode:"",
		agentBranchName:"",
	}
	var o=this;
	this.options = $.extend(defaultOptions, options);
	this.data = $.extend(defaultData, data);
	
	//Text for the first option displayed in the comboboxes, when the object is included in the home_calculator page.
	this.defaultText={
		deliveryMethod: this.options.selectDeliveryMethod.find("option:first").text(),
		bank: this.options.selectBank.find("option:first").text().split("/"),
		branch:this.options.selectBankBranch.find("option:first").text()
	}
	
	//this.mapBanks=[];
	this.banks=[];
	
	this.cache=[];//local cache used to store ajax results
	
	this.init=function(){
		//Init combo-boxes when editing existing document
		if(!o.options.readOnly){
			this.getDeliveryMethodList(this.data.countryCode,this.data.deliveryMethodCode);
			//disabled mike MUltibroker this.getBankList(this.data.deliveryMethodCode,this.data.bankCode);
				
			var hasBranch=(this.data.bankBranchCode!="");
			
			if (hasBranch){
				this.getBankBranchList(this.data.bankCode,this.data.bankBranchCode);
			}
			else{
				//when there is no branch for the current bank => hide the branch field
				showHideBankField(this.options.selectBankBranch,false);
			}
		}
		
		o.initBankAccountNumber();
		o.initLabelBank();
		
	if(o.options.readOnly){
		if(o.data.bankBranchCode=="") showHideBankField(o.options.selectBankBranch,false);
	}
		
	}
	
	this.updateCurrencyText=function(countryCode){
	//Display the line containg the currency translation (the translation was updated by the calculator)
		$(".foreign-text").parents("tr").show();
	}
	
	this.updateNameFields=function(isLoading){
		//Called by country onclick event code and at the end of the constructor.
		//For Philippines, 3 separate fields are displayed for Recipient name
		//but data is saved in the field "name", with this format : lastname,firstname,middlename
		var separateFields=jQuery.inArray(o.data.countryCode,o.options.separateNameFieldsCountries)>-1;
		$(".separate-names").toggle(separateFields);//the 3 fields used for Philippines...
		
		$(".single-name").toggle(!separateFields);//... and the single field "fullname" used for all other countries.
		
		$("#philippines-link-block").toggle(separateFields);//link to display a popup about the lastnames to enter for Philippines recipients
		
		
		if(separateFields && isLoading==true){
			var fullname=$("input[name=name]").val();
			var array=fullname.split(",");
			$("input#lastname").val(array[0]);
			if(array.length>1) $("input#firstname").val(array[1]);			
			if(array.length>2) $("input#middlename").val(array[2]);			
			$("#fullname").val("");
		}
	}	
	
	this.options.selectCountry.change(function(){
	   
		var countryCode=$(this).val();
		//A new element has been selected ? (to avoid launching a request when removing the first blank option from the list)
		if(o.data.countryCode==countryCode) return false;
		o.data.countryCode=countryCode;
		o.data.deliveryMethodCode="";
		o.data.bankCode="";
		
		//Remove the first option (the default ---- )
		if(this.options[0].value=="") this.remove(0); 
		
		o.getDeliveryMethodList(countryCode);
		o.options.selectDeliveryMethod.addClass("required");
		
		showHideBankField(o.options.selectBank,false)
		showHideBankField(o.options.selectBankBranch,false)
		showHideBankField(o.options.inputBankAccountNumber,false)
		
		o.updateCurrencyText(countryCode);
		if(o.options.callbackChangeCountry) o.options.callbackChangeCountry(countryCode);
		
		o.updateNameFields();
				
		
	});//change event
	
	this.initBankAccountNumber=function(){
		//Show bankAccountNumber field if  "Bank Transfer" (1) is selected, hide otherwise (for "Door-to-door" and "Agent office")
		if(o.data.deliveryMethodCode=="1"){
			showHideBankField(o.options.inputBankAccountNumber,true)
		}
		else{
			showHideBankField(o.options.inputBankAccountNumber,false)
			o.options.inputBankAccountNumber.val("");
		}	
	}
	
	this.initLabelBank=function(){
		//Depending on the selected delivery method  show the apropriate label for the "brankCode" field.
		$("#label-bank-name,#label-agent-name,#label-delivery-area").hide();
		switch(o.data.deliveryMethodCode){
			case "2":
				//Agent collect point
				$("#label-agent-name").show();
				break;
			case "3":
				//home delivery
				$("#label-delivery-area").show();
				break;
			default:
				$("#label-bank-name").show();			
				break;
		}
	}
	
	this.options.selectDeliveryMethod.change(function(){
		var deliveryMethodCode=$(this).val();
		//A new element has been selected ? (to avoid launching a request when removing the first blank option from the list)
		if(o.data.deliveryMethodCode==deliveryMethodCode) return false;
		
		disableField(o.options.selectBank);//disable the bank combobox while data are loading
		
		o.data.deliveryMethodCode=deliveryMethodCode;
		
		o.data.bankCode="";
		o.data.bankBranchCode="";
		o.data.agentCode="";
		o.data.agentSubCode="";
		o.data.brokerCode="";
		o.data.agentName="";
		o.data.agentBranchName="";
		o.data.bankIndex=""
		o.data.id="" // andrew 2012-08-28
		
		o.updateHiddenFields();
				
		o.getBankList(deliveryMethodCode);
		o.options.selectBank.addClass("required");
		showHideBankField(o.options.selectBankBranch,false);
		o.initBankAccountNumber();
		o.initLabelBank();
		//Remove the first option (the default ---- )
		if(this.options[0].value=="") this.remove(0); 
		if(o.options.callbackChangeDeliveryMethod) o.options.callbackChangeDeliveryMethod(deliveryMethodCode);
	});
	
	
	this.options.selectBank.change(function(){

		var bankIndex=$(this).val();
		//A new element has been selected ? (to avoid launching a request when removing the first blank option from the list)
		if(o.data.bankIndex==bankIndex) return false;
		
		disableField(o.options.selectBankBranch);//disable the branch bank combobox while data is loading
		disableField(o.options.autocompleteBankBranch);
		
		o.data.bankIndex=bankIndex;
		
		var bank=o.banks[bankIndex];
		if(bank){
			o.data.bankCode=bank.bankCode;
			o.data.agentName=bank.agentName;
			o.data.brokerCode=bank.brokerCode;
			o.data.agentCode=bank.agentCode;
			o.data.agentSubCode=bank.agentSubCode;
			
			o.data.id=bank.id; // andrew 2012-08-28
		}
		
		o.data.bankBranchCode="";
		o.data.agentBranchName="";
		o.updateHiddenFields();
		
		var hasBranch=(bank.subLevelRequired=="True");
		var selectBranch=o.options.selectBankBranch
		if(hasBranch){
			o.getBankBranchList(o.data.bankCode);
		}
		else{
			//Reset combobox value (we cannot simply call beneficiaryForm.options.selectBankBranch.val() because there is not blank value when beneficiary is in edit mode)
			var comboBox=selectBranch.get()[0];
			comboBox.options.length=0;
			comboBox.options[0]=new Option("","");
			showHideBankField(selectBranch,false)
		}
		//Remove the first option (the default ---- )
		if(this.options[0].value=="") this.remove(0); 
		if(o.options.callbackChangeBank) o.options.callbackChangeBank(bank);
	});
	
	this.options.selectBankBranch.change(function(){
  		//Remove the first option (the default ---- )
		//console.log('selectBankBranch');
		if(this.options[0].value=="") this.remove(0); 
		o.data.bankBranchCode=$(this).val();
		var text=$(this).children(":selected").text();
		o.data.agentBranchName=text;
		// andrew 2012-08-27 get the id if it was passed
		var selOpt = $.inArray($(this).children(":selected")[0], $(this).children());
		//console.log("selOpt:"+selOpt);
		var branch = o.branches[selOpt];
		//console.log(branch);
		if(branch.id)
			o.data.id=branch.id;
		o.updateHiddenFields();
		// andrew 2012-08-27 call the new branch callback
		if(o.options.callbackChangeBankBranch) o.options.callbackChangeBankBranch();
	});
	
	//Get delivery method list for a given country and update the related combo-box
	this.getDeliveryMethodList=function(countryCode,defaultValue){
		new IMTAjaxXMLRequest(
			"GetDeliveryTypeList",
			{countryCode: countryCode},
			{
				callbackSuccess:function(xml){
					var deliveryMethods=xmlToArray(
						xml, 
						"DeliveryTypeList DeliveryType", 
						{
							value:"DeliveryTypeID",
							label:"e-text"
						}	
					);
					updateCombobox(o.options.selectDeliveryMethod , deliveryMethods,defaultValue,true);
					if(o.options.useHTMLdefaultText) o.options.selectDeliveryMethod.find("option:first").text(o.defaultText.deliveryMethod);
					o.options.selectDeliveryMethod.focus();
					//$("#row-select-country .ajax-spinner").fadeOut();
				},//callbackSuccess,
				container:$("#row-select-country"),//contains the loading .gif
				type: 'get'
			}
		);//IMTAjaxXMLRequest object used in IMT application
	}//object method
	
	//Get bank list for a given delivery method (and for the current country)  and update the related combo-box
	this.getBankList=function(deliveryMethodCode,defaultValue){		
		new IMTAjaxXMLRequest(
			"GetAgentList",
			{deliveryType:deliveryMethodCode, countryCode: o.data.countryCode},
			{
				callbackSuccess:function(xml){
					//o.banks=xmlToArrayBank(xml,"AgentList Agent");
					o.banks = xmlToArray(xml,"AgentList Agent", {
						"bankCode": "BankCode",
						"agentCode": "AgentCode",
						"agentSubCode": "AgentSubCode",
						"brokerCode": "BrokerCode",
						"agentName": "BankName",
						"id": "id", // andrew 2012-08-28
						"subLevelRequired": "BranchRequired"
					});
	
					var hideBankField=false;
					
					/*
					Special case : if Door-to-door has been selected, and if there is one result from bank list,
					we update bank combo-box with this value and we hide the field.
					*/
					if(deliveryMethodCode=="3" && o.banks.length==1){
						var bank=o.banks[0]
					
						o.data.bankCode=bank.bankCode;
						o.data.agentName=bank.agentName;
						o.data.agentCode=bank.agentCode;
						o.data.agentSubCode=bank.agentSubCode;
						o.data.brokerCode=bank.brokerCode;
						o.data.id=bank.id; // andrew 2012-08-28
						o.updateHiddenFields();
						hideBankField=true;
						if(o.options.callbackChangeBank) o.options.callbackChangeBank(bank);
					}
					
					var index=o.getBankIndex().toString();
					updateCombobox(o.options.selectBank , o.banks,index,false, {labelKey:"agentName", valueKey:"index"});
					if(o.options.useHTMLdefaultText) o.options.selectBank.find("option:first").text(o.defaultText.bank[deliveryMethodCode-1]);					
					showHideBankField(o.options.selectBank,! hideBankField);
					if(!hideBankField) o.options.selectBank.focus();
				},//callbackSuccess,
				container:$("#row-select-delivery"),//contains the loading .gif
				type: 'get'
			}
		);//IMTAjaxXMLRequest object used in IMT application		
		
	}//object method
	
	//Get bank branch list for a given bank and update the related combo-box
	this.getBankBranchList=function(bankCode,defaultValue,defaultText){		
		var n=o.options.branchListComboboxSize;
		var spinner=$("#row-select-bank").find(".ajax-spinner");
		spinner.fadeIn();
		var url=wimsURL;
		var data={
			action:	"GetAgentBranchList3",
			bankCode:	 bankCode,//"IN1011",
			agentCode:	 o.data.agentCode,
			agentSubCode:	 o.data.agentSubCode,		
			brokerCode:	 o.data.brokerCode,				
			countryCode:	o.data.countryCode,//"IN",
			deliveryType:	o.data.deliveryMethodCode,//"1",
			startIndex: 1,
			pageSize: n,
			xslFile:	"get_bank_branches_json.xsl"
		};
		var callback=function(result){
			var branches=result.branches;
			var total=stringToInteger(result.total);
			//if(window.console) console.log(total+" branches");

			if(total>n){
				//Display autocomplete component for huge lists
				o.options.selectBankBranch.hide().removeClass("required");
				o.initAutocompleteBranches(defaultText);
				if(o.options.useValidationPlugin) o.options.autocompleteBankBranch.rules("add", "bankBranchMethod");
			}
			else{
				//Display a standard combobox for small lists
				o.options.autocompleteBankBranch.hide().removeClass("required");
				updateCombobox(o.options.selectBankBranch,branches,o.data.bankBranchCode,false);
				if(o.options.useHTMLdefaultText) o.options.selectBankBranch.find("option:first").text(o.defaultText.branch);					
				
				if(o.options.useValidationPlugin) o.options.autocompleteBankBranch.rules("remove", "bankBranchMethod");
				//Code added in November 2011 : if there is only one branch, we select it automatically for 3 countries
				if(branches.length==1 && jQuery.inArray(o.data.countryCode,o.options.noBranchCountries)>-1){
					o.data.bankBranchCode=branches[0].value;
					o.data.agentBranchName=branches[0].label;
					o.updateHiddenFields();
					showHideBankField(o.options.selectBankBranch,false);
					// andrew 2012-08-27 track the id as well as call the new branch callback
					if(branches[0].id) o.data.id=branches[0].id;
					if(o.options.callbackChangeBankBranch) o.options.callbackChangeBankBranch();
				}
				else{
					o.branches = branches; // andrew 2012-08-27 keep the branches to be able to get the id of a branch later
					o.options.selectBankBranch.show();
				}
			}
			spinner.hide();
		};
		
		jQuery.getJSON( url, data, callback)
		
	}//object method
	
	this.initAutocompleteBranches=function(){
		
		var input=o.options.autocompleteBankBranch.val(o.data.agentBranchName);
		//var spinner=input.parents("tr").find(".ajax-spinner");
		showHideBankField(input,true);
		// initialize autocomplete branches if necessary
		if(!this.autoCompleteBranch){
			this.autoCompleteBranch = new IMTAutoComplete(
				input // the field displaying the label/text of the autocomplete search results
				,this.options.inputHiddenBankBranch // the field storing the value of the autocomplete search results
				,{ // optional options for the autocomplete
					action: 'GetAgentBranchList3' // the method to call when search parameters are entered
					,data: {}
					,ajaxType: 'JSON'
					// name of the parameter to pass with the search term when making the ajax call. It will be placed into the 'data' object
					,nmSearchParam: 'searchPattern' 
					,nmDataPath: 'branches'
					//,loadingIndicator: spinner
					,loadingIndicator: true
					,useValidationPlugin: o.options.useValidationPlugin
					,fnSelect: function(event, ui) {
						o.data.bankBranchCode=ui.item.value;
						o.data.agentBranchName=ui.item.label;
						if(ui.item.id) o.data.id=ui.item.id; // andrew 2012-08-28
						o.updateHiddenFields();
						//console.log('this:',this);
						this.o_default.fnSelect.apply(this, [event, ui]); // call the default fnSelect
						// andrew 2012-08-27 call the new branch callback
						if(o.options.callbackChangeBankBranch) o.options.callbackChangeBankBranch();

						return false;
					}
				}
			);
		}
		this.autoCompleteBranch.options.data = {
			action: "GetAgentBranchList3",
			bankCode: o.data.bankCode,//"IN1011",
			agentCode: o.data.agentCode,
			agentSubCode: o.data.agentSubCode,		
			brokerCode: o.data.brokerCode,	
			countryCode: o.data.countryCode,//"IN",
			deliveryType: o.data.deliveryMethodCode,//"1",
			startIndex: 1,

			pageSize: 20,
			xslFile: "get_bank_branches_json.xsl"
		}; // data to pass to the ajax request
		input.addClass("required").show();
		enableField(input);
		
	}//this.initAutocomplete()
	
	this.updateHiddenFields=function(){
		//	When a bank or a branch bank has been selected, update the form hidden fields
	
		$("input[name=bankCode]").val(o.data.bankCode);
		$("input[name=brokerCode]").val(o.data.brokerCode);
		$("input[name=agentCode]").val(o.data.agentCode);
		$("input[name=agentName]").val(o.data.agentName);
		$("input[name=agentSubCode]").val(o.data.agentSubCode);
		$("input[name=agentBranchName]").val(o.data.agentBranchName);
		
		var branch=o.data.bankBranchCode;
		o.options.inputHiddenBankBranch.val(branch);
		
		o.options.autocompleteBankBranch.val(o.data.agentBranchName);
	}//updateHiddenField method
	
	this.getBankIndex=function(){
		//Return the selected bank index (used to select the default option in the bank/agent combobox)
		var bank={};
		for(var i=0;i<o.banks.length;i++){
			bank=o.banks[i];
			//Updated by Michael in 2012-11 : the key for banks is bankCode + agentCode
			//but for "agents", the key is agentSubCode + agentCode.
			if(bank.bankCode==o.data.bankCode && bank.agentSubCode==o.data.agentSubCode && bank.agentCode==o.data.agentCode){
				return i;
			}
		}
		return -1;
	}

	

	if(this.options.isNewRecord){
		this.options.selectCountry.val("");
		showHideBankField(this.options.selectDeliveryMethod,false);
		showHideBankField(this.options.selectBank,false);
		showHideBankField(this.options.selectBankBranch,false);
		showHideBankField(this.options.inputBankAccountNumber,false);
	}
	else{
		 this.init();
	}
	
	$("select[name=TransferReason]").change(updateTransferReasonOther);
	updateTransferReasonOther();
	o.updateNameFields(true);
	
	//The autocomplete field is valid if a value has been selected
	if(o.options.useValidationPlugin){
		jQuery.validator.addMethod("bankBranchMethod", function(value, element) { 
			return this.optional(element) || $(element).is("hidden") || (value==beneficiaryForm.data.agentBranchName); 
		}, translate("I0001-0073-0018","Invalid bank branch name"));
	}
				
}//Class definition



/* 

Functions used by BeneficiaryForm object

*/


function getTranslatedText(eTextId,xml){
	var x=xml.find(eTextId);
	return x.text();
}



function updateCombobox(combo,data,defaultValue,toBeTranslated, opts){
/*
Update a given combobox with given data, and selects a default value (if provided)
Parameters :
- combo : jQuery combo-box object
- data : array of objects with text and value properties
- defaultValue : value to be selected
- hide : optional boolean : true if combobox has to be hidden
- opts : optional object with the following options: 
			{
				labelKey: The key in each object of data to use as the label, defaults to 'label'
				valueKey: The key in each object of data to use as the value, defaults to 'value'
			}
*/
	
	showHideBankField(combo,true)
	
	var comboBox=combo.get()[0];

	var opt = $.extend({}, {labelKey: "label", valueKey:"value"}, opts);

	comboBox.options.length=0;
	var isSelected=!((defaultValue==undefined) || (defaultValue=="") || (defaultValue=="-1"));
	if(!isSelected) comboBox.options[0]=new Option("----","");
	if(data){
		var option=null;
		for(var i=0;i<data.length;i++){
			label=data[i][opt.labelKey];
			if(toBeTranslated) label=translate(label);
			option=new Option(label,data[i][opt.valueKey]);
			comboBox.options[comboBox.options.length]=option;		
		}
	}
	if(isSelected) combo.val(defaultValue);
	enableField(combo);
}

function showHideBankField(input,show){
//Show or hide a required field 
//Used for bank data fields (bank name, branch and account  number)
	var parentTable=input.parents("table");
	if(show){
		input.addClass("required");
		if(parentTable.hasClass("steps")) {
			input.parent("div").show();
		}
		else{
			input.parents("tr").show();			
		}
	}
	else{
		input.removeClass("required");
		if(parentTable.hasClass("steps")){
			input.parent("div").hide();
		}
		else{
			input.parents("tr").hide();
			//We need to launch manually a validation to trigger unhighlight event (if validator object exists)
			if(input.parents("form").data("validator")) input.valid();				
		}
	}

}
function querySaveForm(form){
//called just before saving data	
	
	//1. perform some operations to clean "input" data	
	cleanFormData(form);
	
	
	//2. Build the name field that is submitted (only in edit mode)
	if(typeof(isReadonly)!="undefined" && isReadonly==true) return;
	var $lastname=$("#lastname");
	var $middlename=$("#middlename");
	var fullname="";
	
	if($lastname.is(":visible")){
		//build name field from lastname, middlename and firstname fields for Philippines
		fullname=$lastname.val()+","+$("#firstname").val();
		if($middlename.val()!="") fullname=fullname+","+$middlename.val();
	}
	else{
		fullname=$("#fullname").val();
	}
	//Update the hidden field used to submit data.
	$("input[name=name]").val(fullname);
}

function disableField(field){
	//disable the given field (combobox or input type text) while data is loading.
	field.attr("disabled","disabled").css("opacity",0.5);
}
function enableField(field){
	//Enable the given field (combobox or input type text) after the ajax request
	field.removeAttr("disabled style");
}

function isTransferReasonOther(){
//Return true if the user has selected other reason of remittance	
	return $("select[name=transferReason]").val()=="8";
}

function updateTransferReasonOther(){
	var tr=$("#tr-transferReasonOther");
	tr.toggle(isTransferReasonOther());
}
