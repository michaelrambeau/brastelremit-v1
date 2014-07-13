/*
Javascript code for the fields related to the beneficiary : 
- country
- delivery method
- bank
- branch
!!! Caution  this file is used in both website and CRM !!!
Updated to be used wuth Multibroker dynamic forms.
Last update : Michael @Osaka 2013-08-29 11:07 Multibroker first release
*/


var BeneficiaryForm=function(options,data){
            
	var defaultOptions = { 
		isNewRecord: false,
		readOnly: false,
		useValidationPlugin: true,
		useHTMLdefaultText:false,
		form: $("form"),
		selectCountry: $("#selectCountry"),
		selectDeliveryMethod: $("#selectDeliveryMethod"),
		selectBank: $("#selectBank"),
        
        //name fieds. For Philippines 3 fields are displayed.
        inputName: $("input[name=Name]"),
        inputLastName: $("input[name=Lastname]"),
        inputFirstName: $("input[name=Firstname]"),
        inputMiddleName: $("input[name=Middlename]"),
        
		debugMode: false,
		
		//3 fields for the bank branch code...
		selectBankBranch: $("#selectBankBranch"),
		autocompleteBankBranch:$("#autocomplete-bank-branches"),
		branchListComboboxSize:100,
		
		noBranchCountries: ["MY","ID","PH"],
		separateNameFieldsCountries: ["PH"],

        //Hidden fields useds to store data
        //... about the agent / bank
        inputHiddenBrsAgentID: $("input[name=brsAgentID]"),
		inputHiddenBrsFinancialCode: $("input[name=brsFinancialCode]"),
        inputHiddenAgentName: $("input[name=agentName]"),
        inputHiddenAgentCode: $("input[name=agentCode]"),
        inputHiddenBrokerCode: $("input[name=brokerCode]"),
             
        //... about the branch
		inputHiddenBrsBranchID: $("input[name=brsBranchID]"),
		inputHiddenBranchName: $("input[name=agentBranchName]"),
        inputHiddenBranchCode: $("input[name=branchCode]"),//used only in the CRM branch management page.
                
		//callback used  when the object is associated with the calculator
		callbackChangeCountry: null,
		callbackChangeDeliveryMethod:null,		
		callbackChangeBank:null,
		callbackChangeBankBranch:null, // andrew 2012-08-27 added Branch callback
		callbackGetExchangeRate:null, // Multibroker version
        
        //Available deliery methods per country (overwritten)
        deliveryMethods: {
           "BD": ["1","2"] ,
           "ID": ["1"] ,
           "IN": ["1"] 
        },       
        allDeliveryMethodsTemplate: $("#allDeliveryMethods")//a combobox, built by XSL code, that contains all available delivery methods, with their tranaslations
	};
	//data object used to pass initial values (when editing an existing record)
	var defaultData={
		countryCode:"",
		deliveryMethodCode: "",
		brsAgentID:"",
		brsFinancialCode: "",
		branchID:"",
		branchText:""
	};
	var o=this;
	this.options = $.extend(defaultOptions, options);
	this.data = $.extend(defaultData, data);
	
	//Text for the first option displayed in the comboboxes, when the object is included in the home_calculator page.
	this.defaultText={
		deliveryMethod: this.options.selectDeliveryMethod.find("option:first").text(),
		bank: this.options.selectBank.find("option:first").text().split("/"),
		branch:this.options.selectBankBranch.find("option:first").text()
	};
	
	this.banks=[];
	this.getBranches = true;//is the branch list has to be requested when a bank is selected ?
	
	this.cache=[];//local cache used to store ajax results
    
	this.init = function(){
        o.readHiddenFields();
        
        //Init combo-boxes when editing existing document
        o.initLabelBank();
        
        var branches=o.options.selectBankBranch.find("option");
        var hasBranch=(o.data.branchID !="");
        var useAutocomplete = branches.length==1 && branches[0].value=="-1";
        
        var nbBranch=0;
        if (hasBranch) {
            showHideBankField(this.options.selectBankBranch,true);
            if (useAutocomplete) {
                //Enable the autocomplete component
                o.options.selectBankBranch.hide();
                o.initAutocompleteBranches();
            } else {
                o.options.autocompleteBankBranch.hide();
                nbBranch = o.options.selectBankBranch.find("option").length;
            }
        }
        else{
            //Branch for recipient that is currently edited
            showHideBankField(this.options.selectBankBranch,false);     
        }

        //initialize agent list from global variable created in the form
        o.banks=defaultAgents;

        //Hide the branch list if there is only 1 agent
        if(!useAutocomplete && nbBranch==1 && jQuery.inArray(o.data.countryCode,o.options.noBranchCountries)>-1){
            showHideBankField(this.options.selectBankBranch,false);
        }
        
        //Special case : if Door-to-door has been selected, and if there is one result from bank list,
        //we update bank combo-box with this value and we hide the field. 
        if(o.data.deliveryMethodCode == '3' && o.banks.length == 1){
            showHideBankField(o.options.selectBank,false);
        }
    };//init method
        
        this.initRules = function() {
            //Dynamic rules
            o.preprocessingFieldRules=[];
            o.preprocessingFieldRules["phoneValidationMethod"] = function(field){
                o.log('format phome number');
                var x= field.val().replace(/[^0-9]/g, "");
                return x;
            };
            
            if(typeof(rules) != "undefined") jQuery.each(rules,function(index,rule){
               if(!rule.regexp) return;
               o.addDynamicRule(rule.name+"ValidationMethod", rule.regexp ,rule.etextid);        
            });        
        };
        
        this.addDynamicRule=function(ruleMethod,re,etextID){
            //Add a dynamic rule to jQuery validation object
            //o.log("add method",ruleMethod,regularExpression,etextID);
            jQuery.validator.addMethod(ruleMethod, function(source, element) {												
                var preprocess=o.preprocessingFieldRules[ruleMethod];											
                if(preprocess){ source=preprocess($(element));
                    $(element).val(source);
                }
                if(this.optional(element)) return true;
                if($(element).is(":hidden")) return true;

                //var re=new RegExp(regularExpression);
                return (re.test(source));
            }, translate(etextID,"Invalid field, "+ruleMethod)); 			
        };
        

	this.updateCurrencyText=function(countryCode){
	//Display the line containg the currency translation (the translation was updated by the calculator)
		$(".foreign-text").parents("tr").show();
	};
	
	this.updateNameFields=function(isLoading){
		//Called by country onclick event code and at the end of the constructor.
		//For Philippines, 3 separate fields are displayed for Recipient name
		//but data is saved in the field "name", with this format : lastname,firstname,middlename
        if(!o.options.form || o.options.form.length == 0) return false;
		var separateFields=jQuery.inArray(o.data.countryCode,o.options.separateNameFieldsCountries)>-1;
		$(".separate-names").toggle(separateFields);//the 3 fields used for Philippines...
		
		$(".single-name").toggle(!separateFields);//... and the single field "fullname" used for all other countries.
		
		$("#philippines-link-block").toggle(separateFields && o.options.inputLastName.is(":visible"));//link to display a popup about the lastnames to enter for Philippines recipients
		
		if(separateFields && isLoading==true){
			var fullname=o.options.inputName.val();
			var array=fullname.split(",");
			o.options.inputLastName.val(array[0]);
			if(array.length>1) o.options.inputFirstName.val(array[1]);			
			if(array.length>2) o.options.inputMiddleName.val(array[2]);			
		}
        if(o.options.inputName.length > 0) o.options.inputName.val(o.options.inputName.val().replace(/,/g,' '));
	};	
	
    this.onChangeCountry = function () {
		var countryCode=$(this).val();
		//A new element has been selected ? (to avoid launching a request when removing the first blank option from the list)
		if(o.data.countryCode==countryCode) return false;
		o.data.countryCode=countryCode;
		o.data.deliveryMethodCode="";
		
		//Remove the first option (the default ---- )
		if(this.options[0].value=="") this.remove(0); 
		
		o.getDeliveryMethodList(countryCode);
		
		showHideBankField(o.options.selectBank,false);
		showHideBankField(o.options.selectBankBranch,false);
		
		o.updateCurrencyText(countryCode);
		if(o.options.callbackChangeCountry) o.options.callbackChangeCountry(countryCode);
		
		//moved into buildForm method o.updateNameFields();
        if(o.options.form) o.buildForm(defaultFields);
        
        //at last, set the focus on the delivery method combobox.
        o.options.selectDeliveryMethod.focus();
    };
	this.options.selectCountry.change(o.onChangeCountry);
  
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
	};
        
        this.onChangeDeliveryMethod = function () {
        //Delivery method combobox change event
            
            var deliveryMethodCode=$(this).val();
            //A new element has been selected ? (to avoid launching a request when removing the first blank option from the list)
            if(o.data.deliveryMethodCode==deliveryMethodCode) return false;
            
            if(o.form) o.buildForm(defaultFields);        

            o.data.deliveryMethodCode=deliveryMethodCode;

            o.updateHiddenFields();

            o.getAgentsAndFields(deliveryMethodCode);

            showHideBankField(o.options.selectBankBranch,false);
            o.initLabelBank();
            //Remove the first option (the default ---- )
            if(this.options[0].value=="") this.remove(0); 
            if(o.options.callbackChangeDeliveryMethod) o.options.callbackChangeDeliveryMethod(deliveryMethodCode);       
        };
	
	this.options.selectDeliveryMethod.change(this.onChangeDeliveryMethod);
	
    this.onChangeBank = function () {
    //Bank combobox on change event => load the branch list
        var bankId=$(this).val();
        
        var bank=o.getBankById(bankId);
        if(bank){
                o.data.brsAgentID=bank.brsAgentID;
                o.data.brsFinancialCode=bank.brsFinancialCode;
                o.data.agentName=bank.label;
        }

        o.data.branchID="";
        o.data.branchText="";
        o.updateHiddenFields();

        //var hasBranch=(o.data.deliveryMethodCode=="1");
        var selectBranch=o.options.selectBankBranch;

        o.getBranches = o.data.deliveryMethodCode == "1";
        o.getBankBranchList(o.getBranches);

        if(o.getBranches){
        }
        else{
            //Reset combobox value (we cannot simply call beneficiaryForm.options.selectBankBranch.val() because there is not blank value when beneficiary is in edit mode)
            var comboBox=selectBranch.get()[0];
            comboBox.options.length=0;
            comboBox.options[0]=new Option("","");
            showHideBankField(selectBranch,false);
        }
        if(this.options[0].value=="") this.remove(0); 
        if(o.options.callbackChangeBank) o.options.callbackChangeBank(bank);        
    };//onChangeBank method
        
	this.options.selectBank.change(this.onChangeBank);
    
    this.onChangeBranch = function() {
        //Branch combobox on change event
        var brsBranchID= $(this).val();
		o.setBranch(brsBranchID);
    };
    
    this.setBranch = function(brsBranchID){
        //Update data when a bank branch is selected:
        // - from the branch combobox OR 
        // - from the autocomplete component OR
        // - when a bank with only one branch has been selected
        var branch = (typeof(brsBranchID)=="string") ? o.getBranchById(brsBranchID) : brsBranchID;
        if(!branch) throw new Error( "Unable to get the branch from the brsBranchID '" + brsBranchID + "'" );
        o.data.branchID = branch.value;
        o.data.branchText = branch.label;
        if(o.options.callbackChangeBankBranch) o.options.callbackChangeBankBranch(branch); 
        o.updateHiddenFields();
    };
	
	this.options.selectBankBranch.change(this.onChangeBranch);
	
	//Get delivery method list for a given country and update the related combo-box
	this.getDeliveryMethodList=function(countryCode,defaultValue){
        var template = o.options.allDeliveryMethodsTemplate;//the combobox that contains all delivery methods (with their translations)
        if (template.length == 0) throw new Error("All delivery methods template is not included in the page!")
        var codes = o.options.deliveryMethods[countryCode];
        if(!codes) throw new Error("No delivery method for the selected country '"+countryCode+"'");
        var deliveryMethods = jQuery.map(codes, function(element){
            return({
                value: element,
                label: template.find("[value="+element+"]").text()
            });
        });
        updateCombobox(o.options.selectDeliveryMethod , deliveryMethods,defaultValue,true);
        if(o.options.useHTMLdefaultText) o.options.selectDeliveryMethod.find("option:first").text(o.defaultText.deliveryMethod);
	};//object method
	
	this.getAgentsAndFields=function(deliveryMethodCode,defaultValue){
		//Request by ajax a JSON object that contains the HTML code and some information...
		//Created for MULTIBROKER
		var url=wimsURL;
		var params={
			action: "GetAgentAndFieldList",
			xslFile: "get_agent_data_json.xsl",
 			dataType: "json",			
			deliveryType: o.data.deliveryMethodCode,
			countryCode: o.data.countryCode			
		};
		o.log("Get agent and field list (JSON) for the selected delivery method...");
        showLoading();
		$.ajax(url, {
			   data: params,
			   success: function(result){
				   	var json=$.parseJSON(result);
					o.banks=json.agents;
					var showForm = json.showForm=="1";
					o.getBranches = json.getBranches == "1";
					
					o.log(o.banks.length, "available agent(s) ; showForm=", showForm, "getBranches=", o.getBranches);
					
					
					var hideBankField=false;
					if(showForm){
					   //if the webmethod returns "1", it means that:
					   //1. the only agent has to be selected, and the line has to be hidden.
					   //2.the form can be updated.
					   	var bank=o.banks[0];
						
						o.buildForm(json.fields);
						o.data.brsAgentID=bank.brsAgentID;
						o.data.brsFinancialCode=bank.brsFinancialCode;						
                        o.data.agentName=bank.label; 
                        
						
						o.updateHiddenFields();
						hideBankField=true;
						if(o.options.callbackChangeBank) o.options.callbackChangeBank(bank);		
						if(o.options.callbackGetExchangeRate) o.options.callbackGetExchangeRate(json.exchangeRate);
                        if(o.options.callbackGetDestinationData) o.options.callbackGetDestinationData(json.destinationData);
                        o.setExchangeRateData(json.exchangeRate);
					}
					
					updateCombobox(o.options.selectBank , o.banks,"" ,false, {valueKey:"brsAgentID"});
					showHideBankField(o.options.selectBank,! hideBankField);  
                    hideLoading();
                }//success callback
		});//ajax
	};//getAgentsAndFields method
	
	//Get bank branch list for a given bank and update the related combo-box
	this.getBankBranchList=function(getBranches,defaultText){		
		var url=wimsURL;
        showLoading();
		var data={
			action:	"GetAgentBranchAndFieldList",
			brsFinancialCode:	 o.data.brsFinancialCode,//"IN1011",
			brsAgentID: o.data.brsAgentID,
			countryCode:	o.data.countryCode,
			deliveryType:	o.data.deliveryMethodCode,
			startIndex: 1,
			pageSize: o.options.branchListComboboxSize,
			xslFile:	"get_agent_data_json.xsl",
			getBranches: (getBranches == false) ? 0 : 1
		};
		
		var callback=function(json){			
			if(o.options.callbackGetExchangeRate) o.options.callbackGetExchangeRate(json.exchangeRate);
            if(o.options.callbackGetDestinationData) o.options.callbackGetDestinationData(json.destinationData);            
			
			//step 1: build the form
			o.buildForm(json.fields);
            
			//step 2: update the branch field (combobox or text field with autocomplete)			
			if(json.getBranches != "0") o.updateBranchFields(json);
            
            o.setExchangeRateData(json.exchangeRate);
			
			hideLoading();
		};
		
		o.log("Get branch list, form field list and exchange rate for the selected agent",o.data.brsAgentID);
		jQuery.getJSON( url, data, callback);
		
	};//object method
    
    this.setExchangeRateData = function(json){
        //Update data property after Exchange rate data has been fetched (either by ajax when a bank has been selected, ither from a JSON object in the mark-up)
        o.data.brokerCode = json.brokerCode;
        o.data.agentCode = json.agentCode;
        o.data.bankCode = json.bankCode;        
    };
        
    this.updateBranchFields= function (json) {
        //When the branch list has been loaded by ajax, or when an existing recipient is opened, show/hide branch fields
        var branches=json.branches;
        o.branches = branches;
        var total=stringToInteger(json.total);
        var n=o.options.branchListComboboxSize;            
        if(total>n){
                //Display autocomplete component for huge lists
                o.options.selectBankBranch.hide();
                o.initAutocompleteBranches();
        }
        else{
                //Display a standard combobox for small lists
                o.options.autocompleteBankBranch.hide();
                updateCombobox(o.options.selectBankBranch, branches, o.data.branchID, false);
                if(o.options.useHTMLdefaultText) o.options.selectBankBranch.find("option:first").text(o.defaultText.branch);					

                //Code added in November 2011 : if there is only one branch, we select it automatically.
                if(branches.length == 1 && json.showBranches == "0"){
                        var branch = branches[0];
                        o.setBranch(branch.value);
                        o.log("The unique branch is automatically selected",o.data.branchText);
                        showHideBankField(o.options.selectBankBranch,false);
                }
                else{
                        o.options.selectBankBranch.show();
                }
        }            
    };//updateBranchFields mehods
	
	this.initAutocompleteBranches=function(){
		
		var input=o.options.autocompleteBankBranch.val(o.data.branchText);
		showHideBankField(input,true);
		// initialize autocomplete branches if necessary
		if(!this.autoCompleteBranch){
			this.autoCompleteBranch = new IMTAutoComplete(
				input // the field displaying the label/text of the autocomplete search results
				,this.options.inputHiddenBrsBranchID // the field storing the value of the autocomplete search results
				,{ // optional options for the autocomplete
					action: 'GetAgentBranchList' // the method to call when search parameters are entered
					,data: {}
					,ajaxType: 'JSON'
					// name of the parameter to pass with the search term when making the ajax call. It will be placed into the 'data' object
					,nmSearchParam: 'searchPattern' 
					,nmDataPath: 'branches'
					,loadingIndicator: true
					,useValidationPlugin: o.options.useValidationPlugin
					,fnSelect: function(event, ui) {                        
                        var branch={
                            value: ui.item.value,
                            label: ui.item.label
                        };
                        o.setBranch(branch);
						this.o_default.fnSelect.apply(this, [event, ui]); // call the default fnSelect
						return false;
					}				}
			);
		} else {
			// clear the autocomplete cache since the bank selected may be different than the last one
			this.autoCompleteBranch.cacheFlush();
		}
		this.autoCompleteBranch.options.data = {
			action: "GetAgentBranchList",
			brsFinancialCode: o.data.brsFinancialCode,
			brsAgentID: o.data.brsAgentID,
			countryCode: o.data.countryCode,//"IN",
			deliveryType: o.data.deliveryMethodCode,//"1",
			startIndex: 1,
			pageSize: 20,
			xslFile: "get_agent_data_json.xsl"
		}; // data to pass to the ajax request
		input.show();
	};//this.initAutocomplete()
	
	this.buildForm=function(fields){
		//From the JSON objects we got by ajax, update the form.
		o.log("Build the form from field data...");
		jQuery.each(fields,function(index,field){
			var fieldName=field.name;
			var tr=$("tr#row"+fieldName);
			var input=tr.find("[name="+fieldName+"]");
			
			o.buildField(field, tr, input);
			
		});//each
        o.updateNameFields();
	};
	
	this.buildField=function(field,tr,input){
		if(input.length==0) return false;
		
		//step1: check the field status (hidden / optional / required) 
		var status=field.status;
		if(!tr.hasClass("status"+status)){
			var allClasses="status0 status1 status2";//to be improved!
			tr.removeClass(allClasses);
			input.removeClass("required optional");
			tr.addClass("status"+status);
			var fieldClassName="";
			switch(status){
				case "1":
					fieldClassName="optional";
					break;
				case "2":
					fieldClassName="required";					
					break;						
				default:
					break;
			}
			input.addClass(fieldClassName);
		}
		
		//step2: check the field rule
		var nextClassName=(field.ruleName=="") ? "" : field.ruleName+"ValidationMethod";
		var previousClassName=o.getValidationClassName(input);
		if(nextClassName != previousClassName){			
			input.removeClass(previousClassName);
			input.addClass(nextClassName);		
		}			
	};	
	
	o.getValidationClassName=function(input){
		//For a given field, return the class that ends with "ValidationMethod"
		var names=input[0].className;
		var array=names.split(" ");
		var className="";
		jQuery.each(array,function(index,element){
			if(element.indexOf("ValidationMethod") != -1) className = element;
		});
		return className;
	};
	
	this.updateHiddenFields=function(){
		//When a bank or a branch bank has been selected, update the form hidden fields
	
        //Agent fields
		o.options.inputHiddenBrsAgentID.val(o.data.brsAgentID);
		o.options.inputHiddenBrsFinancialCode.val(o.data.brsFinancialCode);
        o.options.inputHiddenAgentName.val(o.data.agentName);										                
        o.options.inputHiddenAgentCode.val(o.data.agentCode);										                
        o.options.inputHiddenBrokerCode.val(o.data.brokerCode);										                
             
        //Branch fields
		o.options.inputHiddenBrsBranchID.val(o.data.branchID);
		o.options.inputHiddenBranchName.val(o.data.branchText);										
		
		o.options.autocompleteBankBranch.val(o.data.branchText);
	};//updateHiddenField method
    
    this.readHiddenFields = function(){
		o.data.brsAgentID = o.options.inputHiddenBrsAgentID.val();
		o.data.brsFinancialCode = o.options.inputHiddenBrsFinancialCode.val();
        o.data.agentName = o.options.inputHiddenAgentName.val();										                
        o.data.agentCode = o.options.inputHiddenAgentCode.val();										                
        o.data.brokerCode = o.options.inputHiddenBrokerCode.val();										                
             
        //Branch fields
		o.data.branchID = o.options.inputHiddenBrsBranchID.val();
		o.data.branchText = o.options.inputHiddenBranchName.val();										
		
		o.data.branchBrsFinancialName = o.options.autocompleteBankBranch.val();        
    };
	
	this.getBankById= function(id){
		//Return a bank object from a BrsAgentID code.
		var bank={};
		for(var i=0;i<o.banks.length;i++){
			bank=o.banks[i];
			if(bank.brsAgentID==id){
				return bank;
			}
		}
		return null;
	};
    
	this.getBranchById= function(id){
		//Return a branch object from a BrsBranchID code.
		for(var i=0;i<o.branches.length;i++){
			if(o.branches[i].value==id){
				branch=o.branches[i];
				return branch;
			}
		}
		return null;		
	};
	
	this.log=function(){
		if(window.console && o.options.debugMode) console.info.apply(console,arguments);
	};
    
    this.querySaveForm = function(){
    //called just before saving data	

        //1. perform some operations to clean "input" data	
        cleanFormData(o.options.form);

        //2. Build the name field that is submitted (only in edit mode)
        if(typeof(isReadonly)!="undefined" && isReadonly==true) return;
        var fullname="";

        if(o.options.inputLastName.is(":visible")){
            //build name field from lastname, middlename and firstname fields for Philippines
            fullname=o.options.inputLastName.val() + "," + o.options.inputFirstName.val();
            if(o.options.inputMiddleName.val()!="") fullname=fullname+"," + o.options.inputMiddleName.val();
            o.options.inputName.val(fullname);
        };	
    };  
    
    this.initRules();
	if(this.options.isNewRecord){
		this.options.selectCountry.val("");
		showHideBankField(this.options.selectDeliveryMethod,false);
		showHideBankField(this.options.selectBank,false);
		showHideBankField(this.options.selectBankBranch,false);
	}
	else{
		 this.init();
	}
	
	$("select[name=TransferReason]").change(updateTransferReasonOther);
	updateTransferReasonOther();
	o.updateNameFields(true);
	
	//A special rule is needed for the field with the autocomplete component.
    //The autocomplete field is "valid" only if a value has been selected
	if(o.options.useValidationPlugin){
		jQuery.validator.addMethod("bankBranchMethod", function(value, element) { 
			return this.optional(element) || $(element).is("hidden") || (value==beneficiaryForm.data.branchText); 
		}, translate("I0001-0073-0018","Enter a bank branch name"));
	}
				
};//Class definition



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
	
	showHideBankField(combo,true);
	
	var comboBox=combo.get()[0];
	
	var defaultOptions={
		labelKey: "label", 
		valueKey:"value"
	};
	var opt = $.extend({}, defaultOptions, opts);

	comboBox.options.length=0;
	var isSelected=!((defaultValue==undefined) || (defaultValue=="") || (defaultValue=="-1"));
	if(!isSelected) comboBox.options[0]=new Option("----","");
	if(data){
		var option=null;
		for(var i=0;i<data.length;i++){
			var label=data[i][opt.labelKey];
			var value=(opt.valueKey=="") ? i : data[i][opt.valueKey];
			if(toBeTranslated) label=translate(label);
			option=new Option(label, value);
			comboBox.options[comboBox.options.length]=option;		
		}
	}
	if(isSelected) combo.val(defaultValue);
}

function showHideBankField(input,show){
//Show or hide a required field 
//Used for bank data fields (bank name, branch and account  number)
	var parentTable=input.parents("table");
    var tr=input.closest("tr");
    var container = parentTable.hasClass("steps") ? input.closest(".js-field-container") : tr;
	if(show){
        container.show();
        tr.removeClass("status0 status1").addClass("status2");
    }
	else{
        container.hide();
        //We need to launch manually a validation to trigger unhighlight event (if validator object exists)
        if(input.parents("form").data("validator")) input.valid();				
	}

}

function isTransferReasonOther(){
//Return true if the user has selected other reason of remittance	
	return $("select[name=TransferReason]").val()=="8";
}

function updateTransferReasonOther(){
	var tr=$("#tr-transferReasonOther");
	tr.toggle(isTransferReasonOther());
}
