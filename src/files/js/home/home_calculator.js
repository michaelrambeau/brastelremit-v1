/*
JS Code for home_calculator.xsl page
Last update : Michael @Osaka 2013-08-02 anonymous option
*/
var calculator=null;
var beneficiary=null;

$(document).ready(function(){
						   
	$(".step1,.step2,.step3,.calculator-details").hide();
	
	showHideStep(2,false);
	showHideStep(3,false);
						   	
	initCalculator();
	
	var inputMethod=$("#inputMethod").change(function(){
		if($(this).val()=="") return; 
		var userEntersYens= ! ($(this).val()=="2");
		calculator.isFromYen=userEntersYens;
		$(".enter-deposit").toggle(userEntersYens);
		$(".enter-delivery").toggle(!userEntersYens);
		showHideCalculator(true);
        calculator.clearError();
		//Put the focus on the next visible text field
		$(this).closest("td").find("input:visible").select();
	});
	inputMethod.val("");
	 
	beneficiary=new BeneficiaryForm({
		isNewRecord: true,
		useValidationPlugin:false,
		useHTMLdefaultText	: true,
        form: null,
        deliveryMethods : pageData.deliveryMethods,
        
		
		callbackChangeCountry:function(countryCode){
			calculator.setCountryCode((countryCode)); // set the current country
			$("#cell1 .currency").hide();	
			$("#delivery-time-container").hide();
			showHideStep(2,true);
			showHideStep(3,false);
			showHideCalculator(false);	
            $(".currency").show();
            $(".currency-translation").hide();
            $("#currency-"+countryCode).show();
		},
		
		callbackChangeDeliveryMethod:function(deliveryMethodCode){
			showHideStep(3,false);
			updateDeliveryTime(deliveryMethodCode);
			showHideCalculator(false);						
		},
		
		callbackChangeBank:function(bank){
			var brsAgentID=bank.brsAgentID;
			//disabled by mike for multibroker calculator.switchBank(brokerCode,agentCode);
			showHideStep(3,true);
			if(inputMethod.val() != "") showHideCalculator(true);
		},

		callbackGetDestinationData: function(destinationData){
			if(window.console) console.log("Update destination data",destinationData);
			calculator.setDestinationData(destinationData);
            calculator.calculate();
		}
		
	});
	

});//.ready()

function initCalculator(){
//Build calculator object from currencies and fees data
	var combo=$("#selectCountry");
	calculator=new RemitCalculator({
		fees: parsePageDataFees(pageData),
		maxAmountToRemit: pageData.maxAmountToRemit,
		anonymous:true
	});
	
	$(".loading").fadeOut();
	$(".step1").show();
	$(".step2,.step3").show().addClass("disabled");
}

function updateDeliveryTime(deliveryMethod){
	//called when a delivery method is selected (in step#2 block)
	$(".delivery-time").hide();
	$("#delivery-time-container").show();
	$(".delivery-method"+deliveryMethod).show();
	
}

function showHideStep(stepNumber,display){
	//show/hide ithe square blocks used to enter data
	if(display){
		$(".step"+stepNumber).removeClass("disabled");
		$(".step"+stepNumber).find("input,select").removeAttr("disabled");
	}
	else{
		$(".step"+stepNumber).addClass("disabled");
		$(".step"+stepNumber).find("input,select").attr("disabled","disabled");
	}
	if(stepNumber==3){
		$(".step3").find(".yellow-block").toggle(display);
	}
}

function showHideCalculator(display){
	//Show/hide calculator results block
	var div=$(".remit-details");
	if(display){
		div.fadeIn();
	}
	else{
		div.hide();			
        calculator.clearError();
	}
}