/*
JavaScript code for "forgot_password" form.
last update Michael @Osaka 2012-01-20
*/
$(document).ready(function(){
						   
	jQuery.validator.messages.required="&nbsp;";
						   
	$("form").validate({
		 submitHandler:function(form){
            requestNewPassword(form);
        },
		rules:{
			confirmEmailAddress: {
				equalTo:"input[name=emailAddress]"
			},
		},
		errorPlacement: function(error, element) { 
			var tdError=element.parents("td");
			error.appendTo(tdError);
       },
	   
	   highlight: function(element, errorClass, validClass) {
			 //1. Highlight input or select element it self
			 var x=$(element);
			 if ( $(element).is(":radio") ||  $(element).is(":hidden") ) x=$(element).parent();
			 x.addClass(errorClass).removeClass(validClass);
			 
			 //2. Hightlight table cell before cell containg the field
			 /*x.parents("td").prev().addClass(errorClass).removeClass(validClass); **/
		 },
  		unhighlight: function(element, errorClass, validClass) {
			//console.log("unhighlight="+element.name)
			 var x=$(element);
			 if(x.hasClass("ignore-validation")) return false;
			 if ( x.is(":radio") ||  x.is(":hidden") ) x=$(element).parent();
			 x.removeClass(errorClass).addClass(validClass);
			 
			 /*x.parents("td").prev().removeClass(errorClass).addClass(validClass);*/
		},
	   
	   
	});
						   				   
	$("#birth-date-container").selectYearMonthDay({
		input: $("#birthDate") ,
		selectMonth:$("#month-list"),
		callback: function(){
			$("#birthDate") .valid();
		}
	}); 
	
});

function requestNewPassword(form){
	var options={
		container: $(form)
	};
	//"ResendInitialPassword""GetCustomerHomeData"
	new IMTAjaxXMLRequest("ResendInitialPassword", $(form).serialize()+"&confirmEmailAddress="+$("input[name=emailAddress]").val(), options);
}