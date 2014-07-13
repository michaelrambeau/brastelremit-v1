/*
JS code used in both web site and CRM by :
- customer_remittance_request_form.xsl
- crm_virtual_accounts_request.xsl
Last update : Michael @Osaka 2013-08-15 Multibroker first release
*/

var calculator;//global variable added on 2012-12-13
var customerID="";
var isCRM=false;

$(document).ready(function(){
						   
	customerID=$("input#accountID").val();//hidden field in the CRM					   
	isCRM=(customerID!=undefined) && (customerID!="") ;					   
	
	$("form[action=]").submit(function(event){
		event.preventDefault();//to avoid form submission if there is a javascript error.
	});
	$("input[type=radio]:checked").removeAttr("checked");//to remove the default value stored by the browser cache.
	
    var calculatorBlocks=$(".calculator-hidden-by-default");
	beneficiaryForm=new BeneficiaryForm(
		{
            isNewRecord: isNewBeneficiary,
            readOnly: isReadonly,
            form: $("#form1"),
            deliveryMethods : pageData.deliveryMethods,

            callbackChangeCountry:function(countryCode){
                calculator.setCountryCode((countryCode)); // set the current country
                calculatorBlocks.hide();
            },

            callbackChangeDeliveryMethod:function(deliveryMethodCode){
                calculatorBlocks.hide();
            },

            callbackChangeBank:function(bank){
                calculatorBlocks.show();						
            },

//            callbackGetExchangeRate: function(rateObject){
//                if(window.console) console.log("Update exchange rate",rateObject);
//                calculator.setExchangeRate(rateObject);
//                if (remittanceType=="2") calculator.calculate();//trigger a calculation with the new rate
//            }
            callbackGetDestinationData: function(destinationData){
                if(window.console) console.log("Update destination data",destinationData);
                calculator.setDestinationData(destinationData);
                if (remittanceType=="2") calculator.calculate();
            }            
			
		},
		data
	);
	if(isNewBeneficiary){
		$("#transfer-amount-block").parent(".content").hide();//calculator is displayed when user selects a country
	}
	
	jQuery.validator.messages.required = "";
	jQuery.validator.messages.depositType="Please select a deposit type";
	
    initCalculator();
	
	$("#form1").validate({
		errorClass:"field-validation-error",
		rules:{
			transferReasonOther: {
				required: isTransferReasonOther
			},
 			assignMethod:{
				required: function(){
					return(getDepositType()=="JPB");
				}
			},
			assignCardNo:{
				required: function(element) { //required if the user selects "assign an existing card"
					return getDepositType()=="JPB" && ! isNewCard();
				}
			} 
		},
		submitHandler: function(form){
			submitFormStep1($(form));
		},
		messages:{
			depositType:{
				required:  translate("I0001-0073-0021","Please select a deposit source.")
			}
		},
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
			if(element.is("[name=confirm]")) return;//fno label created for confirmation checkbox
 			error.insertAfter(element);//by default the error msg is displayed just after the field itself
    },
		
		highlight: function(element, errorClass, validClass) {
			 //1. Highlight input or select element it self
			 var field=$(element);
			 var x=field;
			 if (field.is(":radio") || field.is(":checkbox") || field.is("input[type=password]")) x=field.parent();
			 if(field.is("[name=depositType]")){
				 return;
				 x=field.parents(".deposit-type");
			 }
			 x.addClass(errorClass).removeClass(validClass);
			 
			 //2. Hightlight table next cell
			 $(element).parents("td").next().addClass(errorClass).removeClass(validClass); 
		},
		unhighlight: function(element, errorClass, validClass) {
			 var field=$(element);
			 var x=field;
			 if (field.is(":radio") || field.is(":checkbox") || field.is("input[type=password]")) x=field.parent();
			 if(field.is("[name=depositType]")){
				 return;
				 x=field.parents(".deposit-type");
			 }
			x.removeClass(errorClass).addClass(validClass);
			
			//2. Hightlight table next cell
			 $(element).parents("td").next().removeClass(errorClass).addClass(validClass); 
		}
 	});//.validate()		

	
	$("#form2").validate({						   
		submitHandler: function(form){
			submitFormStep2($(form));
		}				 
 	});//.validate()


	/* Confirmation block buttons  */

	// Back to the form
	$("#button-confirm-back").click(function(){
		$("#form-confirmation").fadeOut("fast");
		$("#form-step1").fadeIn("slow");
		$(document).scrollTop(0);
	 });
	

	
	 //Toolltip added on 2012-07-20
	if ($.tooltip) $(".tooltip-container").tooltip({
		delay: 200,
		extraClass: "ui-shadow",
		bodyHandler: function() {
		return $(this).find(".tooltip-content").html();
	}
}); 
		
 });//ready




function goToConfirmationBlock(){
//When user has clicked on the NEXT button	, and when the form has been validated, display the confirmation block.
	updateConfirmBlock();
	$("#form-step1").fadeOut("fast");
	$("#form-confirmation").fadeIn("slow");
	$(document).scrollTop(0);

}

