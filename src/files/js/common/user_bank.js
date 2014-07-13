/*
JS code used by both registration form and edit personal information page
Contains the code relative to the user's financial institution
*/

FIELD_FINANCIAL_INSTITUTION="financialInstitutionType";//name of the radio button used to select postal bank or bank
JAPAN_POSTAL_BANK_NAME="post_office_bank";//The value that is stored in "bankName" field when postal bank is selected.

function updateValidator(){
	
}

$(document).ready(function(){
	readHiddenField()
	var field=$("input[name="+FIELD_FINANCIAL_INSTITUTION+"]");
	field.change(toggleFinancialType);
});

function toggleFinancialType(){
//onchange event of "Financial institution type"	
	var field=$("input[name="+FIELD_FINANCIAL_INSTITUTION+"]");
	var x=field.filter(":checked").val()
	showHideRows(x);
	updateHiddenFields();
}

function showHideRows(x){
	var prefix="financialInstitutionType";
	$("tr."+prefix+x).show();
	if(x=="1"){
		$("tr."+prefix+"2").hide();
	}
	if(x=="2"){
		$("tr."+prefix+"1").hide();
		
	}	
}

function readHiddenField(){
//When the page is loaded, read hidden fields values and update UI fields
	var number=$("input[name=accountNumber]").val();
	var name=$("input[name=bankName]").val();
	var financialInstitutionType="";
	if(name==JAPAN_POSTAL_BANK_NAME){
		financialInstitutionType="2"
		var array=number.split("-");
		var l=array.length;
		$("input[name=UIPostalAccountNumber1]").val(array[0]);
		$("input[name=UIPostalAccountNumber3]").val(array[l-1]);
		if(l==3) $("input[name=UIPostalAccountNumber2]").val(array[1]);
	}
	else{
		financialInstitutionType="1"
		$("input[name=UIBankAccountNumber]").val(number);
		$("input[name=UIBankName]").val(name);
	}
	//Update the radio button
	$("#financialInstitutionType-"+financialInstitutionType).attr("checked","checked");
	
	showHideRows(financialInstitutionType);
}

function updateHiddenFields(){
//When document is saved, update the hidden fields (used to store data) from the UI fields.
	var x=getFinancialInstitutionType();
		
	var accountNumber=(x=="2") ? getPostalAccountNumber() : $("input[name=UIBankAccountNumber]").val()
	var bankName=(x=="2") ? JAPAN_POSTAL_BANK_NAME : $("input[name=UIBankName]").val();
	
	$("input[name=accountNumber]").val(accountNumber);
	$("input[name=bankName]").val(bankName);
	
	if(x=="2"){
		//Empty branch field for postal bank
		$("input[name=branchName]").val("");
	}
}

function getPostalAccountNumber(){
//Returns the postal account number (from the  3f ields)	
	var postalAccountNumber=$("input[name=UIPostalAccountNumber1]").val();
	var x2=$("input[name=UIPostalAccountNumber2]").val()
	if (x2!="") postalAccountNumber=postalAccountNumber+"-"+x2;
	postalAccountNumber=postalAccountNumber+"-"+$("input[name=UIPostalAccountNumber3]").val();
	return postalAccountNumber;
}


function getFinancialInstitutionType(){
	var field=$("input[name="+FIELD_FINANCIAL_INSTITUTION+"]");
	return field.filter(":checked").val();
}

function isPostalBank(){
		return (getFinancialInstitutionType()=="2");
}