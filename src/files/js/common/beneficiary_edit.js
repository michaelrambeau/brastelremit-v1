/*
JS code used by "Edit Beneficiary" pages, in both CRM and Web site
Last update : Michael @Osaka 2013-08-28 Multibroker first release
*/

var beneficiaryForm=null;
var calculator=null;

$(document).ready(function(){
						   
	beneficiaryForm=new BeneficiaryForm(
        {
            deliveryMethods : pageData.deliveryMethods
        },
        data
    );//data is a global variable defined in the XSL page
		
	jQuery.validator.messages.required="";
	
	$("#form-beneficiary").validate({
        debug:true,
		submitHandler: saveBeneficiary,
		
		errorClass:"field-validation-error",
		
		rules:{
			transferReasonOther: {
				required: isTransferReasonOther
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
 			error.insertAfter(element);//by default the error msg is displayed just after the field itself
       },
		
		highlight: function(element, errorClass, validClass) {
			 //1. Highlight input or select element it self
			 var field=$(element);
			 var x=field;
			 if (field.is(":radio") || field.is("input[type=password]")) x=field.parent();
			 if(field.is("[name=depositType]")){
				 return;
				 x=field.parents(".deposit-type");
			 }
			 x.addClass(errorClass).removeClass(validClass);
			 
			 //2. Hightlight table next cell
			 $(element).parents("td").next().addClass(errorClass).removeClass(validClass); 
		},
		unhighlight: function(element, errorClass, validClass) {
			 var x=$(element);
			 if ($(element).is(":radio") || $(element).is("input[type=password]")) x=$(element).parent();
			 x.removeClass(errorClass).addClass(validClass);
			 $(element).parents("td").next().removeClass(errorClass).addClass(validClass);
		}
		
	});//validate	   
});//ready

function saveBeneficiary(form){
	showLoading();
	var customerID=$("input#accountID").val();//hidden field in the CRM
	var isCRM=(customerID!=undefined) && (customerID!="") ;
	if(window.console) console.log($(form).serialize());
	beneficiaryForm.querySaveForm($(form));
	new IMTAjaxXMLRequest(
		(isCRM) ? "SaveBeneficiaryData" : "SaveBeneficiaryInformations",
		$(form).serialize(),
		{
			container: $(".confirm-buttons"),
			callbackError1041:function(){
                hideLoading();
				new IMTDialog($("#dialog-same-account"));
			},			
			callbackSuccess:function(xml){
				if(typeof(goTo)=="function"){
					//web site
					goTo("customer_virtual_account_easy.xsl&action=GetVirtualAccountInformation");
				}
				else{
					//CRM
					submitForm('frmAccountManagement','crm_virtual_accounts.xsl','GetVirtualAccountData','accountID:'+customerID);
				} 
			}
		}
	);//AjaxXMLRequest object used in IMT application
}