function initCalculator(){
//Build calculator object from currencies and fees data
	$(".loading").hide();
	
	//check whether the user can create a new request, for standard remittance only)
	if(remittanceType=="2" && ui!="editamount" && ui!="processbalance"){
		if(pageData.maxReached.toLowerCase()=="true"){
			$("#creation-error-nbmax").show();
			return false;
		}
		if(stringToInteger(pageData.nbPendingRequest) > 0){
			$("#creation-error-pending").show();
			return false;
		}
	}
	
	$("#form-step1").fadeIn("low");
	
	var balance = stringToInteger(pageData.userBalance);
    
	calculator=new RemitCalculator({
		isFeeIncludedInYenField: ui=="processbalance",		
		//currencies: currenciesData.currencies,
		//specialExchangeRateDiscount: currenciesData.specialExchangeRateDiscount,	
		isSpecialRateApplied: (pageData.rateType=="BRS"),
		
		
		maxInputYen: (ui=="processbalance") ? balance : 0,//In the CRM, when the action is "Process balance", the user cannot enter more than the customer's balance
		userBalance: balance,
		//userFeeDiscount: userData.feeDiscount,
        
        fees: parsePageDataFees(pageData),
		maxAmountToRemit: stringToInteger(pageData.maxAmountToRemit)
	});
    
    calculator.setCountryCode(beneficiaryForm.data.countryCode);
	
	if(!isNewBeneficiary){
        calculator.setDestinationData(defaultDestinationData);
	}
	
	//If the user is "editing" an existing request, we initialize the calculator field with the user balance
	if(ui=="editamount" && balance>0){
		var fee0=calculator.getFee(balance);
		var fee1=calculator.substractDiscount(fee0,calculator.options.userFeeDiscount);
		var yensToSend=balance - fee1;
		calculator.html.inputYenAmount.val(yensToSend) ;
        calculator.calculateForeignRemit();
	}
}


function cancelPreviousRequest(){
	//if we are in the "edition" mode, the previous request has to be cancelled and deleted from the history
	var options={
		callbackSuccess:function(){
			saveRequest();
		}
	};
	var data={
		transferRequestID: requestID,
		isVisible: "false"
	};
	new IMTAjaxXMLRequest("CancelRemittanceRequest", data, options);	
}

function saveRequest(){
//Save the new request (regaular remittance ("easy remittance") 	or one-time remittance
    showLoading();
    $("#invalid-password").hide();
    var account=null;
    var webMethod="";

    if(isCRM){
        webMethod=(remittanceType=="1") ? "AddBeneficiaryDataForAccount" : "AddRemittanceRequestForAccount";
    }
    else{
        webMethod=(remittanceType=="1") ? "AddBeneficiaryData" : "AddRemittanceRequest";
    }

    new IMTAjaxXMLRequest(
        webMethod,
        $("#form1").serialize()+"&"+$("#form2").serialize(),
        {	
            callbackError1041:function(){
                hideLoading();
                new IMTDialog($("#dialog-same-account"));
            },
            callbackError1496:function(){
                hideLoading();
                new IMTDialog($("#dialog-recipient-number"));
            },				
            container:$("#form2"),
            callbackSuccess:function(xml){
                if(isCRM){
                    submitForm('frmAccountManagement','crm_virtual_accounts.xsl','GetVirtualAccountData');
                }
                else{
                    var data=xml.find("Data");
                    var processComplete=data.find("ProcessComplete").text();
                    var isComplete=(processComplete.toLowerCase()=="true");

                    if(!isComplete) account={
                       bankName:data.find("FinancialInstitutionName").text(),
                       branchName:data.find("BranchName").text(),
                       accountType:data.find("AccountType").text(),
                       accountNumber:data.find("AccountNumber").text(),
                       requestId:data.find("RequestID").text()
                    };
                    hideLoading();
                    showVirtualAccount(account);
                }
            }//callbackSuccess
        }
	);//AjaxXMLRequest object used in IMT application
	
}

function updateConfirmBlock(){
//When the user clicks on "next"button, display all data in the confirmation block.

	$("#form1 .data-source").each(function(index,element){
		var div=$("#form-confirmation .data-view-details").eq(index);
		div.empty();
		var tableSource=$(element).find("table");		
		duplicateTable(tableSource,div);
	});
	
	//Show only the row related to the selected deposit type (BNK or JPB)
	var depositType=getDepositType();
	$("#form-confirmation .deposit-type").hide();
	$("#form-confirmation .deposit-type."+depositType).show();
	
	//only for CRM, show the card number
	var newCard=isNewCard();
	var cardNumber=$("input[name=assignCardNo]").val();
	$("#assign-new-card").toggle(newCard);
	$("#assign-existing-card").toggle(!newCard);
	if (!newCard && cardNumber!=undefined){
		$("#display-card-number").html(cardNumber);
	}

	
	//Remit details  table duplicated as is
	var div=$("#remit-details-confirm").empty();
	
	$(".remit-details .to-be-duplicated").contents().clone().appendTo(div);
	if ($.tooltip) div.find(".tooltip-container").tooltip({
		delay: 200,
		extraClass: "ui-shadow",
		bodyHandler: function() {
			return $(this).find(".tooltip-content").html();
		}
	})
	
	
}//updateConfirmBlock()

