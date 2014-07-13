/*
JS code for "Accounts to deposit" page in both IMT web site and CRM.
Last update Michael 2013/08/28 confirmation message displayed after the refund request
*/

var balance=0;
var customerID;
var debugMode=false;

var VA=function(settings){
	
	var defaultSettings={
		methods: {
			changeBank: "ConvertBankAccountData",
			deleteAccount: "DeleteVirtualAccountLinked",
			cardCopy: "AddPaymentCardRequest",
			
			saveRecipient: "SaveBeneficiaryData",
			saveRequest: "AddRemittanceRequest",
			getUserInfo: "GetUserRemittanceConditions"
		},
		data: {}//empty object for the web site
	};
	return{
		settings: defaultSettings
	}//return
}();//VirtualAccounts singleton

$(document).ready(function(){
	jQuery.validator.messages.required="";
	customerID=$("input#accountID").val();//hidden field in the CRM
	debugMode=(getParamVal("debug")=="1");
	
	$("#refund-button").click(function(){
		new IMTDialog("#dialog-refund",{
			reloadOnClose:false,
			useValidationPlugin:false,
			webMethod:"AddRefundRequest",
			debug: false,
			onSuccess:function(){
				$("#refund-button").hide();//hide the refund button
				$(".ajax-result-ok").fadeIn();
			}
		});
	});
	
	$("select.action-list").val("edit");//Default value of the combobox used to select an action edit / delete / change deposit type 
	$(".go-button").click(launchEasyAccountAction);//ok button used to launch the selected action
	
/*	$("input[name=assignMethod]").change(function(){
		var form=$(this).closest("form");
		var value=$(this).val();
		console.log(value);
    	displayCardNumber=value=="EXT";
  		form.find("input[name=assignCardNo]").toggle(displayCardNumber);
		form.valid();
	});*/
    	
});//.ready

function getBeneficiaryData(element){
//From a given button that was pushed, return the recipient data, stored in the id attribute of the parent block element.
	var div=element.parents("div.block-account");
	var form=div.find("form.account-data");
	var id=div.get()[0].id;
	//id format : accountID-destAddressID-virtualAccountID-depositType
	var array=id.split("-");
	var data={
		//accountID: array[0],
		destAddressID: form.find("input[name=destAddressID]").val()	,
		depositType:array[2],
		cardNo: form.find("input[name=CardNumber]").val(),
		virtualAccountID: form.find("input[name=virtualBankAccID]").val()		
	};
	return data;
}



function launchEasyAccountAction(){
//Click event of the OK button next to the "action" combo-box
	var button=$(this);
	var container=button.parents(".block-account");
	var data=$.extend({}, VA.settings.data, getBeneficiaryData(button))
	var form=container.find("form.account-data");
	
	//Get the selected action
	var select=container.find("select");
	var action=select.val();
	
	var isCRM=(customerID!=undefined) && (customerID!="") ;
	
	switch(action){
		
		case "view"://available only for CRM
			submitForm('frmAccountManagement','crm_beneficiary_details.xsl','GetBeneficiaryData','virtualBankAccID:'+data.virtualAccountID+';destAddressID:'+data.destAddressID);
			break;
			
		case "edit"://available only for web site
			goTo("customer_beneficiary_edit.xsl&action=GetBeneficiaryInformation&destAddressID="+data.destAddressID+'&virtualBankAccID='+data.virtualAccountID);
			break;
			
		case "bnk-to-jpb":
			data.oldDepositType=data.depositType;
			data.newDepositType="JPB";
			var optionsValidation={
				rules:{
					assignMethod:{
						required: true
					},
  			  		assignCardNo:{
          				required: function(element) { //required if the user selects "assign an existing card"
							return ($("input[name=assignMethod]:checked").val()=="EXT")
						} 
					}
				}
			};
			new IMTDialog($("#dialog-change-bank-step1"),{
				webMethod: VA.settings.methods.changeBank ,
				data:data,				
				debug: debugMode,
				onError1476:function(){
					new IMTDialog($("#dialog-invalid-card-number"));
				},
				onError1041:function(){
					new IMTDialog($("#dialog-same-account"));
				}, 				
    			onSuccess:function(){
					new IMTDialog($("#dialog-change-bank-step2"),{
						reloadOnClose:true,
					});
				}			
			},optionsValidation);//IMTDialog		
			break;
			
		case "jpb-to-bnk"://action for CRM only
		
			data.oldDepositType=data.depositType;
			data.newDepositType="BNK";
			
			new IMTDialog($("#dialog-jpb-to-bnk-step1"),{
				webMethod: VA.settings.methods.changeBank,
				data:data,				
				debug: debugMode,
				onError1041:function(){
					new IMTDialog($("#dialog-same-account"));
				}, 								
    			onSuccess:function(){
					new IMTDialog($("#dialog-jpb-to-bnk-step2"),{
						reloadOnClose:true
					});
				}			
			});//IMTDialog
			break;
			
		case "delete":
			var webMethod=VA.settings.methods.deleteAccount
			new IMTDialog($("#dialog-delete-account-step1"),{
				webMethod: webMethod,
				data: data,
				debug: debugMode,
    			onSuccess:function(){
					new IMTDialog($("#dialog-delete-account-step2"),{
						reloadOnClose:true
					});	
				}			
			});//IMTDialog		
			break;
		case "card-copy"://Request card copy
			data.requestType=35;
			new IMTDialog($("#dialog-card-copy-step1"),{
				webMethod: VA.settings.methods.cardCopy,
				data: data,
				debug: debugMode,
				useValidationPlugin:false,
    			onSuccess:function(){
					new IMTDialog($("#dialog-card-copy-step2"),{
						reloadOnClose:true
					});
				}			
			});//IMTDialog			
			break;
			
		case "card-change"://for CRM only
			data.oldDepositType ="JPB";
			data.newDepositType ="JPB";
			data.assignMethod="EXT";
			data.accountID= customerID;
			new IMTDialog($("#dialog-card-change-step1"),{
				webMethod: "ConvertBankAccountDataForAccount",
				data: data,
				debug: false,
				useValidationPlugin: true,
    			onSuccess:function(){
					new IMTDialog($("#dialog-card-change-step2"),{
						reloadOnClose:true
					});
				},
				onError1476:function(){
					new IMTDialog($("#dialog-invalid-card-number"));
				}
			});//IMTDialog						
			
			break;
			
		case "process-balance"://for CRM only
			var param="ui:processbalance;remittanceType:2";
			submitForm(form[0].id,'crm_virtual_accounts_request.xsl','GetBeneficiaryData',param);
			break;
	}
}