function duplicateTable(tableSource,div){
    //Duplicate a table containing labels and fields, replacing input by text values	
    var newTable=$('<table>').appendTo(div);
    var tr=tableSource.find("tr:visible");
    tr.each(function(index,element){            
		var th=$(element).find("th");
        var td=th.next();			
        var fieldValue=getInputText(td);
		var fieldLabel=th.text();
		if(th.find("label").length>0) fieldLabel=th.find("label:visible").text();
		var trNew=$('<tr>').appendTo(newTable);
		trNew.addClass(element.className);
        trNew.append('<th>'+fieldLabel+'</th><td>'+fieldValue+'</td>');
    });
	
}

function getInputText(td){
    //Get the text content of a table cell used in the main form (to be displayed in the confirmation table)	
    var text="";
    var inputText=td.find("input[type=text]");
    var inputRadio=td.find("input[type=radio]");
    var select=td.find("select");
	
    if(inputText.is(":visible") && inputText.length>0) return inputText.val();	
	
    if(inputRadio.length>0){
        var selected=td.find("input:checked");
        text=selected.next().text();
        return text;
    }	
	
    if(select.length>0){
        var o=select.get()[0];
        return o.options[o.selectedIndex].text;		
    }
	
    text=td.text();		
	
    return text;
}

function showVirtualAccount(account){
//Display the last block of the processus
	var div=null;
	if(account){
	  $("#virtualaccount-bank").html(account.bankName);
	  $("#virtualaccount-branch").html(account.branchName);
	  $("#virtualaccount-accounttype").html(account.accountType);
	  $("#virtualaccount-accountnumber").html(account.accountNumber);
	}
	
	$("#form-confirmation").hide();
	if(remittanceType=="1"){
		//Regular remittance ("easy transfers")
		var depositType=getDepositType();
		div=$("#final-page-easy-account-"+depositType);
	}
	else{
		//one-time remittance,: 2 cases, a deposit is needed or not
		if(account){
			div=$("#final-page-one-time-deposit-needed");
		}
		else{
			div=$("#final-page-one-time-no-deposit");
		}
	}
	div.fadeIn("slow");
		
}


function checkRequestCreation(){
//Checks whether the user is allowed to create a new request	
	new IMTAjaxXMLRequest(
				(isCRM) ? "GetUserRemittanceConditionsForAccount" : "GetUserRemittanceConditions",
				null,
				{
					container: $("#check-creation"),
					callbackSuccess: function(xml){
						var strPendingRequest=xml.find("RemitPendingRequest").text();
						var strMaxRequest=xml.find("RemitMaxNumberReachedBank").text();

						if(strPendingRequest != "0"){
							$("#creation-error-pending").show();
							return false;
						}
						if(strMaxRequest=="True"){
							$("#creation-error-nbmax").show();
							return false;
						}
						$("#form-step1").fadeIn("low");
					}
				}
		);//AjaxXMLRequest object used in IMT application	
}

function submitFormStep1(form){
//Submit the first form of the page ("NEXT" button) => show confirmation block if content is OK
//or launch rge process balance request
	
	beneficiaryForm.querySaveForm(form);

	//check whether values have been entered in the calculator
	if((remittanceType=="2" && ! calculator.validate())){
		return false;
	}
	
	if(ui=="processbalance"){
		new IMTAjaxXMLRequest(
			"AddRemittanceRequestForAccount",
			form.serialize(),
			{
				callbackSuccess:function(){
					new IMTDialog("#dialog-process-balance-success",{
						onClose: function(){
							submitForm('frmAccountManagement','crm_virtual_accounts.xsl','GetVirtualAccountData');
						}
					});
				},
				container: $("#form-step1"),
				debug: false
			}
		);//AjaxXMLRequest object used in IMT application
		return;
	}
	
	if (remittanceType=="2"){
		//standard remittance
		new IMTAjaxXMLRequest(
				"ConfirmRemittanceRequest",
				form.serialize(),
				{
					callbackSuccess:function(){
						goToConfirmationBlock();
						if(isCRM) getRealTimeRate()//only for CRM update the Real time exchange rate (see crm_virtual_account.js);
					},
					container: $("#form-step1")
				}
		);//AjaxXMLRequest object used in IMT application					
	}
	else{
		//easy remittance (no calculator) => display confirmation block without server-validation
		goToConfirmationBlock();
	}
}

function submitFormStep2(form){	
		//Submit the second form of the page, that contains the transaction password.
		if(ui=="editamount"){
			cancelPreviousRequest();
		}
		else{
			saveRequest();	
		}
}

function getDepositType(){
	//Return the selected deposit type : JPB (yuucho) or BNK
	return $("input[name=depositType]:checked").val();	
}
function isNewCard(){
	//Return true if the user has selected "new card" assign method, in case of JPB deposits
	return $("input[name=assignMethod]:checked").val() == "SYS";	
}